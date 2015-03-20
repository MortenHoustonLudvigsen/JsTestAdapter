/// <vs AfterBuild='AfterBuild' />
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        nugetpack: {
            dist: {
                src: 'JsTestAdapter.nuspec',
                dest: 'dist/',
                options: {
                    Version: '<%= pkg.version %>'
                }
            }
        }
    });

    grunt.registerTask('AfterBuild', ['nugetpack:dist']);
    grunt.registerTask('default', ['']);

    grunt.loadNpmTasks('grunt-nuget');
    grunt.loadNpmTasks('grunt-nuget');
};