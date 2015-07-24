var q = require('q'),
  FirefoxProfile = require('firefox-profile'),
  firefoxProfile = new FirefoxProfile(),
  ip = require('./ip'),
  config = {};

if (process.env.CI !== 'false') {
  config.sauceUser = process.env.SAUCE_USERNAME;
  config.sauceKey = process.env.SAUCE_ACCESS_KEY;

  config.maxSessions = 6;

  config.multiCapabilities = [{
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11'
  }, {
    browserName: 'chrome',
    platform: 'Windows 8.1',
    chromeOptions: {
      // http://peter.sh/experiments/chromium-command-line-switches/
      args: [
        // Disables installation of default apps on first run. This is used during automated testing.
        'disable-default-apps',
        // Disables default browser checking
        'no-default-browser-check',
        // Skip First Run tasks
        'no-first-run',
        // Disables the sandbox for all process types that are normally sandboxed.
        'no-sandbox',
        // Disables extensions
        'disable-extensions'
      ]
    }
    // }, {
    //   browserName: 'firefox',
    //   platform: 'Linux',
    //   loggingPrefs: {
    //     browser: 'SEVERE'
    //   }
  }].map(function(browser) {
    if (process.env.TRAVIS) {
      browser.name = process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH;
    } else {
      browser.name = browser.browserName + '-' + (browser.version || 'latest') + '-' + browser.platform;
    }

    browser.build =process.env.BUILD ;
    browser['tunnel-identifier'] = process.env.TUNNEL_ID ;
    browser.recordVideo = false;
    browser.recordScreenshots = false;
    return browser;
  });

  // Max time(sec) for a test suite to run on a VM
  config.maxDuration = 180;
} else {
  config.getMultiCapabilities = function() {
    var deferred = q.defer();
    firefoxProfile.setPreference('plugin.state.silverlight', 2);
    firefoxProfile.updatePreferences();
    firefoxProfile.encoded(function(encodedProfile) {
      var multiCapabilities = [{
        browserName: 'chrome',
        chromeOptions: {
          // http://peter.sh/experiments/chromium-command-line-switches/
          args: [
            // Disables installation of default apps on first run. This is used during automated testing.
            'disable-default-apps',
            // Disables default browser checking
            'no-default-browser-check',
            // Skip First Run tasks
            'no-first-run',
            // Disables the sandbox for all process types that are normally sandboxed.
            'no-sandbox',
            // Disables extensions
            'disable-extensions'
          ]
        }
      }, {
        browserName: 'firefox',
        // Always allow Silverlight
        firefox_profile: encodedProfile,
        loggingPrefs: {
          browser: 'SEVERE'
        }
      }];

      deferred.resolve(multiCapabilities);
    });

    return deferred.promise;
  };
}

config.baseUrl = 'http://' + ip + ':7777';

config.onPrepare = function() {
  var jasmineReporters = require('jasmine-reporters');
  browser.ignoreSynchronization = true;
  if (process.env.TEAMCITY_VERSION) {
    jasmine.getEnv().addReporter(new jasmineReporters.TeamCityReporter());
  }

  return browser.getCapabilities().then(function(caps) {
    browser.name = caps.get('browserName') + '-' + (caps.get('version') || 'latest') + '-' + caps.get('platform');
    browser.browserName = caps.get('browserName');
    browser.platform = caps.get('platform');
  });
};

config.framework = 'jasmine2';
config.jasmineNodeOpts = {
  showColors: true,
  // Time(ms) it takes for a single 'it' test to complete
  defaultTimeoutInterval: 60000
};

// Time(ms) it takes for an async script to complete
config.allScriptsTimeout = 30000;

exports.config = config;
