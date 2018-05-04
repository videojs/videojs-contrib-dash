/**
 * Setup listeners to populate quality levels list
 *
 * @private
 * @param {Player} player - a video.js Player
 * @param {MediaPlayer} mediaPlayer - a dash.js MediaPlayer
 */
let setupQualityLevels = function (player, mediaPlayer) {
  if (!(player.dash && player.dash.representations && player.qualityLevels)) {
    return;
  }

  let qualityLevels = player.qualityLevels();

  // clear previous quality levels
  qualityLevels.dispose();

  let onPlaybackMetaDataLoaded = function () {
    player.dash.representations().forEach(qualityLevels.addQualityLevel.bind(qualityLevels));
  };

  let onQualityChangeRendered = function (event) {
    if (event.mediaType === 'video') {
      qualityLevels.selectedIndex_ = event.newQuality;
      qualityLevels.trigger('change');
    }
  };

  mediaPlayer.on('playbackMetaDataLoaded', onPlaybackMetaDataLoaded);
  mediaPlayer.on('qualityChangeRendered', onQualityChangeRendered);
};

export default setupQualityLevels;
