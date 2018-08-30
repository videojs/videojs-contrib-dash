const generate = require('videojs-generate-karma-config');

module.exports = function(config) {
  const options = {
    serverBrowsers(defaults) {
      // ignore defaults and return 'ChromeHeadlessWithFlags'
      return ['ChromeHeadlessWithFlags'];
    },
    files(defaults) {
      // add in dashjs
      defaults.unshift('node_modules/dashjs/dist/dash.all.debug.js');

      return defaults;
    },
    browsers(browsers) {
      const chromeIndex = browsers.indexOf('ChromeHeadless');
      const safariIndex = browsers.indexOf('Safari');

      // change chrome to chrome headless with flags
      if (chromeIndex !== -1) {
        browsers.splice(chromeIndex, 1, 'ChromeHeadlessWithFlags');
      }

      // do not test on safari
      if (safariIndex !== -1) {
        browsers.splice(safariIndex, 1);
      }

      return browsers;
    },
    customLaunchers(defaults) {
      // add no-user-gesture-require variant of chrome
      return Object.assign(defaults, {
        ChromeHeadlessWithFlags: {
          base: 'ChromeHeadless',
          flags: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
        }
      });
    },
    travisLaunchers(defaults) {
      return {
        travisChrome: {
          base: 'ChromeHeadlessWithFlags'
        },
        travisFirefox: {
          base: 'FirefoxHeadless'
        }
      };
    }
  };

  config = generate(config, options);

  // ignore any console logs except for errors
  config.browserConsoleLogOptions = {
    level: 'error',
    terminal: false
  };
};
