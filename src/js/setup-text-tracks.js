import dashjs from 'dashjs';
import videojs from 'video.js';

/*
 * Attach text tracks from dash.js to videojs
 *
 * @param {videojs} player the videojs player instance
 * @param {array} tracks the tracks loaded by dash.js to attach to videojs
 *
 * @private
 */
function attachDashTextTracksToVideojs(player, tech, tracks) {
  const trackDictionary = [];

  // Add remote tracks
  const tracksAttached = tracks
    // Map input data to match HTMLTrackElement spec
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLTrackElement
    .map((track) => ({
      dashTrack: track,
      trackConfig: {
        default: track.defaultTrack,
        kind: track.kind,
        label: track.lang,
        language: track.lang,
        srclang: track.lang,
      },
    }))

    // Add track to videojs track list
    .map(({trackConfig, dashTrack}) => {
      const remoteTextTrack = player.addRemoteTextTrack(trackConfig, true);
      trackDictionary.push({textTrack: remoteTextTrack.track, dashTrack});

      // Don't add the cues becuase we're going to let dash handle it natively. This will ensure
      // that dash handle external time text files and fragmented text tracks.
      //
      // Example file with external time text files:
      // https://storage.googleapis.com/shaka-demo-assets/sintel-mp4-wvtt/dash.mpd

      return remoteTextTrack;
    })
  ;

  /*
   * Scan `videojs.textTracks()` to find one that is showing. Set the dash text track.
   */
  function updateActiveDashTextTrack() {
    const dashMediaPlayer = player.dash.mediaPlayer;
    const textTracks = player.textTracks();
    let activeTextTrackIndex = -1;

    // Iterate through the tracks and find the one marked as showing. If none are showing,
    // `activeTextTrackIndex` will be set to `-1`, disabling text tracks.
    for (let i = 0; i < textTracks.length; i += 1) {
      const textTrack = textTracks[i];

      if (textTrack.mode === 'showing') {
        // Find the dash track we want to use

        const dictionaryLookupResult = trackDictionary.find(
          /* jshint loopfunc: true */
          ({textTrack: dictionaryTextTrack}) => dictionaryTextTrack === textTrack
          /* jshint loopfunc: false */
        );

        const dashTrackToActivate = dictionaryLookupResult ?
          dictionaryLookupResult.dashTrack :
          null;

        // If we found a track, get it's index.
        if (dashTrackToActivate) {
          activeTextTrackIndex = tracks.indexOf(dashTrackToActivate);
        }
      }
    }

    // If the text track has changed, then set it in dash
    if (activeTextTrackIndex !== dashMediaPlayer.getCurrentTextTrackIndex()) {
      dashMediaPlayer.setTextTrack(activeTextTrackIndex);
    }
  }

  // Initialize the text track on our first run-through
  updateActiveDashTextTrack();

  // Update dash when videojs's selected text track changes.
  player.textTracks().on('change', updateActiveDashTextTrack);

  // Cleanup event listeners whenever we start loading a new source
  player.one('loadstart', () => {
    player.textTracks().off('change', updateActiveDashTextTrack);
  });

  /*
   * Now that all the text tracks are created, iterate through them and set the default to
   * `showing`. Note that more than one track can be listed as a default because this will create
   * subtitles and captions which can independently have their own defaults.
  */
  const textTracks = player.textTracks();

  for (let i = 0; i < textTracks.length; i += 1) {
    const textTrack = textTracks[i];
    textTrack.mode = textTrack.default ? 'showing' : 'hidden';
  }

  return tracksAttached;
}

/*
 * Wait for dash to emit `TEXT_TRACKS_ADDED` and then attach the text tracks loaded by dash if
 * we're not using native text tracks.
 *
 * @param {videojs} player the videojs player instance
 * @private
 */
export default function setupTextTracks(player, tech, options) {
  // Store the tracks that we've added so we can remove them later.
  let dashTracksAttachedToVideoJs = [];

  // We're relying on the user to disable native captions. Show an error if they didn't do so.
  if (tech.featuresNativeTextTracks) {
    videojs.log.error('You must pass {html: {nativeCaptions: false}} in the videojs constructor ' +
      'to use text tracks in videojs-contrib-dash');
    return;
  }

  const mediaPlayer = player.dash.mediaPlayer;

  // Clear the tracks that we added. We don't clear them all because someone else can add tracks.
  function clearDashTracks() {
    dashTracksAttachedToVideoJs.forEach(player.removeRemoteTextTrack.bind(player));

    dashTracksAttachedToVideoJs = [];
  }

  function handleTextTracksAdded({index, tracks}) {
    // Stop listening for this event. We only want to hear it once.
    mediaPlayer.off(dashjs.MediaPlayer.events.TEXT_TRACKS_ADDED, handleTextTracksAdded);

    // Cleanup old tracks
    clearDashTracks();

    if (!tracks.length) {
      // Don't try to add text tracks if there aren't any
      return;
    }

    // Save the tracks so we can remove them later
    dashTracksAttachedToVideoJs = attachDashTextTracksToVideojs(player, tech, tracks, options);
  }

  // Attach dash text tracks whenever we dash emits `TEXT_TRACKS_ADDED`.
  mediaPlayer.on(dashjs.MediaPlayer.events.TEXT_TRACKS_ADDED, handleTextTracksAdded);

  function cleanup() {
    mediaPlayer.off(dashjs.MediaPlayer.events.TEXT_TRACKS_ADDED, handleTextTracksAdded);

    player.one('loadstart', clearDashTracks);
  }

  // When the player can play, remove the initialization events. We might not have received
  // TEXT_TRACKS_ADDED` so we have to stop listening for it or we'll get errors when we load new
  // videos and are listening for the same event in multiple places, including cleaned up
  // mediaPlayers.
  mediaPlayer.on(dashjs.MediaPlayer.events.CAN_PLAY, cleanup);
}
