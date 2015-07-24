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
    qunit: {
      all: ['test/index.html']
    },
    videojs_automation: {
      test: ['test/functional/spec.js']
    }
  });

  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('videojs-automation');

  grunt.registerTask('test', function() {
    if (!process.env.TRAVIS || process.env.TRAVIS_PULL_REQUEST === 'false') {
      grunt.task.run(['qunit', 'videojs_automation']);
    } else {
      grunt.task.run('qunit');
    }
  });
  grunt.registerTask('build', ['clean', 'jshint', 'uglify', 'cssmin', 'concat']);
  grunt.registerTask('default', ['build', 'test']);
};
