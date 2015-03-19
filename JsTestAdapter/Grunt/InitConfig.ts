import path = require('path');
import getNodeModules = require('./GetNodeModules');
import getContentTypes = require('./GetContentTypes');

function initConfig(grunt: any, packagePath: string, serverPath: string): void {
    grunt.initConfig({
        // read in the project settings from the package.json file into the pkg property
        pkg: grunt.file.readJSON(packagePath),

        clean: {
            dist: ['build', 'dist']
        },

        copy: {
            dist: {
                files: [
                    // Node modules
                    { expand: true, cwd: serverPath, src: getNodeModules(grunt, serverPath), dest: 'build/' },
                    // Lib
                    { expand: true, cwd: serverPath, src: ['lib/**/*.*'], dest: 'build/' },
                    // Binaries
                    { expand: true, cwd: 'bin/Debug/', src: ['**', '!*.xml'], dest: 'build/' },
                    // LICENSE
                    { expand: true, cwd: serverPath, src: ['LICENSE'], dest: 'build/' }
                ]
            }
        },

        xmlpoke: {
            vsixManifest: {
                options: {
                    replacements: [
                        {
                            xpath: '/PackageManifest/Metadata/Identity/@Version',
                            value: '<%= pkg.version %>'
                        }
                    ]
                },
                files: {
                    'build/extension.vsixmanifest': 'source.extension.vsixmanifest'
                }
            },
            contentTypes: {
                options: {
                    xpath: '/Types',
                    valueType: 'append',
                    value: function (node) {
                        return getContentTypes(grunt, 'build/');
                    }
                },
                files: {
                    'build/[Content_Types].xml': 'Vsix/Content_Types.xml'
                }
            },
            debugSettings: {
                options: {
                    replacements: [
                        {
                            xpath: '/Project/PropertyGroup/StartProgram',
                            value: '<%= buildConfig.DevEnvDir %>devenv.exe'
                        }, {
                            xpath: '/Project/PropertyGroup/StartWorkingDirectory',
                            value: function (node) {
                                return path.resolve(__dirname, '..');
                            }
                        }
                    ]
                },
                files: {
                    'KarmaTestAdapter.csproj.user': 'DebugSettings.xml'
                }
            }
        },

        compress: {
            dist: {
                options: {
                    level: 9,
                    mode: 'zip',
                    archive: 'dist/KarmaTestAdapter.vsix'
                },
                files: [
                    { expand: true, cwd: 'build/', src: ['**/*'], dest: '/' }
                ]
            }
        },

        exec: {
            resetExperimentalHub: {
                cmd: 'ResetExperimentalHub.bat <%= buildConfig.VisualStudioVersion %>'
            },
            startExperimentalHub: {
                cmd: 'StartExperimentalHub.bat <%= buildConfig.VisualStudioVersion %>'
            }
        }
    });
}

export = initConfig;