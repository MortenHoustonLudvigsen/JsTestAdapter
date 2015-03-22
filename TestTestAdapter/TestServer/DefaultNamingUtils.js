function getDisplayName(spec, server) {
    return spec.description.replace(/\./g, '-');
}
exports.getDisplayName = getDisplayName;
function getFullyQualifiedName(spec, server) {
    var suite = spec.suite.slice(0);
    if (server.projectName) {
        suite.unshift(server.projectName);
    }
    var className = suite.join(' / ');
    return [className, spec.description].map(function (s) { return s.replace(/\./g, '-'); }).join('.');
}
exports.getFullyQualifiedName = getFullyQualifiedName;
//# sourceMappingURL=DefaultNamingUtils.js.map