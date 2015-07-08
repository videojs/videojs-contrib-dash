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
        dest: 'tmp/<%= pkg.name %>.min.js'
      }
    },
    cssmin: {
      target: {
        files: {
          'dist/<%= pkg.name %>.css': [
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
          'tmp/<%= pkg.name %>.min.js'
        ],
        dest: 'dist/<%= pkg.name %>.min.js'
      },
      debug: {
        src: [
          'src/js/videojs-dash.js'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    qunit: {
      all: ['test/index.html']
    },
    videojs_automation: {
      test: ['test/functional/spec.js']
    }
  });

  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('videojs-automation');

  grunt.registerTask('test', ['qunit', 'videojs_automation']);
  grunt.registerTask('build', ['clean', 'jshint', 'uglify', 'cssmin', 'concat']);
  grunt.registerTask('default', ['build', 'test']);
};
