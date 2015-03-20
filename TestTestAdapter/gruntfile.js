var jsTestAdapter = require('./Grunt/Index');
var util = require('util');
var regedit = require('regedit');
var Slam = require('./Slam');

module.exports = function (grunt) {
    grunt.initConfig({
    });

    jsTestAdapter.config(grunt, {
        name: 'TestTestAdapter',
        bin: 'bin'
    });

    grunt.registerTask('Slam', function () {
        var done = this.async();
        Slam.resetTestVS(grunt, {
            version: '10.0',
            toolsDir: grunt.config('JsTestAdapterPackage').ToolsPath,
            rootSuffix: 'TestTestAdapter',
            vsixFile: grunt.config('JsTestAdapterValues').vsixFile
        }).then(function () {
            done();
        }, function (err) {
            grunt.log.error(err);
            done(false);
        });
    });

    grunt.registerTask('default', []);
}


