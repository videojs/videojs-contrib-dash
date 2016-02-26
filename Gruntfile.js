'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            ' * Copyright (c) <%= grunt.template.today("yyyy") %> Brightcove  */\n',

    /* Build Stuff */
    clean: {
      files: ['tmp', 'dist']
    },
    jshint: {
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: 'src/.jshintrc'
        },
        src: ['src/**/*.js']
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/**/*.js']
      }
    },
    uglify: {
      dist: {
        src: [
          'src/js/videojs-dash.js'
        ],
        dest: 'tmp/videojs-dash.min.js'
      }
    },
    cssmin: {
      target: {
        files: {
          'dist/videojs-dash.css': [
            'src/css/videojs-dash.css'
          ]
        }
      }
    },
    concat: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: [
          'tmp/videojs-dash.min.js'
        ],
        dest: 'dist/videojs-dash.min.js'
      },
      debug: {
        src: [
          'src/js/videojs-dash.js'
        ],
        dest: 'dist/videojs-dash.js'
      }
    },
    karma: {
      options: {
        configFile: 'test/karma.config.js'
      },
      unit: {
        options: {
          files: [
            'node_modules/video.js/dist/video-js/video-js.css',
            'node_modules/video.js/dist/video-js/video.dev.js',
            'node_modules/dashjs/dist/dash.all.debug.js',
            'src/js/videojs-dash.js',
            'test/globals.test.js',
            'test/dashjs.test.js'
          ]
        }
      },
      integration: {
        options: {
          files: [
            'node_modules/video.js/dist/video-js/video-js.css',
            'node_modules/video.js/dist/video-js/video.dev.js',
            'node_modules/dashjs/dist/dash.all.debug.js',
            'src/js/videojs-dash.js',
            'test/integration.test.js'
          ]
        }
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('test', 'karma');
  grunt.registerTask('build', ['clean', 'jshint', 'uglify', 'cssmin', 'concat']);
  grunt.registerTask('default', ['build', 'test']);
};
