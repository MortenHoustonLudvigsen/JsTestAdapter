/// <vs AfterBuild='AfterBuild' />
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            dist: ['dist']
        },

        nugetpack: {
            dist: {
                src: 'JsTestAdapter.nuspec',
                dest: 'dist/',
                options: {
                    Version: '<%= pkg.version %>'
                }
            }
        },

        nugetpush: {
            dist: {
                src: 'dist/*.nupkg'
            }
        }
    });

    grunt.registerTask('AfterBuild', ['clean:dist', 'nugetpack:dist']);
    grunt.registerTask('Publish', ['clean:dist', 'nugetpack:dist', 'nugetpush:dist']);
    grunt.registerTask('default', ['AfterBuild']);

    grunt.loadNpmTasks('grunt-nuget');
    grunt.loadNpmTasks('grunt-contrib-clean');
};