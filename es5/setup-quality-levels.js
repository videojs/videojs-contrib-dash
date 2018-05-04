'use strict';

exports.__esModule = true;
/**
 * Setup listeners to populate quality levels list
 *
 * @private
 * @param {Player} player - a video.js Player
 * @param {MediaPlayer} mediaPlayer - a dash.js MediaPlayer
 */
var setupQualityLevels = function setupQualityLevels(player, mediaPlayer) {
  if (!(player.dash && player.dash.representations && player.qualityLevels)) {
    return;
  }

  var qualityLevels = player.qualityLevels();

  // clear previous quality levels
  qualityLevels.dispose();

  var onPlaybackMetaDataLoaded = function onPlaybackMetaDataLoaded() {
    player.dash.representations().forEach(qualityLevels.addQualityLevel.bind(qualityLevels));
  };

  var onQualityChangeRendered = function onQualityChangeRendered(event) {
    if (event.mediaType === 'video') {
      qualityLevels.selectedIndex_ = event.newQuality;
      qualityLevels.trigger('change');
    }
  };

  mediaPlayer.on('playbackMetaDataLoaded', onPlaybackMetaDataLoaded);
  mediaPlayer.on('qualityChangeRendered', onQualityChangeRendered);
};

exports['default'] = setupQualityLevels;