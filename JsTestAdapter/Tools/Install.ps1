param($installPath, $toolsPath, $package, $project)

$projectDir = [System.IO.Path]::GetDirectoryName($project.FullName)
$toolsDir = Join-Path $installPath "Tools"

function GetRelativePath($base, $path)
{
    $tmp = Get-Location
    Set-Location $base
    $result = Resolve-Path -relative $path
    Set-Location $tmp
    return $result.Replace("\", "/")
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
# Install npm packages in TestServer

Write-Host Install npm packages in TestServer

Push-Location $projectDir\TestServer
npm install
Pop-Location

##########################################################
# Done

Write-Host Done

