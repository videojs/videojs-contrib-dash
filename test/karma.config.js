module.exports = function(config) {
  var files = [
    'node_modules/video.js/dist/video-js/video-js.css',
    'node_modules/video.js/dist/video-js/video.dev.js',
    'node_modules/dashjs/dist/dash.all.debug.js',
    'src/js/videojs-dash.js'
  ];

  if (process.env.BROWSER_STACK_USERNAME || !process.env.TRAVIS) {
    files = files.concat([
      'test/integration.test.js',
      'test/globals.test.js',
      'test/dashjs.test.js'
    ]);
  } else {
    files = files.concat([
      'test/globals.test.js',
      'test/dashjs.test.js'
    ]);
  }

  config.set({
    basePath: '..',

    files: files,

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
      project: process.env.npm_package_name,
      name: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      pollingTimeout: 30000
    },

    browsers: process.env.BROWSER_STACK_USERNAME ? [
      'chrome_bs',
      'firefox_bs'
    ] : ['Firefox'],

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
