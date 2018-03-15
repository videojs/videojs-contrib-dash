'use strict';

exports.__esModule = true;

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _video = require('video.js');

var _video2 = _interopRequireDefault(_video);

var _dashjs = require('dashjs');

var _dashjs2 = _interopRequireDefault(_dashjs);

var _setupAudioTracks = require('./setup-audio-tracks');

var _setupAudioTracks2 = _interopRequireDefault(_setupAudioTracks);

var _setupTextTracks = require('./setup-text-tracks');

var _setupTextTracks2 = _interopRequireDefault(_setupTextTracks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * videojs-contrib-dash
 *
 * Use Dash.js to playback DASH content inside of Video.js via a SourceHandler
 */
var Html5DashJS = function () {
  function Html5DashJS(source, tech, options) {
    var _this = this;

    _classCallCheck(this, Html5DashJS);

    // Get options from tech if not provided for backwards compatibility
    options = options || tech.options_;

    this.player = (0, _video2['default'])(options.playerId);
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
      _video2['default'].log.warn('updateSourceData has been deprecated.' + ' Please switch to using hook("updatesource", callback).');
      source = Html5DashJS.updateSourceData(source);
    }

    // call updatesource hooks
    Html5DashJS.hooks('updatesource').forEach(function (hook) {
      source = hook(source);
    });

    var manifestSource = source.src;
    this.keySystemOptions_ = Html5DashJS.buildDashJSProtData(source.keySystemOptions);

    this.player.dash.mediaPlayer = _dashjs2['default'].MediaPlayer().create();

    this.mediaPlayer_ = this.player.dash.mediaPlayer;

    // Log MedaPlayer messages through video.js
    if (Html5DashJS.useVideoJSDebug) {
      _video2['default'].log.warn('useVideoJSDebug has been deprecated.' + ' Please switch to using hook("beforeinitialize", callback).');
      Html5DashJS.useVideoJSDebug(this.mediaPlayer_);
    }

    if (Html5DashJS.beforeInitialize) {
      _video2['default'].log.warn('beforeInitialize has been deprecated.' + ' Please switch to using hook("beforeinitialize", callback).');
      Html5DashJS.beforeInitialize(this.player, this.mediaPlayer_);
    }

    Html5DashJS.hooks('beforeinitialize').forEach(function (hook) {
      hook(_this.player, _this.mediaPlayer_);
    });

    // Must run controller before these two lines or else there is no
    // element to bind to.
    this.mediaPlayer_.initialize();

    // Retrigger a dash.js-specific error event as a player error
    // See src/streaming/utils/ErrorHandler.js in dash.js code
    // Handled with error (playback is stopped):
    // - capabilityError
    // - downloadError
    // - manifestError
    // - mediaSourceError
    // - mediaKeySessionError
    // Not handled:
    // - timedTextError (video can still play)
    // - mediaKeyMessageError (only fires under 'might not work' circumstances)
    this.retriggerError_ = function (event) {
      console.log('retriggerError_', event);
      if (event.error === 'capability' && event.event === 'mediasource') {
        // No support for MSE
        _this.player.error({
          code: 4,
          message: 'The media cannot be played because it requires a feature ' + 'that your browser does not support.'
        });
      } else if (event.error === 'manifestError' && (event.event.id === 'createParser' || // Manifest type not supported
      event.event.id === 'codec' || // Codec(s) not supported
      event.event.id === 'nostreams' || // No streams available to stream
      event.event.id === 'nostreamscomposed' || // Error creating Stream object
      event.event.id === 'parse' || // syntax error parsing the manifest
      event.event.id === 'multiplexedrep' // a stream has multiplexed audio+video
      )) {
        // These errors have useful error messages, so we forward it on
        _this.player.error({ code: 4, message: event.event.message });
      } else if (event.error === 'mediasource') {
        // This error happens when dash.js fails to allocate a SourceBuffer
        // OR the underlying video element throws a `MediaError`.
        // If it's a buffer allocation fail, the message states which buffer
        // (audio/video/text) failed allocation.
        // If it's a `MediaError`, dash.js inspects the error object for
        // additional information to append to the error type.
        if (event.event.match('MEDIA_ERR_ABORTED')) {
          _this.player.error({ code: 1, message: event.event });
        } else if (event.event.match('MEDIA_ERR_NETWORK')) {
          _this.player.error({ code: 2, message: event.event });
        } else if (event.event.match('MEDIA_ERR_DECODE')) {
          _this.player.error({ code: 3, message: event.event });
        } else if (event.event.match('MEDIA_ERR_SRC_NOT_SUPPORTED')) {
          _this.player.error({ code: 4, message: event.event });
        } else if (event.event.match('MEDIA_ERR_ENCRYPTED')) {
          _this.player.error({ code: 5, message: event.event });
        } else if (event.event.match('UNKNOWN')) {
          // We shouldn't ever end up here, since this would mean a
          // `MediaError` thrown by the video element that doesn't comply
          // with the W3C spec. But, since we should handle the error,
          // throwing a MEDIA_ERR_SRC_NOT_SUPPORTED is probably the
          // most reasonable thing to do.
          _this.player.error({ code: 4, message: event.event });
        } else {
          // Buffer allocation error
          _this.player.error({ code: 4, message: event.event });
        }
      } else if (event.error === 'capability' && event.event === 'encryptedmedia') {
        // Browser doesn't support EME
        _this.player.error({
          code: 5,
          message: 'The media cannot be played because it requires encryption ' + 'features that your browser does not support.'
        });
      } else if (event.error === 'key_session') {
        // This block handles pretty much all errors thrown by the
        // encryption subsystem
        _this.player.error({
          code: 5,
          message: event.event
        });
      } else if (event.error === 'download') {
        _this.player.error({
          code: 2,
          message: 'The media playback was aborted because too many consecutive ' + 'download errors occurred.'
        });
      } else {
        // ignore the error
        return;
      }

      // only reset the dash player in 10ms async, so that the rest of the
      // calling function finishes
      setTimeout(function () {
        _this.mediaPlayer_.reset();
      }, 10);
    };

    this.mediaPlayer_.on(_dashjs2['default'].MediaPlayer.events.ERROR, this.retriggerError_);

    // Apply all dash options that are set
    if (options.dash) {
      Object.keys(options.dash).forEach(function (key) {
        var _mediaPlayer_;

        var dashOptionsKey = 'set' + key.charAt(0).toUpperCase() + key.slice(1);
        var value = options.dash[key];

        if (_this.mediaPlayer_.hasOwnProperty(dashOptionsKey)) {
          // Providing a key without `set` prefix is now deprecated.
          _video2['default'].log.warn('Using dash options in videojs-contrib-dash without the set prefix ' + ('has been deprecated. Change \'' + key + '\' to \'' + dashOptionsKey + '\''));

          // Set key so it will still work
          key = dashOptionsKey;
        }

        if (!_this.mediaPlayer_.hasOwnProperty(key)) {
          _video2['default'].log.warn('Warning: dash configuration option unrecognized: ' + key);

          return;
        }

        // Guarantee `value` is an array
        if (!Array.isArray(value)) {
          value = [value];
        }

        (_mediaPlayer_ = _this.mediaPlayer_)[key].apply(_mediaPlayer_, value);
      });
    }

    this.mediaPlayer_.attachView(this.el_);

    // Dash.js autoplays by default, video.js will handle autoplay
    this.mediaPlayer_.setAutoPlay(false);

    // Setup audio tracks
    _setupAudioTracks2['default'].call(null, this.player, tech);

    // Setup text tracks
    _setupTextTracks2['default'].call(null, this.player, tech, options);

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


  Html5DashJS.buildDashJSProtData = function buildDashJSProtData(keySystemOptions) {
    var output = {};

    if (!keySystemOptions || !Array.isArray(keySystemOptions)) {
      return null;
    }

    for (var i = 0; i < keySystemOptions.length; i++) {
      var keySystem = keySystemOptions[i];
      var options = _video2['default'].mergeOptions({}, keySystem.options);

      if (options.licenseUrl) {
        options.serverURL = options.licenseUrl;
        delete options.licenseUrl;
      }

      output[keySystem.name] = options;
    }

    return output;
  };

  Html5DashJS.prototype.dispose = function dispose() {
    if (this.mediaPlayer_) {
      this.mediaPlayer_.off(_dashjs2['default'].MediaPlayer.events.ERROR, this.retriggerError_);
      this.mediaPlayer_.reset();
    }

    if (this.player.dash) {
      delete this.player.dash;
    }
  };

  Html5DashJS.prototype.duration = function duration() {
    var duration = this.el_.duration;
    if (duration === Number.MAX_VALUE) {
      return Infinity;
    }
    return duration;
  };

  /**
   * Get a list of hooks for a specific lifecycle
   *
   * @param {string} type the lifecycle to get hooks from
   * @param {Function=|Function[]=} hook Optionally add a hook tothe lifecycle
   * @return {Array} an array of hooks or epty if none
   * @method hooks
   */


  Html5DashJS.hooks = function hooks(type, hook) {
    Html5DashJS.hooks_[type] = Html5DashJS.hooks_[type] || [];

    if (hook) {
      Html5DashJS.hooks_[type] = Html5DashJS.hooks_[type].concat(hook);
    }

    return Html5DashJS.hooks_[type];
  };

  /**
   * Add a function hook to a specific dash lifecycle
   *
   * @param {string} type the lifecycle to hook the function to
   * @param {Function|Function[]} hook the function or array of functions to attach
   * @method hook
   */


  Html5DashJS.hook = function hook(type, _hook) {
    Html5DashJS.hooks(type, _hook);
  };

  /**
   * Remove a hook from a specific dash lifecycle.
   *
   * @param {string} type the lifecycle that the function hooked to
   * @param {Function} hook The hooked function to remove
   * @return {boolean} True if the function was removed, false if not found
   * @method removeHook
   */


  Html5DashJS.removeHook = function removeHook(type, hook) {
    var index = Html5DashJS.hooks(type).indexOf(hook);

    if (index === -1) {
      return false;
    }

    Html5DashJS.hooks_[type] = Html5DashJS.hooks_[type].slice();
    Html5DashJS.hooks_[type].splice(index, 1);

    return true;
  };

  return Html5DashJS;
}();

Html5DashJS.hooks_ = {};

var canHandleKeySystems = function canHandleKeySystems(source) {
  // copy the source
  source = JSON.parse(JSON.stringify(source));

  if (Html5DashJS.updateSourceData) {
    _video2['default'].log.warn('updateSourceData has been deprecated.' + ' Please switch to using hook("updatesource", callback).');
    source = Html5DashJS.updateSourceData(source);
  }

  // call updatesource hooks
  Html5DashJS.hooks('updatesource').forEach(function (hook) {
    source = hook(source);
  });

  var videoEl = document.createElement('video');
  console.log('videoEl.canPlayType(\'video/mp4; codecs="avc1.640028"\', \'com.widevine.alpha\')', videoEl.canPlayType('video/mp4; codecs="avc1.640028"', 'com.widevine.alpha'));
  if (source.keySystemOptions && !(videoEl.canPlayType('video/mp4; codecs="avc1.640028"', 'com.widevine.alpha') ||
  // !(navigator.requestMediaKeySystemAccess ||
  // IE11 Win 8.1
  videoEl.msSetMediaKeys)) {
    return false;
  }

  return true;
};

_video2['default'].DashSourceHandler = function () {
  return {
    canHandleSource: function canHandleSource(source) {
      var dashExtRE = /\.mpd/i;

      if (!canHandleKeySystems(source)) {
        return '';
      }

      if (_video2['default'].DashSourceHandler.canPlayType(source.type)) {
        return 'probably';
      } else if (dashExtRE.test(source.src)) {
        return 'maybe';
      } else {
        return '';
      }
    },

    handleSource: function handleSource(source, tech, options) {
      return new Html5DashJS(source, tech, options);
    },

    canPlayType: function canPlayType(type) {
      return _video2['default'].DashSourceHandler.canPlayType(type);
    }
  };
};

_video2['default'].DashSourceHandler.canPlayType = function (type) {
  console.log('canPlayType', type);
  var dashTypeRE = /^application\/dash\+xml/i;
  if (dashTypeRE.test(type)) {
    return 'probably';
  }

  return '';
};

// Only add the SourceHandler if the browser supports MediaSourceExtensions
if (!!_window2['default'].MediaSource) {
  _video2['default'].getTech('Html5').registerSourceHandler(_video2['default'].DashSourceHandler(), 0);
}

_video2['default'].Html5DashJS = Html5DashJS;
exports['default'] = Html5DashJS;