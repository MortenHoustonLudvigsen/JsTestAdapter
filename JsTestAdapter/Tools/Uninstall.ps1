param($installPath, $toolsPath, $package, $project)

$projectDir = [System.IO.Path]::GetDirectoryName($project.FullName)

function DeleteItems($parent, $items)
{
    foreach ($item in $items)
    {
        $name = $item.Name
        $fullName = "$parent/$name"
        DeleteItems $fullName $item.ProjectItems
        Write-Host Deleting $fullName
        $item.Delete
    }
}

function DeleteNodeModules($name)
{
    $folderItem = $project.ProjectItems | Where-Object { $_.Name -eq $name } | Select-Object -First 1
    if ($folderItem)
    {
        Write-Host Deleting items from folder $name
        DeleteItems $name $folderItem.ProjectItems

        $dir = $folderItem.FileNames(0)
        $nodeModules =  Join-Path $dir "node_modules"
        if (Test-Path $nodeModules)
        {
            Write-Host Deleting node_modules from folder $name
            Remove-Item -Recurse -Force $nodeModules
        }
    }
}

DeleteNodeModules "TestServer"
DeleteNodeModules "Grunt"

Write-Host Done