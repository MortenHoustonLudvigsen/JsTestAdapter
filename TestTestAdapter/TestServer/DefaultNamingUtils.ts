import Specs = require('./Specs');

export function getDisplayName(spec: Specs.Spec, server: Specs.Server): string {
    return spec.description.replace(/\./g, '-');
}

export function getFullyQualifiedName(spec: Specs.Spec, server: Specs.Server): string {
    var suite = spec.suite.slice(0);
    if (server.projectName) {
        suite.unshift(server.projectName);
    }
    var className = suite.join(' / ');
    return [className, spec.description].map(s => s.replace(/\./g, '-')).join('.');
}
