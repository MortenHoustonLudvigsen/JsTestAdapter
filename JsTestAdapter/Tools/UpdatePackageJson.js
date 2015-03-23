var fs = require('fs');
var semver = require('semver');
var argv = require('yargs').argv;
var toolsPackage = JSON.parse(fs.readFileSync(argv.toolsPackageFile, 'utf8'));
var projectPackage = JSON.parse(fs.readFileSync(argv.projectPackageFile, 'utf8'));
projectPackage.devDependencies = projectPackage.devDependencies || {};
projectPackage.dependencies = projectPackage.dependencies || {};
updateDependencies(toolsPackage.devDependencies, 'devDependencies');
updateDependencies(toolsPackage.dependencies, 'dependencies');
fs.writeFileSync(argv.projectPackageFile, JSON.stringify(projectPackage, undefined, '  '), { encoding: 'utf8' });
function updateDependencies(toolsDependencies, section) {
    if (toolsDependencies) {
        for (var moduleName in toolsDependencies) {
            if (toolsDependencies.hasOwnProperty(moduleName)) {
                updateModuleDependency(toolsDependencies, section, moduleName);
            }
        }
    }
}
function updateModuleDependency(toolsDependencies, section, moduleName) {
    var projectDependencies = getProjectDependencies(moduleName) || projectPackage[section];
    var toolsVersion = toolsDependencies[moduleName];
    var projectVersion = projectDependencies[moduleName];
    if (!projectVersion) {
        projectDependencies[moduleName] = toolsVersion;
        return;
    }
    if (semver.ltr(getLowestVersion(projectVersion), toolsVersion, true)) {
        projectDependencies[moduleName] = toolsVersion;
        return;
    }
}
function getProjectDependencies(moduleName) {
    if (moduleName in projectPackage.devDependencies) {
        return projectPackage.devDependencies;
    }
    if (moduleName in projectPackage.dependencies) {
        return projectPackage.dependencies;
    }
}
function getLowestVersion(rangeStr) {
    var range = new semver.Range(rangeStr);
    var result;
    range.set.forEach(function (comps) {
        comps.forEach(function (comp) {
            if (comp.operator === '>') {
                if (!result || semver.lt(comp.semver.version, result)) {
                    result = comp.semver.version;
                }
            }
            else if (comp.operator === '>=') {
                if (!result || semver.lte(comp.semver.version, result)) {
                    result = comp.semver.version;
                }
            }
        });
    });
    return result;
}
//# sourceMappingURL=UpdatePackageJson.js.map