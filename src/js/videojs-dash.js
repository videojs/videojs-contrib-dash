import window from 'global/window';
import videojs from 'video.js';
import dashjs from 'dashjs';

let
  isArray = function(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
  };

/**
 * videojs-contrib-dash
 *
 * Use Dash.js to playback DASH content inside of Video.js via a SourceHandler
 */
class Html5DashJS {
  constructor(source, tech, options) {
    // Get options from tech if not provided for backwards compatibility
    options = options || tech.options_;

    this.player = videojs(options.playerId);
    this.player.dash = this.player.dash || {};

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

    if (Html5DashJS.updateSourceData) {
      videojs.log.warn('updateSourceData has been deprecated.' +
        ' Please switch to using hook("updatesource", callback).');
      source = Html5DashJS.updateSourceData(source);
    }

    // call updatesource hooks
    Html5DashJS.hooks('updatesource').forEach((hook) => {
      source = hook(source);
    });

    let manifestSource = source.src;
    this.keySystemOptions_ = Html5DashJS.buildDashJSProtData(source.keySystemOptions);

    this.player.dash.mediaPlayer = dashjs.MediaPlayer().create();

    this.mediaPlayer_ = this.player.dash.mediaPlayer;

    // Log MedaPlayer messages through video.js
    if (Html5DashJS.useVideoJSDebug) {
      videojs.log.warn('useVideoJSDebug has been deprecated.' +
        ' Please switch to using hook("beforeinitialize", callback).');
      Html5DashJS.useVideoJSDebug(this.mediaPlayer_);
    }

    if (Html5DashJS.beforeInitialize) {
      videojs.log.warn('beforeInitialize has been deprecated.' +
        ' Please switch to using hook("beforeinitialize", callback).');
      Html5DashJS.beforeInitialize(this.player, this.mediaPlayer_);
    }

    Html5DashJS.hooks('beforeinitialize').forEach((hook) => {
      hook(this.player, this.mediaPlayer_);
    });

    // Must run controller before these two lines or else there is no
    // element to bind to.
    this.mediaPlayer_.initialize();

    // Apply any options that are set
    if (options.dash) {
      if (options.dash.limitBitrateByPortal) {
        this.mediaPlayer_.setLimitBitrateByPortal(true);
      } else {
        this.mediaPlayer_.setLimitBitrateByPortal(false);
      }
      if (options.dash.hideCaptions) {
        this.mediaPlayer_.on(dashjs.MediaPlayer.events.TEXT_TRACKS_ADDED,
          function() {
            this.mediaPlayer_.setTextTrack(-1);
          }
        );
      }
    }

    this.mediaPlayer_.attachView(this.el_);

    // Dash.js autoplays by default, video.js will handle autoplay
    this.mediaPlayer_.setAutoPlay(false);

    // Attach the source with any protection data
    this.mediaPlayer_.setProtectionData(this.keySystemOptions_);
    this.mediaPlayer_.attachSource(manifestSource);

    this.tech_.triggerReady();
  }

  /*
   * Iterate over the `keySystemOptions` array and convert each object into
   * the type of object Dash.js expects in the `protData` argument.
   *
   * Also rename 'licenseUrl' property in the options to an 'serverURL' property
   */
  static buildDashJSProtData(keySystemOptions) {
    let output = {};

    if (!keySystemOptions || !isArray(keySystemOptions)) {
      return null;
    }

    for (let i = 0; i < keySystemOptions.length; i++) {
      let keySystem = keySystemOptions[i];
      let options = videojs.mergeOptions({}, keySystem.options);

      if (options.licenseUrl) {
        options.serverURL = options.licenseUrl;
        delete options.licenseUrl;
      }

      output[keySystem.name] = options;
    }

    return output;
  }

  dispose() {
    if (this.mediaPlayer_) {
      this.mediaPlayer_.reset();
    }

    if (this.player.dash) {
      delete this.player.dash;
    }
  }

  duration() {
    const duration = this.el_.duration;
    if (duration === Number.MAX_VALUE) {
      return Infinity;
    }
    return duration;
  }

  /**
   * Get a list of hooks for a specific lifecycle
   *
   * @param {string} type the lifecycle to get hooks from
   * @param {Function=|Function[]=} hook Optionally add a hook tothe lifecycle
   * @return {Array} an array of hooks or epty if none
   * @method hooks
   */
  static hooks(type, hook) {
    Html5DashJS.hooks_[type] = Html5DashJS.hooks_[type] || [];

    if (hook) {
      Html5DashJS.hooks_[type] = Html5DashJS.hooks_[type].concat(hook);
    }

    return Html5DashJS.hooks_[type];
  }

/**
 * Add a function hook to a specific dash lifecycle
 *
 * @param {string} type the lifecycle to hook the function to
 * @param {Function|Function[]} hook the function or array of functions to attach
 * @method hook
 */
  static hook(type, hook) {
    Html5DashJS.hooks(type, hook);
  }

  /**
   * Remove a hook from a specific dash lifecycle.
   *
   * @param {string} type the lifecycle that the function hooked to
   * @param {Function} hook The hooked function to remove
   * @return {boolean} True if the function was removed, false if not found
   * @method removeHook
   */
  static removeHook(type, hook) {
    const index = Html5DashJS.hooks(type).indexOf(hook);

    if (index === -1) {
      return false;
    }

    Html5DashJS.hooks_[type] = Html5DashJS.hooks_[type].slice();
    Html5DashJS.hooks_[type].splice(index, 1);

    return true;
  }
}

Html5DashJS.hooks_ = {};

const canHandleKeySystems = function(source) {
  if (Html5DashJS.updateSourceData) {
    source = Html5DashJS.updateSourceData(source);
  }

  let videoEl = document.createElement('video');
  if (source.keySystemOptions &&
    !(navigator.requestMediaKeySystemAccess ||
      // IE11 Win 8.1
      videoEl.msSetMediaKeys)) {
    return false;
  }

  return true;
};

videojs.DashSourceHandler = function() {
  return {
    canHandleSource: function(source) {
      let dashExtRE = /\.mpd/i;

      if (!canHandleKeySystems(source)) {
        return '';
      }

      if (videojs.DashSourceHandler.canPlayType(source.type)) {
        return 'probably';
      } else if (dashExtRE.test(source.src)) {
        return 'maybe';
      } else {
        return '';
      }
    },

    handleSource: function(source, tech, options) {
      return new Html5DashJS(source, tech, options);
    },

    canPlayType: function(type) {
      return videojs.DashSourceHandler.canPlayType(type);
    }
  };
};

videojs.DashSourceHandler.canPlayType = function(type) {
  let dashTypeRE = /^application\/dash\+xml/i;
  if (dashTypeRE.test(type)) {
    return 'probably';
  }

  return '';
};

// Only add the SourceHandler if the browser supports MediaSourceExtensions
if (!!window.MediaSource) {
  videojs.getComponent('Html5').registerSourceHandler(videojs.DashSourceHandler(), 0);
}

videojs.Html5DashJS = Html5DashJS;
export default Html5DashJS;
