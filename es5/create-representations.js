'use strict';

exports.__esModule = true;
/**
 * Creates a representation object that can be used as a quality level
 *
 * @private
 * @param {BitrateInfo} bitrateInfo - a dash.js BitrateInfo
 * @param {Function} enabledCallback
 * @return {Object}
 */
var createRepresentation = function createRepresentation(bitrateInfo, enabledCallback) {
  var representation = {};

  // dash.js does not expose the representation ID in the manifest
  representation.id = bitrateInfo.qualityIndex + '';
  representation.width = bitrateInfo.width;
  representation.height = bitrateInfo.height;
  representation.bandwidth = bitrateInfo.bitrate;
  representation.isEnabled_ = true;
  representation.enabled = function (enable) {
    if (enable === undefined) {
      return representation.isEnabled_;
    }

    if (enable === representation.isEnabled_) {
      return;
    }

    if (enable === true || enable === false) {
      representation.isEnabled_ = enable;
      enabledCallback();
    }
  };

  return representation;
};

/**
 * Creates a list of renditions that limits the range of the dash.js ABR algorithm
 *
 * @private
 * @param {MediaPlayer} mediaPlayer - a dash.js MediaPlayer
 * @return {Array}
 */
var createRepresentations = function createRepresentations(mediaPlayer) {
  var representations = [];

  var updateBitrateRange = function updateBitrateRange() {
    var enabledRepresentations = representations.filter(function (representation) {
      return representation.enabled();
    });

    // disable the bitrate range limit if it's unecessary
    // or if nothing's enabled
    if (enabledRepresentations.length === representations.length || enabledRepresentations.length === 0) {
      // dash.js docs say to clear the bitrate limit with NaN
      // mediaPlayer.setMinAllowedBitrateFor('video', NaN);
      mediaPlayer.setMaxAllowedBitrateFor('video', NaN);

      return;
    }

    enabledRepresentations.sort(function ascending(x, y) {
      return x.bandwidth - y.bandwidth;
    });

    var min = enabledRepresentations[0].bandwidth;
    var max = enabledRepresentations[enabledRepresentations.length - 1].bandwidth;

    // these functions take kbps
    // mediaPlayer.setMinAllowedBitrateFor('video', min / 1e3);
    mediaPlayer.setMaxAllowedBitrateFor('video', max / 1e3);
  };

  return function () {
    // populate the list on the first representations() call
    representations = representations.length ? representations : mediaPlayer.getBitrateInfoListFor('video').map(function (bitrateInfo) {
      return createRepresentation(bitrateInfo, updateBitrateRange);
    });

    return representations;
  };
};

exports['default'] = createRepresentations;