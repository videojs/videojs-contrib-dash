'use strict';
var window_ = require('global/window');
var videojs = require('video.js');
var dashjs = require('dashjs');
var WhitelistPlugin = require('./whitelist-ext');

  var
    isArray = function(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    },
    whitelistPlugin = new WhitelistPlugin();

  /**
   * videojs-contrib-dash
   *
   * Use Dash.js to playback DASH content inside of Video.js via a SourceHandler
   */
  function Html5DashJS (source, tech) {
    var manifestSource;

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
      source = Html5DashJS.updateSourceData(source);
    }

    manifestSource = source.src;
    this.keySystemOptions_ = Html5DashJS.buildDashJSProtData(source.keySystemOptions);

    // Save the context after the first initialization for subsequent instances
    Html5DashJS.context_ = Html5DashJS.context_ || {};

    // But make a fresh MediaPlayer each time the sourceHandler is used
    this.mediaPlayer_ = dashjs.MediaPlayer(Html5DashJS.context_).create();

    // Log MedaPlayer messages through video.js
    if (Html5DashJS.useVideoJSDebug) {
      Html5DashJS.useVideoJSDebug(this.mediaPlayer_);
    }

    whitelistPlugin.initialize(this.mediaPlayer_);

    // Must run controller before these two lines or else there is no
    // element to bind to.
    this.mediaPlayer_.initialize();
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
      options = videojs.mergeOptions({}, keySystem.options);

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
      currentVideoAdaptation = this.getCurrentAdaptationFor('video'),
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

          this.setWhiteListRepresentations(currentVideoAdaptation, function(proposedRep) {
            return this.enabledRepresentationIds.indexOf(proposedRep.id) > -1;
          }.bind(this));
        }.bind(this)
      };
    }.bind(this));
  };

  Html5DashJS.prototype.setSelector = function (sFunc) {
    whitelistPlugin.setSelector(sFunc);
  };

  Html5DashJS.prototype.getAdaptations = function () {
    return whitelistPlugin.getAdaptations();
  };

  Html5DashJS.prototype.getCurrentAdaptationFor = function (type) {
    return whitelistPlugin.getCurrentAdaptationFor(type);
  };

  Html5DashJS.prototype.setWhiteListRepresentations = function (set, representationFilter) {
    whitelistPlugin.setWhiteListRepresentations(set, representationFilter);
  };

  Html5DashJS.prototype.setQualityFor = function (type, value) {
    whitelistPlugin.setQualityFor(type, value);
  };

  Html5DashJS.prototype.getRepresentationsByType = function (type) {
    return whitelistPlugin.getRepresentationsByType(type);
  };

  // Dash.js API

  Html5DashJS.prototype.setAutoSwitchQuality = function (value) {
    this.mediaPlayer_.setAutoSwitchQuality(value);
  };

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
