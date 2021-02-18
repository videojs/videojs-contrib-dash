const generate = require('videojs-generate-karma-config');
const isCI = require('is-ci');

module.exports = function(config) {
  const options = {
    serverBrowsers(defaults) {
      // run our special chrome in server mode so we get instant test feedback
      return ['ChromeHeadlessWithFlags'];
    },
    files(defaults) {
      // add in dashjs global
      defaults.unshift('node_modules/dashjs/dist/dash.all.debug.js');

      return defaults;
    },
    browsers(_browsers) {
      // only run on chrome
      const browsers = ['ChromeHeadlessWithFlags'];

      if (!isCI) {
        browsers.push('FirefoxHeadless');
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
    }
  };

  config = generate(config, options);

  // ignore any console logs except for errors
  config.browserConsoleLogOptions = {
    level: 'error',
    terminal: false
  };
};
