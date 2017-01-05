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
          'tmp/videojs-dash.js': ['es5/videojs-dash.js']
        },
        options: {
          transform: ['browserify-shim']
        }
      },
      test: {
        files: {
          'tmp/browserify.test.js': ['test/build.test.js']
        }
      }
    },
    webpack: {
      test: {
        entry: './test/build.test.js',
        output: {
          path: 'tmp/',
          filename: 'webpack.test.js'
        }
      }
    },
    babel: {
      dist: {
        files: [{
          cwd: 'src/js',
          expand: true,
          src: ['*.js'],
          dest: 'es5',
          ext: '.js'
        }],
        options: {
          presets: ['es2015']
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

  grunt.registerTask('test', ['browserify:test', 'webpack:test', 'karma']);
  grunt.registerTask('build', ['clean', 'jshint', 'babel', 'browserify:dist', 'uglify', 'concat']);
  grunt.registerTask('default', ['build', 'test']);
};
