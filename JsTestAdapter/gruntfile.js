/// <vs AfterBuild='AfterBuild' />

var util = require('util');
var semver = require('semver');
var zpad = require('zpad');

module.exports = function (grunt) {
    function writeJSON(file, value) {
        grunt.file.write(file, JSON.stringify(value, undefined, '  '));
    }

    function readJSON(file, defaultValue, saveDefaultValue) {
        try {
            return grunt.file.readJSON(file);
        } catch (e) {
            if (typeof defaultValue === 'function') {
                defaultValue = defaultValue();
            }
            if (defaultValue && saveDefaultValue) {
                writeJSON(file, defaultValue);
            }
            return defaultValue;
        }
    }

    grunt.formatBuildNo = function (buildNo) {
        return zpad(buildNo, 5);
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        build: readJSON('build.json', function () {
            var pkg = grunt.file.readJSON('package.json');
            return {
                publishedVersion: pkg.version,
                nextBuild: 1
            };
        }, true),
        formatBuildNo: function (buildNo) {
            return zpad(buildNo, 5);
        },

        clean: {
            build: ['dist'],
            publish: ['dist']
        },

        nugetpack: {
            build: {
                src: 'JsTestAdapter.nuspec',
                dest: 'dist/',
                options: {
                    Version: '<%= pkg.version %>-build<%= formatBuildNo(build.nextBuild) %>'
                }
            },
            publish: {
                src: 'JsTestAdapter.nuspec',
                dest: 'dist/',
                options: {
                    Version: '<%= pkg.version %>'
                }
            }
        },

        nugetpush: {
            publish: {
                src: 'dist/*.nupkg'
            }
        },

        writeJson: {
            build: {
                src: ['package.json'],
                dest: 'build.json',
                options: {
                    json: function (pkg) {
                        this.publishedVersion = this.publishedVersion || pkg.version;
                        this.nextBuild = this.nextBuild || 0;
                        this.nextBuild += 1;
                        return this;
                    }
                }
            },
            publish: {
                src: ['package.json'],
                dest: 'build.json',
                options: {
                    json: function (pkg) {
                        this.publishedVersion = pkg.version;
                        this.nextBuild = 1;
                        return this;
                    }
                }
            },
            resetBuild: {
                src: ['package.json'],
                dest: 'build.json',
                options: {
                    json: function (pkg) {
                        this.nextBuild = 1;
                        return this;
                    }
                }
            },
            bumpPatch: {
                dest: 'package.json',
                options: {
                    json: function () {
                        this.version = semver.inc(this.version, 'patch');
                        return this;
                    }
                }
            },
            bumpMinor: {
                dest: 'package.json',
                options: {
                    json: function () {
                        this.version = semver.inc(this.version, 'minor');
                        return this;
                    }
                }
            },
            bumpMajor: {
                dest: 'package.json',
                options: {
                    json: function () {
                        this.version = semver.inc(this.version, 'major');
                        return this;
                    }
                }
            }
        }
    });

    grunt.registerMultiTask('writeJson', function () {
        var options = this.options({});

        this.files.forEach(function (f) {
            var src = f.src || [];
            var json = {};
            if (options.json) {
                if (typeof options.json === 'function') {
                    json = options.json.apply(readJSON(f.dest, {}), src.map(readJSON));
                } else if (typeof options.json === 'object') {
                    json = options.json;
                }
            }
            grunt.file.write(f.dest, JSON.stringify(json, undefined, '  '));
        })
    });

    grunt.registerTask('Bump-patch-version', ['writeJson:bumpPatch', 'writeJson:resetBuild']);
    grunt.registerTask('Bump-minor-version', ['writeJson:bumpMinor', 'writeJson:resetBuild']);
    grunt.registerTask('Bump-major-version', ['writeJson:bumpMajor', 'writeJson:resetBuild']);
    grunt.registerTask('AfterBuild', ['clean:build', 'nugetpack:build', 'writeJson:build']);
    grunt.registerTask('Publish', ['clean:publish', 'nugetpack:publish', 'nugetpush:publish', 'writeJson:publish', 'Bump-patch-version']);

    grunt.loadNpmTasks('grunt-nuget');
    grunt.loadNpmTasks('grunt-contrib-clean');
};