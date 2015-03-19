import path = require('path');
import getNodeModules = require('./GetNodeModules');
import getContentTypes = require('./GetContentTypes');

type Options = {
    name: string;
    packagePath: string;
    serverPath: string;
    build: string;
    dist: string;
    output: string;
};

export function config(grunt: any, options: Options): void {
    options.packagePath = options.packagePath || 'package.json',
    options.serverPath = options.serverPath || 'TestServer',
    options.build = options.build || 'build',
    options.dist = options.dist || 'dist',
    options.output = options.output || 'bin/Debug',

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-xmlpoke');

    grunt.config.merge({
        // read in the project settings from the package.json file into the pkg property
        pkg: grunt.file.readJSON(options.packagePath),
        JsTestAdapterOptions: options,

        clean: {
            JsTestAdapter: [options.build, options.dist]
        },

        copy: {
            JsTestAdapter: {
                files: [
                    // Node modules
                    { expand: true, cwd: options.serverPath, src: getNodeModules(grunt, options.serverPath), dest: options.build },
                    // Lib
                    { expand: true, cwd: options.serverPath, src: ['lib/**/*.*'], dest: options.build },
                    // TestServer
                    { expand: true, cwd: options.serverPath, src: ['TestServer/**/*.*'], dest: options.build },
                    // Binaries
                    { expand: true, cwd: options.output, src: ['**', '!*.xml'], dest: options.build },
                    // LICENSE
                    { expand: true, cwd: options.serverPath, src: ['LICENSE'], dest: options.build }
                ]
            }
        },

        xmlpoke: {
            JsTestAdapter: {
                options: {
                    replacements: [
                        {
                            xpath: '/PackageManifest/Metadata/Identity/@Version',
                            value: '<%= pkg.version %>'
                        }
                    ]
                },
                files: {
                    '<%= JsTestAdapterOptions.build %>/extension.vsixmanifest': 'Vsix/source.extension.vsixmanifest'
                }
            },
            'JsTestAdapter-contentTypes': {
                options: {
                    xpath: '/Types',
                    valueType: 'append',
                    value: function (node) {
                        return getContentTypes(grunt, options.build);
                    }
                },
                files: {
                    '<%= JsTestAdapterOptions.build %>/[Content_Types].xml': 'Vsix/Content_Types.xml'
                }
            }
        },

        compress: {
            JsTestAdapter: {
                options: {
                    level: 9,
                    mode: 'zip',
                    archive: '<%= JsTestAdapterOptions.dist %>/<%= JsTestAdapterOptions.name %>.vsix'
                },
                files: [
                    { expand: true, cwd: options.build, src: ['**/*'], dest: '/' }
                ]
            }
        }
    });
}

