module.exports = function(config) {
  config.set({
    basePath: '..',

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
      }
    }
  });
};
