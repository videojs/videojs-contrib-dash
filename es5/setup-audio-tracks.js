'use strict';

exports.__esModule = true;
exports['default'] = setupAudioTracks;

var _dashjs = require('dashjs');

var _dashjs2 = _interopRequireDefault(_dashjs);

var _video = require('video.js');

var _video2 = _interopRequireDefault(_video);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Setup audio tracks. Take the tracks from dash and add the tracks to videojs. Listen for when
 * videojs changes tracks and apply that to the dash player because videojs doesn't do this
 * natively.
 *
 * @private
 * @param {videojs} player the videojs player instance
 * @param {videojs.tech} tech the videojs tech being used
 */
function handlePlaybackMetadataLoaded(player, tech) {
  var mediaPlayer = player.dash.mediaPlayer;

  var dashAudioTracks = mediaPlayer.getTracksFor('audio');
  var videojsAudioTracks = player.audioTracks();

  function generateIdFromTrackIndex(index) {
    return 'dash-audio-' + index;
  }

  function findDashAudioTrack(dashAudioTracks, videojsAudioTrack) {
    return dashAudioTracks.find(function (_ref) {
      var index = _ref.index;
      return generateIdFromTrackIndex(index) === videojsAudioTrack.id;
    });
  }

  // Safari creates a single native `AudioTrack` (not `videojs.AudioTrack`) when loading. Clear all
  // automatically generated audio tracks so we can create them all ourself.
  if (videojsAudioTracks.length) {
    tech.clearTracks(['audio']);
  }

  var currentAudioTrack = mediaPlayer.getCurrentTrackFor('audio');

  dashAudioTracks.forEach(function (dashTrack) {
    var label = dashTrack.lang;

    if (dashTrack.roles && dashTrack.roles.length) {
      label += ' (' + dashTrack.roles.join(', ') + ')';
    }

    // Add the track to the player's audio track list.
    videojsAudioTracks.addTrack(new _video2['default'].AudioTrack({
      enabled: dashTrack === currentAudioTrack,
      id: generateIdFromTrackIndex(dashTrack.index),
      kind: dashTrack.kind || 'main',
      label: label,
      language: dashTrack.lang
    }));
  });

  videojsAudioTracks.addEventListener('change', function () {
    for (var i = 0; i < videojsAudioTracks.length; i++) {
      var track = videojsAudioTracks[i];

      if (track.enabled) {
        // Find the audio track we just selected by the id
        var dashAudioTrack = findDashAudioTrack(dashAudioTracks, track);

        // Set is as the current track
        mediaPlayer.setCurrentTrack(dashAudioTrack);

        // Stop looping
        continue;
      }
    }
  });
}

/*
 * Call `handlePlaybackMetadataLoaded` when `mediaPlayer` emits
 * `dashjs.MediaPlayer.events.PLAYBACK_METADATA_LOADED`.
 */
function setupAudioTracks(player, tech) {
  // When `dashjs` finishes loading metadata, create audio tracks for `video.js`.
  player.dash.mediaPlayer.on(_dashjs2['default'].MediaPlayer.events.PLAYBACK_METADATA_LOADED, handlePlaybackMetadataLoaded.bind(null, player, tech));
}