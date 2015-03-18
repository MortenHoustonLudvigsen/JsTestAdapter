param($installPath, $toolsPath, $package, $project)

function CreateTextFile($path, $text)
{
    $Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding($False)
    [System.IO.File]::WriteAllLines($path, $text, $Utf8NoBomEncoding)
}

function GetRelativePath($base, $path)
{
    $tmp = Get-Location
    Set-Location $base
    $result = Resolve-Path -relative $path
    Set-Location $tmp
    return $result.Replace("\", "/")
}


$projectDir = [System.IO.Path]::GetDirectoryName($project.FullName)

$packageDir = GetRelativePath $projectDir $installPath
$TestServerPath = Join-Path $packageDir "TestServer"
$TestServerPath = $TestServerPath.Replace("\", "/")

Write-Host "projectDir: $projectDir"
Write-Host "packageDir: $packageDir"
Write-Host "TestServerPath: $TestServerPath"


$JsTestAdapterConfigPath = Join-Path $projectDir "JsTestAdapter.json"
 
CreateTextFile $JsTestAdapterConfigPath @"
{
    "Package": "$packageDir",
    "TestServer": "$TestServerPath"
}
"@

$project.ProjectItems.AddFromFile($JsTestAdapterConfigPath)


# 
# 
# Write-Host "installPath: $installPath"
# Write-Host "toolsPath: $toolsPath"
# Write-Host "package: $package"
# Write-Host "TestServerPath: $TestServerPath"
# Write-Host "projectDir: $projectDir"
# Write-Host "testServerPackage: $testServerPackage"
# 