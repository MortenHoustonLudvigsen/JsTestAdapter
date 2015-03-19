module.exports = function (grunt) {
    var jsTestAdapter = require('./Grunt/Index');

    grunt.initConfig({
        JsTestAdapter: grunt.file.readJSON('JsTestAdapter.json'),

        npm: {
            TestServer: { args: ['install', '<%= JsTestAdapter.TestServer %>'] }
        }
    });

    jsTestAdapter.config(grunt, {
        name: 'TestTestAdapter',
        packagePath: 'package.json',
        serverPath: 'TestServer',
        build: 'build',
        dist: 'dist',
        output: 'bin/Debug',
    });

    grunt.registerTask('default', ['npm:TestServer']);

    grunt.loadNpmTasks('grunt-npm-helper');
};