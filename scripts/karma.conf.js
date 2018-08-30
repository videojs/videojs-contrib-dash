const generate = require('videojs-generate-karma-config');

module.exports = function(config) {
  config = generate(config);
  config.files.unshift('node_modules/dashjs/dist/dash.all.debug.js');
  config.customLaunchers = {
    ChromeHeadlessNoSandbox: {
      base: 'ChromeHeadless',
      flags: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
    }
  };

  config.detectBrowsers.enabled = false;
  config.browsers = ['ChromeHeadlessNoSandbox', 'FirefoxHeadless'];
  // any custom stuff here!
};
