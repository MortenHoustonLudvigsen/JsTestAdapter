var jsTestAdapter = require('./Grunt/Index');
function config(grunt) {
    grunt.initConfig({});
    jsTestAdapter.config(grunt, {
        name: 'TestTestAdapter',
        output: 'bin'
    });
    grunt.registerTask('default', []);
}
module.exports = config;
//# sourceMappingURL=Gruntfile.js.map