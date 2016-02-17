var common = require('./common');

// Runs default testing configuration in multiple environments.

module.exports = function(config) {

  var settings = {
    basePath: '',

    frameworks: ['browserify', 'qunit', 'detectBrowsers'],
    autoWatch: false,
    singleRun: true,

    // Compling tests here
    files: [
      '../../node_modules/sinon/lib/sinon.js',
      '../../node_modules/video.js/dist/video.js',
      '../plugin.test.js',
      '../integration.test.js',
      { pattern: '../../src/**/*.js', watched: true, included: false, served: false }
    ],

    preprocessors: {
      '../*.js': [ 'browserify' ]
    },

    browserify: {
      debug: true,
      transform: [
        require('babelify').configure({
          sourceMapRelative: './',
          loose: ['all']
        })
      ]
    },

    plugins: [
      'karma-qunit',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-ie-launcher',
      'karma-opera-launcher',
      'karma-safari-launcher',
      'karma-browserstack-launcher',
      'karma-browserify',
      'karma-detect-browsers'
    ],

    detectBrowsers: {
      enabled: true,
      usePhantomJS: false
    },

    reporters: ['dots'],

    browserStack: {
      name: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      pollingTimeout: 30000
    },

    customLaunchers: getCustomLaunchers()
  };

  if (process.env.TRAVIS) {
    settings.browserify.transform.push('browserify-istanbul');
    settings.reporters.push('coverage');

    if (process.env.BROWSER_STACK_USERNAME) {
      settings.detectBrowsers.enabled = false;
      settings.browsers = [
        'chrome_bs',
        'firefox_bs',
        'safari_bs'
      ];
    } else {
      settings.browsers = ['Firefox'];
    }
  }

  config.set(settings);
};

function getCustomLaunchers(){
  return {
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

    safari_bs: {
      base: 'BrowserStack',
      browser: 'safari',
      os: 'OS X',
      os_version: 'Yosemite'
    }
  };
}
