import dashjs from 'dashjs';
import videojs from 'video.js';

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
  const mediaPlayer = player.dash.mediaPlayer;

  const dashAudioTracks = mediaPlayer.getTracksFor('audio');
  const videojsAudioTracks = player.audioTracks();

  function generateIdFromTrackIndex(index) {
    return `dash-audio-${index}`;
  }

  function findDashAudioTrack(subDashAudioTracks, videojsAudioTrack) {
    return subDashAudioTracks.find(({index}) =>
      generateIdFromTrackIndex(index) === videojsAudioTrack.id
    );
  }

  // Safari creates a single native `AudioTrack` (not `videojs.AudioTrack`) when loading. Clear all
  // automatically generated audio tracks so we can create them all ourself.
  if (videojsAudioTracks.length) {
    tech.clearTracks(['audio']);
  }

  const currentAudioTrack = mediaPlayer.getCurrentTrackFor('audio');

  dashAudioTracks.forEach((dashTrack) => {
    let localizedLabel;

    if (Array.isArray(dashTrack.labels)) {
      for (let i = 0; i < dashTrack.labels.length; i++) {
        if (
          dashTrack.labels[i].lang &&
          player.language().indexOf(dashTrack.labels[i].lang.toLowerCase()) !== -1
        ) {
          localizedLabel = dashTrack.labels[i];

          break;
        }
      }
    }

    let label;

    if (localizedLabel) {
      label = localizedLabel.text;
    } else if (Array.isArray(dashTrack.labels) && dashTrack.labels.length === 1) {
      label = dashTrack.labels[0].text;
    } else {
      label = dashTrack.lang;

      if (dashTrack.roles && dashTrack.roles.length) {
        label += ' (' + dashTrack.roles.join(', ') + ')';
      }
    }

    // Add the track to the player's audio track list.
    videojsAudioTracks.addTrack(
      new videojs.AudioTrack({
        enabled: dashTrack === currentAudioTrack,
        id: generateIdFromTrackIndex(dashTrack.index),
        kind: dashTrack.kind || 'main',
        label,
        language: dashTrack.lang
      })
    );
  });

  const audioTracksChangeHandler = () => {
    for (let i = 0; i < videojsAudioTracks.length; i++) {
      const track = videojsAudioTracks[i];

      if (track.enabled) {
        // Find the audio track we just selected by the id
        const dashAudioTrack = findDashAudioTrack(dashAudioTracks, track);

        // Set is as the current track
        mediaPlayer.setCurrentTrack(dashAudioTrack);

        // Stop looping
        continue;
      }
    }
  };

  videojsAudioTracks.addEventListener('change', audioTracksChangeHandler);
  player.dash.mediaPlayer.on(dashjs.MediaPlayer.events.STREAM_TEARDOWN_COMPLETE, () => {
    videojsAudioTracks.removeEventListener('change', audioTracksChangeHandler);
  });
}

/*
 * Call `handlePlaybackMetadataLoaded` when `mediaPlayer` emits
 * `dashjs.MediaPlayer.events.PLAYBACK_METADATA_LOADED`.
 */
export default function setupAudioTracks(player, tech) {
  // When `dashjs` finishes loading metadata, create audio tracks for `video.js`.
  player.dash.mediaPlayer.on(
    dashjs.MediaPlayer.events.PLAYBACK_METADATA_LOADED,
    handlePlaybackMetadataLoaded.bind(null, player, tech)
  );
}
