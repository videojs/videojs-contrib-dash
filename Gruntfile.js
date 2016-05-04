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
    browserify: {
      dist: {
        files: {
          'tmp/videojs-dash.js': ['src/js/videojs-dash.js']
        },
        options: {
          transform: ['browserify-shim']
        }
      }
    },
    uglify: {
      dist: {
        src: [
          'tmp/videojs-dash.js'
        ],
        dest: 'tmp/videojs-dash.min.js'
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
          'tmp/videojs-dash.js'
        ],
        dest: 'dist/videojs-dash.js'
      }
    },
    karma: {
      test: {
        options: {
          configFile: 'test/karma.config.js'
        }
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('test', 'karma');
  grunt.registerTask('build', ['clean', 'jshint', 'browserify', 'uglify', 'concat']);
  grunt.registerTask('default', ['build', 'test']);
};
