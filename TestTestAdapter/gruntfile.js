module.exports = function (grunt) {

    grunt.initConfig({
        JsTestAdapter: grunt.file.readJSON('JsTestAdapter.json'),

        npm: {
            TestServer: { args: ['install', '<%= JsTestAdapter.TestServer %>'] }
        }
    });

    grunt.registerTask('default', ['npm:TestServer']);

    grunt.loadNpmTasks('grunt-npm-helper');
};