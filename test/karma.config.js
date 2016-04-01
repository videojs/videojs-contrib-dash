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
      'test/dashjs.test.js'
    ],

    frameworks: ['qunit', 'detectBrowsers'],

    singleRun: true,

    browserDisconnectTolerance: 3,

    captureTimeout: 300000,

    browserNoActivityTimeout: 300000,

    detectBrowsers: {
      enabled: !process.env.BROWSER_STACK_USERNAME,
      usePhantomJS: false
    },

    browserStack: {
      project: 'videojs-contrib-dash',
      name: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      pollingTimeout: 30000
    },

    browsers: [
      'chrome_bs',
      'firefox_bs'
    ],

    customLaunchers: {
      travisChrome: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    }
  });
};
