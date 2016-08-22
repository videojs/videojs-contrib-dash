module.exports = function(config) {
  config.set({
    basePath: '..',

    files: [
      'node_modules/video.js/dist/video-js.css',
      'node_modules/video.js/dist/video.js',
      'node_modules/dashjs/dist/dash.all.debug.js',
      'dist/videojs-dash.js',
      'test/integration.test.js',
      'test/globals.test.js',
      'test/dashjs.test.js',
      'tmp/browserify.test.js',
      'tmp/webpack.test.js'
    ],

    browserConsoleLogOptions: {
      level: 'error',
      terminal: false
    },

    frameworks: ['qunit'],

    singleRun: true,

    browserDisconnectTolerance: 3,

    captureTimeout: 300000,

    browserNoActivityTimeout: 300000,

    browsers: process.env.TRAVIS ? ['travisChrome'] : ['Chrome', 'Firefox'],

    customLaunchers: {
      travisChrome: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    }
  });
};
