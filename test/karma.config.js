module.exports = function(config) {
  config.set({
    basePath: '..',

    files: [
      'node_modules/video.js/dist/video-js.css',
      'node_modules/video.js/dist/video.js',
      'node_modules/dashjs/dist/dash.all.debug.js',
      'dist/videojs-dash.js'].concat(
        (process.env.BROWSER_STACK_USERNAME || !process.env.TRAVIS) ?
        ['test/integration.test.js'] : []
        ).concat([
      'test/globals.test.js',
      'test/dashjs.test.js'
    ]),

    frameworks: ['qunit', 'detectBrowsers'],

    singleRun: true,

    browserDisconnectTolerance: 3,

    captureTimeout: 300000,

    browserNoActivityTimeout: 300000,

    detectBrowsers: {
      enabled: !(process.env.BROWSER_STACK_USERNAME || process.env.TRAVIS),
      usePhantomJS: false
    },

    browserStack: {
      project: 'videojs-contrib-dash',
      name: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      pollingTimeout: 30000
    },

    browsers: process.env.BROWSER_STACK_USERNAME ? ['chrome_bs', 'firefox_bs'] :
              process.env.TRAVIS ? ['travisChrome'] :
              ['Chrome'],

    customLaunchers: {
      chrome_bs: {
        base: 'BrowserStack',
        browser: 'chrome',
        os: 'Windows',
        os_version: '8.1'
      },

      firefox_bs: {
        base: 'BrowserStack',
        browser: 'firefox',
        os: 'Windows',
        os_version: '8.1'
      },

      travisChrome: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    }
  });
};
