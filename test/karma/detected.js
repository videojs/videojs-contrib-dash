var common = require('./common');

// Runs default testing configuration in multiple environments.

module.exports = function(config) {

  var settings = {
    browserStack: {
      name: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      pollingTimeout: 30000
    },

    frameworks: ['detectBrowsers'],

    detectBrowsers: {
      enabled: false,
      usePhantomJS: false
    },

    customLaunchers: getCustomLaunchers()
  };

  if (process.env.TRAVIS) {
    if (process.env.BROWSER_STACK_USERNAME) {
      settings.browsers = [
        'chrome_bs',
        'firefox_bs',
        'safari_bs'
      ];
    } else {
      settings.browsers = ['Firefox'];
    }
  } else {
    settings.detectBrowsers.enabled = true;
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
