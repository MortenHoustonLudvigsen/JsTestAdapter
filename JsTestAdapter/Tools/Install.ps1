param($installPath, $toolsPath, $package, $project)

function GetRelativePath($base, $path)
{
    $tmp = Get-Location
    Set-Location $base
    $result = Resolve-Path -relative $path
    Set-Location $tmp
    return $result.Replace("\", "/")
}

function GetAssemblyPath()
{
    $fullPath = $project.Properties.Item("FullPath").Value.ToString()
    $outputPath = $project.ConfigurationManager.ActiveConfiguration.Properties.Item("OutputPath").Value.ToString()
    #$outputDir = Join-Path $fullPath $outputPath
    $outputDir = $outputPath
    $outputFileName = $project.Properties.Item("OutputFileName").Value.ToString()
    $assemblyPath = Join-Path $outputDir $outputFileName
    return $assemblyPath
}

function CreateTextFile($path, $projectItems, $text)
{
    $Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding($False)
    [System.IO.File]::WriteAllLines($path, $text, $Utf8NoBomEncoding)
    return $projectItems.AddFromFile($path)
}

function CreateTextFileIfNotExists($path, $projectItems, $text)
{
    if (Test-Path $path)
    {
        return $projectItems.AddFromFile($path)
    }
    else
    {
        return CreateTextFile $path $projectItems $text
    }
}

$projectDir = [System.IO.Path]::GetDirectoryName($project.FullName)
$projectName = $project.Name
$assemblyPath = GetAssemblyPath
$assemblyDir = [System.IO.Path]::GetDirectoryName($assemblyPath)
$assemblyName = [System.IO.Path]::GetFileName($assemblyPath)

##########################################################
# Create JsTestAdapter.json

$JsTestAdapterJsonFile = Join-Path $projectDir "JsTestAdapter.json"
CreateTextFile $JsTestAdapterJsonFile $project.ProjectItems @"
{
    "InstallPath": "$(GetRelativePath $projectDir $installPath)",
    "ToolsPath": "$(GetRelativePath $projectDir $toolsPath)"
}
"@

##########################################################
# Create source.extension.vsixmanifest

$vsixGuid = [guid]::NewGuid()
$defaultVsix = @"
<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Id="$projectName.$vsixGuid" Version="x.x.x" Language="en-US" Publisher="" />
    <DisplayName>$projectName</DisplayName>
    <Description xml:space="preserve">$projectName</Description>
    <MoreInfo></MoreInfo>
    <License></License>
  </Metadata>
  <Installation>
    <InstallationTarget Version="[12.0,14.0]" Id="Microsoft.VisualStudio.Pro" />
    <InstallationTarget Version="[12.0,14.0]" Id="Microsoft.VisualStudio.Premium" />
    <InstallationTarget Version="[12.0,14.0]" Id="Microsoft.VisualStudio.Ultimate" />
  </Installation>
  <Dependencies>
    <Dependency Id="Microsoft.Framework.NDP" DisplayName="Microsoft .NET Framework" Version="[4.5,)" />
  </Dependencies>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.MefComponent" Path="$assemblyName" />
    <Asset Type="UnitTestExtension" Path="$assemblyName" />
  </Assets>
</PackageManifest>
"@

$vsixFile = Join-Path $projectDir "source.extension.vsixmanifest"
CreateTextFileIfNotExists $vsixFile $project.ProjectItems $defaultVsix


##########################################################
# Do not copy Visual Studio assemblies locally

foreach ($reference in $project.Object.References)
{
    if ($reference.Name.StartsWith("Microsoft.VisualStudio"))
    {
        Write-Host Do not copy $reference.Name locally
        $reference.CopyLocal = $false
    }
}

##########################################################
# Create Gruntfile.js

$defaultGruntfile = @"
var jsTestAdapter = require('./Grunt/Index');

module.exports = function (grunt) {
    grunt.initConfig({
    });

    jsTestAdapter.config(grunt, {
        name: '$projectName',
        bin: '$assemblyDir',
        rootSuffix: '$projectName'
    });

    grunt.registerTask('CreatePackage', [
        'clean:JsTestAdapter',
        'copy:JsTestAdapter',
        'JsTestAdapter-flatten-packages',
        'xmlpoke:JsTestAdapter-vsix',
        'JsTestAdapter-CreateContentTypes',
        'compress:JsTestAdapter'
    ]);

    grunt.registerTask('ResetVS', [
        'JsTestAdapter-ResetVisualStudio'
    ]);

    grunt.registerTask('RunVS', [
        'JsTestAdapter-ResetVisualStudio',
        'JsTestAdapter-RunVisualStudio'
    ]);

    grunt.registerTask('default', ['CreatePackage']);
}
"@

$gruntfileJs = Join-Path $projectDir "Gruntfile.js"
CreateTextFileIfNotExists $gruntfileJs $project.ProjectItems $defaultGruntfile


##########################################################
# Nest .js and .js.map

function NestItem($parent, $projectItems, $item, $extension)
{
    $name = $item.Name
    $file = $item.FileNames(0)
    if ($name.EndsWith($extension))
    {
        $tsName = $name.Substring(0, $name.Length - $extension.Length) + ".ts"
        $tsItem = $projectItems | Where-Object { $_.Name -eq $tsName } | Select-Object -First 1
        if ($tsItem)
        {
            Write-Host Nesting $parent/$name
            $item.Remove
            $tsItem.ProjectItems.AddFromFile($file)
        }
    }
}

function NestItems($parent, $projectItems)
{
    if ($projectItems)
    {
        foreach ($item in $projectItems)
        {
            $name = $item.Name
            NestItem $parent $projectItems $item ".js"
            NestItem $parent $projectItems $item ".js.map"
            NestItems $parent/$name $item.ProjectItems
        }
    }
}

NestItems "TestServer" $project.ProjectItems.Item("TestServer").ProjectItems
NestItems "Grunt" $project.ProjectItems.Item("Grunt").ProjectItems

##########################################################
# Add typescript typings

Push-Location $projectDir
$tsdFile = Join-Path $toolsPath "tsd.json"
$tsd = Get-Content -Raw -Path $tsdFile | ConvertFrom-Json
$tsd.installed.psobject.properties | foreach {
    $module = $_.Name.Substring(0, $_.Name.IndexOf("/"))
    $command = "tsd query $module --action install --save"
    Write-Host $command
    Invoke-Expression $command
}
$project.ProjectItems.AddFromFile([System.IO.Path]::Combine($projectDir, "tsd.json"))
$project.ProjectItems.AddFromDirectory([System.IO.Path]::Combine($projectDir, "typings"))
Pop-Location

##########################################################
# Install npm packages

$defaultPackageFile = @"
{
  "name": "$projectName",
  "version": "0.0.1",
  "private": true
}
"@

Write-Host Install npm packages

$toolsPackageFile = Join-Path $toolsPath "package.json"
$projectPackageFile = Join-Path $projectDir "package.json"
CreateTextFileIfNotExists $projectPackageFile $project.ProjectItems $defaultPackageFile

Push-Location $toolsPath
npm install
Pop-Location

$updatePackageJsonFile = Join-Path $toolsPath "UpdatePackageJson.js"
node "$updatePackageJsonFile" --toolsPackageFile "$toolsPackageFile" --projectPackageFile "$projectPackageFile"

Push-Location $projectDir
npm install
Pop-Location

##########################################################
# Done

Write-Host Done

