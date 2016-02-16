import videojs from 'video.js';
import 'dashjs-npm';

/**
 * Use Dash.js to playback DASH content inside of Video.js via a SourceHandler
 */
class Html5DashJS {
  constructor(source, tech) {
    const manifestSource = source.src;

    this.tech_ = tech;
    this.el_ = tech.el();
    this.elParent_ = this.el_.parentNode;

    // Do nothing if the src is falsey
    if (!source.src) {
      return;
    }

    // While the manifest is loading and Dash.js has not finished initializing
    // we must defer events and functions calls with isReady_ and then `triggerReady`
    // again later once everything is setup
    tech.isReady_ = false;

    this.keySystemOptions_ = Html5DashJS.buildDashJSProtData(source.keySystemOptions);

    // We have to hide errors since SRC_UNSUPPORTED is thrown by the video element when
    // we set src = '' in order to clear the mediaKeys
    this.hideErrors();

    // Must be before anything is initialized since we are overridding a global object
    // injection
    if (Html5DashJS.useVideoJSDebug) {
      Html5DashJS.useVideoJSDebug(videojs);
    }

    // Save the context after the first initialization for subsequent instances
    Html5DashJS.context_ = Html5DashJS.context_ || {};

    // But make a fresh MediaPlayer each time the sourceHandler is used
    this.mediaPlayer_ = window.dashjs.MediaPlayer(Html5DashJS.context_).create();

    // Initialize the media player with the element and autoplay settings
    this.mediaPlayer_.initialize();
    this.mediaPlayer_.attachView(this.el_);

    // Dash.js autoplays by default
    if (!tech.options_.autoplay) {
      this.mediaPlayer_.setAutoPlay(false);
    }

    // Fetches and parses the manifest - WARNING the callback is non-standard
    // "error-last" style
    this.mediaPlayer_.retrieveManifest(manifestSource,
      videojs.bind(this, this.initializeDashJS));
  }

  initializeDashJS(manifest, err) {
    let manifestProtectionData = {};

    if (err) {
      this.showErrors();
      this.tech_.triggerReady();
      this.dispose();
      return;
    }

    // If we haven't received protection data from the outside world try to get it from
    // the manifest, We merge the two allowing the manifest to override any
    // keySystemOptions provided via src()
    if (Html5DashJS.getWidevineProtectionData) {
      manifestProtectionData = Html5DashJS.getWidevineProtectionData(manifest);
      this.keySystemOptions_ = videojs.mergeOptions(
	this.keySystemOptions_,
	manifestProtectionData);
    }

    // We have to reset any mediaKeys before the attachSource call below
    this.resetSrc_(() => {
      this.showErrors();

      // Attach the source with any protection data
      this.mediaPlayer_.attachSource(manifest, null, this.keySystemOptions_);

      this.tech_.triggerReady();
    });
  }

  /**
   * Add a css-class that is used to temporarily hide the error dialog while so that
   * we don't see a flash of the dialog box when we remove the video element's src
   * to reset MediaKeys in resetSrc_
   */
  hideErrors() {
    this.elParent_.className += ' vjs-dashjs-hide-errors';
  }

  /**
   * Remove the css-class above to enable the error dialog to be shown once again
   */
  showErrors() {
    // The video element's src is set asynchronously so we have to wait a while
    // before we unhide any errors
    // 250ms is arbitrary but I haven't seen dash.js take longer than that to initialize
    // in my testing
    setTimeout(() => {
      this.elParent_.className =
	this.elParent_.className.replace(' vjs-dashjs-hide-errors', '');
    }, 250);
  }

  /**
   * Iterate over the `keySystemOptions` array and convert each object into
   * the type of object Dash.js expects in the `protData` argument.
   *
   * Also rename 'licenseUrl' property in the options to an 'serverURL' property
   */
  static buildDashJSProtData(keySystemOptions) {
    let output = {};

    if (!keySystemOptions || !Array.isArray(keySystemOptions)) {
      return output;
    }

    for (let i = 0; i < keySystemOptions.length; i++) {
      const keySystem = keySystemOptions[i];
      let options = videojs.mergeOptions({}, keySystem.options);

      if (options.licenseUrl) {
        options.serverURL = options.licenseUrl;
        delete options.licenseUrl;
      }

      output[keySystem.name] = options;
    }

    return output;
  }

  /**
   * Helper function to clear any EME keys that may have been set on the video element
   *
   * The MediaKeys has to be explicitly set to null before any DRM content can be loaded
   * into a video element that already contained DRM content.
   */
  resetSrc_(callback) {
    // In Chrome, MediaKeys can NOT be changed when a src is loaded in the video element
    // Dash.js has a bug where it doesn't correctly reset the data so we do it manually
    // The order of these two lines is important. The video element's src must be reset
    // to allow `mediaKeys` to changed otherwise a DOMException is thrown.
    if (this.el_) {
      this.el_.src = '';
      if (this.el_.setMediaKeys) {
        this.el_.setMediaKeys(null).then(callback, callback);
      } else {
        callback();
      }
    }
  }

  dispose() {
    if (this.mediaPlayer_) {
      this.mediaPlayer_.reset();
    }
    this.resetSrc_(() => {});
  }
}

export default Html5DashJS;
