var common = require('./common');

// Runs default testing configuration in multiple environments.

module.exports = function(config) {

  var settings = {
    browserStack: {
      name: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      pollingTimeout: 30000
    },

    customLaunchers: getCustomLaunchers()
  };

  if (process.env.TRAVIS) {
    if (process.env.BROWSER_STACK_USERNAME) {
      settings.detectBrowsers.enabled = false;
      settings.browsers = [
        'chrome_bs',
        'firefox_bs',
        'safari_bs'
      ];
    } else {
      settings.plugins = ['karma-firefox-launcher'];
      settings.browsers = ['Firefox'];
    }
  } else {
    settings = {
      frameworks: ['detectBrowsers'],

      plugins: [
        'karma-chrome-launcher',
        'karma-detect-browsers',
        'karma-firefox-launcher',
        'karma-ie-launcher',
        'karma-safari-launcher'
      ],

      detectBrowsers: {
        usePhantomJS: false
      }
    };
  }

  config.set(common(settings));
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
