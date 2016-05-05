'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    copy: {
      main: {
        files: [
          {
            expand: true,
            flatten: true,
            src: [
              'node_modules/bootstrap/dist/css/bootstrap.min.css',
              'node_modules/video.js/dist/video-js.min.css',
            ],
            dest: 'css/'
          },

          {
            expand: true,
            flatten: true,
            src: [
              'node_modules/bootstrap/dist/js/bootstrap.min.js',
              'node_modules/video.js/dist/video.min.js',
              'node_modules/video.js/dist/video.js.min.map',
              'node_modules/dashjs/dist/dash.all.min.js',
              'node_modules/dashjs/dist/dash.all.min.js.map',
              'node_modules/videojs-contrib-dash/dist/videojs-dash.min.js'
            ],
            dest: 'js/'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['copy']);
};
