'use strict';
var window_ = require('global/window');
var videojs = require('video.js');
var dashjs = require('dashjs');
var WhitelistPlugin = require('./whitelist-ext');

  var
    isArray = function(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    },
    isObject = function (a) {
      return Object.prototype.toString.call(a) === '[object Object]';
    },
    mergeOptions = function(obj1, obj2){
      var key, val1, val2, res;

      // make a copy of obj1 so we're not overwriting original values.
      // like prototype.options_ and all sub options objects
      res = {};

      for (key in obj2){
        if (obj2.hasOwnProperty(key)) {
          val1 = obj1[key];
          val2 = obj2[key];

          // Check if both properties are pure objects and do a deep merge if so
          if (isObject(val1) && isObject(val2)) {
            obj1[key] = mergeOptions(val1, val2);
          } else {
            obj1[key] = obj2[key];
          }
        }
      }
      return obj1;
    },
    whitelistPlugin = new WhitelistPlugin();

  /**
   * videojs-contrib-dash
   *
   * Use Dash.js to playback DASH content inside of Video.js via a SourceHandler
   */
  function Html5DashJS (source, tech) {
    var
      options = tech.options_,
      player = videojs(options.playerId),
      manifestSource;

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

    manifestSource = source.src;
    this.keySystemOptions_ = Html5DashJS.buildDashJSProtData(source.keySystemOptions);

    // We have to hide errors since SRC_UNSUPPORTED is thrown by the video element when
    // we set src = '' in order to clear the mediaKeys
    Html5DashJS.hideErrors(this.elParent_);

    // Save the context after the first initialization for subsequent instances
    Html5DashJS.context_ = Html5DashJS.context_ || {};

    // But make a fresh MediaPlayer each time the sourceHandler is used
    this.mediaPlayer_ = dashjs.MediaPlayer(Html5DashJS.context_).create();

    // Log MediaPlayer messages through video.js
    if (Html5DashJS.useVideoJSDebug) {
      Html5DashJS.useVideoJSDebug(this.mediaPlayer_);
    }

    whitelistPlugin.initialize(this.mediaPlayer_);

    // Must run controller before these two lines or else there is no
    // element to bind to.
    this.mediaPlayer_.initialize();
    this.mediaPlayer_.attachView(this.el_);

    // Dash.js autoplays by default
    if (!options.autoplay) {
      this.mediaPlayer_.setAutoPlay(false);
    }

    // Fetches and parses the manifest - WARNING the callback is non-standard "error-last" style
    this.mediaPlayer_.retrieveManifest(manifestSource, videojs.bind(this, this.initializeDashJS));

    player.dash = player.dash || {
      representations: this.representations.bind(this),
      setBufferTime: this.setBufferTime.bind(this)
    };
  }

  Html5DashJS.prototype.initializeDashJS = function (manifest, err) {
    var manifestProtectionData = {};

    if (err) {
      Html5DashJS.showErrors(this.elParent_);
      this.tech_.triggerReady();
      this.dispose();
      return;
    }

    // If we haven't received protection data from the outside world try to get it from the manifest
    // We merge the two allowing the manifest to override any keySystemOptions provided via src()
    if (Html5DashJS.getWidevineProtectionData) {
      manifestProtectionData = Html5DashJS.getWidevineProtectionData(manifest);
      this.keySystemOptions_ = mergeOptions(
        this.keySystemOptions_,
        manifestProtectionData);
    }

    // We have to reset any mediaKeys before the attachSource call below
    this.resetSrc_(videojs.bind(this, function afterMediaKeysReset () {
      Html5DashJS.showErrors(this.elParent_);

      // Attach the source with any protection data
      this.mediaPlayer_.setProtectionData(this.keySystemOptions_);
      this.mediaPlayer_.attachSource(manifest);

      this.tech_.triggerReady();
    }));
  };

  /*
   * Add a css-class that is used to temporarily hide the error dialog while so that
   * we don't see a flash of the dialog box when we remove the video element's src
   * to reset MediaKeys in resetSrc_
   */
  Html5DashJS.hideErrors = function (el) {
    el.className += ' vjs-dashjs-hide-errors';
  };

  /*
   * Remove the css-class above to enable the error dialog to be shown once again
   */
  Html5DashJS.showErrors = function (el) {
    // The video element's src is set asynchronously so we have to wait a while
    // before we unhide any errors
    // 250ms is arbitrary but I haven't seen dash.js take longer than that to initialize
    // in my testing
    setTimeout(function () {
      el.className = el.className.replace(' vjs-dashjs-hide-errors', '');
    }, 250);
  };

  /*
   * Iterate over the `keySystemOptions` array and convert each object into
   * the type of object Dash.js expects in the `protData` argument.
   *
   * Also rename 'licenseUrl' property in the options to an 'serverURL' property
   */
  Html5DashJS.buildDashJSProtData = function (keySystemOptions) {
    var
      keySystem,
      options,
      i,
      output = {};

    if (!keySystemOptions || !isArray(keySystemOptions)) {
      return output;
    }

    for (i = 0; i < keySystemOptions.length; i++) {
      keySystem = keySystemOptions[i];
      options = mergeOptions({}, keySystem.options);

      if (options.licenseUrl) {
        options.serverURL = options.licenseUrl;
        delete options.licenseUrl;
      }

      output[keySystem.name] = options;
    }

    return output;
  };

  /*
   * Helper function to clear any EME keys that may have been set on the video element
   *
   * The MediaKeys has to be explicitly set to null before any DRM content can be loaded into
   * a video element that already contained DRM content.
   */
  Html5DashJS.prototype.resetSrc_ = function (callback) {
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
  };

  Html5DashJS.prototype.dispose = function () {
    if (this.mediaPlayer_) {
      this.mediaPlayer_.reset();
    }
    this.resetSrc_(function noop(){});
  };

  // Whitelist API

  Html5DashJS.prototype.representations = function() {
    var
      currentVideoAdaptation = whitelistPlugin.getCurrentAdaptationFor('video'),
      representations = currentVideoAdaptation.Representation;

    this.enabledRepresentationIds = this.enabledRepresentationIds ||
                                    representations.map(function(rep) {
      return rep.id;
    });

    return representations.map(function(rep) {
      return {
        width: rep.width,
        height: rep.height,
        bandwidth: rep.bandwidth,
        id: rep.id,
        enabled: function(enable) {
          var currentlyEnabled = this.enabledRepresentationIds.indexOf(rep.id) > -1;

          if (enable === undefined) {
            return currentlyEnabled;
          }

          if ((enable && currentlyEnabled) || (!enable && !currentlyEnabled)) {
            return;
          }

          if (enable) {
            this.enabledRepresentationIds.push(rep.id);
          } else {
            this.enabledRepresentationIds.splice(
              this.enabledRepresentationIds.indexOf(rep.id), 1);
          }

          whitelistPlugin.setWhiteListRepresentations(currentVideoAdaptation,
                                                      function(proposedRep) {
            return this.enabledRepresentationIds.indexOf(proposedRep.id) > -1;
          }.bind(this));
        }.bind(this)
      };
    }.bind(this));
  };

  // Dash.js API

  Html5DashJS.prototype.setBufferTime = function (seconds) {
    this.mediaPlayer_.setStableBufferTime(seconds);
    this.mediaPlayer_.setBufferTimeAtTopQuality(seconds);
    this.mediaPlayer_.setBufferTimeAtTopQualityLongForm(seconds);
  };

  videojs.DashSourceHandler = function() {
    return {
      canHandleSource: function (source) {
        var dashExtRE = /\.mpd/i;

        if (videojs.DashSourceHandler.canPlayType(source.type)) {
          return 'probably';
        } else if (dashExtRE.test(source.src)){
          return 'maybe';
        } else {
          return '';
        }
      },

      handleSource: function (source, tech) {
        return new Html5DashJS(source, tech);
      },

      canPlayType: function (type) {
        return videojs.DashSourceHandler.canPlayType(type);
      }
    };
  };

  videojs.DashSourceHandler.canPlayType = function (type) {
    var dashTypeRE = /^application\/dash\+xml/i;
    if (dashTypeRE.test(type)) {
      return 'probably';
    }

    return '';
  };

  // Only add the SourceHandler if the browser supports MediaSourceExtensions
  if (!!window_.MediaSource) {
    videojs.getComponent('Html5').registerSourceHandler(videojs.DashSourceHandler(), 0);
  }

  videojs.Html5DashJS = Html5DashJS;
module.exports = Html5DashJS;
