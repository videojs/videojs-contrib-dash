var commonKarma = require('./karma.config');

module.exports = function(config) {
  commonKarma(config);
  config.set({
    files: [
      'node_modules/video.js/dist/video-js.css',
      'node_modules/video.js/dist/video.js',
      'node_modules/shaka-player/dist/shaka-player.compiled.js',
      'dist/videojs-shaka.js',
      'test/integration.test.js',
    ]
  });
}
