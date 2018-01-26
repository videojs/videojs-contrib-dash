module.exports = function(config) {

  config.set({
    basePath: '..',
    frameworks: ['qunit'],

    files: [
      'node_modules/video.js/dist/video-js.css',
      'node_modules/video.js/dist/video.js',
      'node_modules/dashjs/dist/dash.all.debug.js',
      'dist/videojs-dash.js',
      'test/integration.test.js',
      'test/globals.test.js',
      'test/dashjs.test.js',
      'dist-test/browserify.test.js',
      'dist-test/webpack.test.js'
    ],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    browsers: ['ChromeHeadlessNoSandbox', 'FirefoxHeadless'],

    reporters: ['spec'],
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity,
    browserDisconnectTolerance: 3,
    browserConsoleLogOptions: {
      level: 'error',
      terminal: false
    }
  });
};
