param($installPath, $toolsPath, $package, $project)

$projectDir = [System.IO.Path]::GetDirectoryName($project.FullName)
$projectName = $project.Name
$toolsDir = Join-Path $installPath "Tools"

function GetRelativePath($base, $path)
{
    $tmp = Get-Location
    Set-Location $base
    $result = Resolve-Path -relative $path
    Set-Location $tmp
    return $result.Replace("\", "/")
}

function CreateTextFile($path, $projectItems, $text)
{
    $Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding($False)
    [System.IO.File]::WriteAllLines($path, $text, $Utf8NoBomEncoding)
    return $projectItems.AddFromFile($path)
}

function CopyFile($from, $to, $projectItems)
{
    Copy-Item $from $to
    return $projectItems.AddFromFile($to)
}

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
$tsdFile = Join-Path $toolsDir "tsd.json"
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

$packageItem = $project.ProjectItems | Where-Object { $_.Name -eq "package.json" } | Select-Object -First 1

if (!$packageItem)
{
    $packageFile = Join-Path $projectDir "package.json"
    CreateTextFile $packageFile $project.ProjectItems $defaultPackageFile
}

Push-Location $projectDir
$packageFile = Join-Path $toolsDir "package.json"
$package = Get-Content -Raw -Path $packageFile | ConvertFrom-Json

$package.dependencies.psobject.properties | foreach {
    $module = $_.Name
    $version = $_.Value
    $command = "npm install $module --save"
    Write-Host $command
    Invoke-Expression $command
}

$package.devDependencies.psobject.properties | foreach {
    $module = $_.Name
    $version = $_.Value
    $command = "npm install $module --save-dev"
    Write-Host $command
    Invoke-Expression $command
}

Pop-Location

##########################################################
# Create Gruntfile.ts

$defaultGruntfileTs = @"
import jsTestAdapter = require('./Grunt/Index');

function config(grunt) {
    grunt.initConfig({
    });

    jsTestAdapter.config(grunt, {
        name: '$projectName'
    });

    grunt.registerTask('default', []);
}

export = config;
"@

$gruntfileItem = $project.ProjectItems | Where-Object { $_.Name -eq "Gruntfile.ts" -or $_.Name -eq "Gruntfile.js" } | Select-Object -First 1
if (!$gruntfileItem)
{
    $gruntfileTs = Join-Path $projectDir "Gruntfile.ts"
    $gruntfileJs = Join-Path $projectDir "Gruntfile.js"
    $gruntfileJsMap = Join-Path $projectDir "Gruntfile.js.map"
    $gruntFileItem = CreateTextFile $gruntfileTs $project.ProjectItems $defaultGruntfileTs

    CreateTextFile $gruntfileJs $gruntFileItem.ProjectItems ""
    CreateTextFile $gruntfileJsMap $gruntFileItem.ProjectItems ""
}


##########################################################
# Done

Write-Host Done

