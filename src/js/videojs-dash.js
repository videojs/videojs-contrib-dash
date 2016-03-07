'use strict';
var window_ = require('global/window');
var videojs = require('video.js');
var dashjs = require('dashjs');

  var WhitelistPlugin = function () {
    var globalManifest;
    var globalDashManifestModel;
    var globalStreamInfo;
    var globalPlayer;
    var globalAdapter;
    var globalRulesController;
    var globalOgPlayerSetQuality;

    var whiteList;
    var currentPeriodIndex;
    var selectorFunction;

    /**
     * Custom object overriding the RulesController, specifically the applyRules
     * function to accomodate the whitelisting of Representations
     */
    var CustomRulesController = function() {
      globalManifest = this.factory.getSingletonInstance(this.context, 'ManifestModel');
      globalDashManifestModel = this.factory.getSingletonInstance(this.context,
                                                                  'DashManifestModel');
      globalAdapter = this.factory.getSingletonInstance(this.context, 'DashAdapter');
      globalRulesController = this.parent;
      var ogApplyRules = this.parent.applyRules;
      return {
        applyRules: function(rulesArr, streamProcessor, callback, current, overrideFunc) {
          var newCallbackFunc = function(result) {
            if (typeof result.value !== 'object') {
              result.value = whitelistImplementer(current, result.value, streamProcessor);
            }

              callback(result);
            };
            ogApplyRules(rulesArr, streamProcessor, newCallbackFunc, current, overrideFunc);
        }
      };
    };

    function periodSwitch(e) {
      globalStreamInfo = e.toStreamInfo;
      currentPeriodIndex = e.toStreamInfo.index;
      whiteList = undefined;
    }

    /**
     * @param  {number} - current index of quality
     * @param  {number} - proposed index of quality
     * @param  {StreamProcessor} - StreamProcessor object
     * @return {number} - index of quality selected
     */
    function whitelistImplementer(current, proposed, streamProcessor) {
      if(current === 0 || proposed === 0) {
        return proposed;
      }
      if (current === proposed) {
        return proposed;
      }
      if (whiteList) {
        var manifest = Object.assign({}, globalManifest.getValue());
        var mediaInfo = streamProcessor.getMediaInfo();
        var adaptationSet = globalAdapter.getDataForMedia(mediaInfo);
        adaptationSet = globalDashManifestModel.getAdaptationForIndex(
                          adaptationSet.index,
                          manifest,
                          currentPeriodIndex);
        var representations = adaptationSet.Representation_asArray;
        var proposedRepresentation = representations[proposed-1];
        var whiteListFilterFunc = whiteList[adaptationSet.id];
        if (whiteListFilterFunc) {
          var filteredReps = representations.filter(whiteListFilterFunc);
          for (var i=0; i < filteredReps.length; i++) {
            if (filteredReps[i].id === proposedRepresentation.id) {
              return proposed;
            }
          }
          return selectorFunction(proposed, adaptationSet, filteredReps);
        }
      }
      return proposed;
    }

    /**
     * @param  {number} - proposed index of quality (nonzero based)
     * @param  {Representation} - Representation object of proposed quality
     * @param  {Array} - Array of Representations representing the whitelist available
     * @return {number} - index of quality to be applied
     */
    function defaultSelector(proposedQuality, adaptation, whiteListSet) {
      if (whiteListSet && whiteListSet.length > 0) {
        var proposedRepresentation = adaptation.Representation_asArray[proposedQuality];
        var i,
            len,
            bestMatchedRep;
        whiteListSet.sort(function(a, b) {
          return a.bandwidth - b.bandwidth;
        });
        for (i=0, len=whiteListSet.length; i<len; i++) {
          var before = whiteListSet[i-1] ? whiteListSet[i-1].bandwidth : 0;
          var current = whiteListSet[i].bandwidth;
          var max = whiteListSet[len - 1].bandwidth;
          if (max <= proposedRepresentation.bandwidth) {
            bestMatchedRep = whiteListSet[len-1];
            break;
          }
          if (proposedRepresentation.bandwidth > before &&
              proposedRepresentation.bandwidth <= current) {
            var beforeDelta = proposedRepresentation.bandwidth - before;
            var afterDelta = current - proposedRepresentation.bandwidth;
            var index;
            if (beforeDelta < afterDelta) {
              index = i = 0 ? 1 : i + 1;
              bestMatchedRep = whiteListSet[index];
              break;
            }
            else {
              bestMatchedRep = whiteListSet[i];
              break;
            }
          }
        }
        var a,
          length;
        for (a=0, length=adaptation.Representation_asArray.length; a < length; a++ ){
          if (adaptation.Representation_asArray[a].id === bestMatchedRep.id) {
            return a;
          }
        }

        return 0;
      }
      return proposedQuality;
    }

    selectorFunction = defaultSelector;

    return {
      /**
       * Sets the selector function to use when choosing a bitrate.
       * When Dash.js attempts to go to a bitrate that isn't in the whitelist,
       * the selector function is used to determine which bitrate to go to
       * instead.
       *
       * @param {[type]} sFunc - The function to use when selecting whitelisted bitrates.
       */
      setSelector: function (sFunc) {
        selectorFunction = sFunc;
      },
      /**
       * Initialize plugin.
       *
       * @param  {MediaPlayer} player - Dash MediaPlayer
       */
      initialize: function (player) {
        this.initialized = true;
        player.extend('RulesController', CustomRulesController, true);
        player.on(dashjs.MediaPlayer.events.PERIOD_SWITCH_COMPLETED, periodSwitch);
        globalPlayer = player;

        globalOgPlayerSetQuality = player.setQualityFor;

        // Patch the player object so that the original setQualityFor cannot be used.
        player.setQualityFor = this.setQualityFor;
      },
      /**
       * Returns all adaptations for the currently playing period.
       * @return {Array} - Array of Representations
       */
      getAdaptations: function() {
        if (globalManifest) {
          var manifest = Object.assign({}, globalManifest.getValue());
          return manifest.Period_asArray[currentPeriodIndex].AdaptationSet_asArray;
        }
      },
      /**
       * @param {AdaptationSet} - AdaptationSet object or string of AdaptationSet
       *                          id that you wish to set whitelist for
       * @param {function} - function to filter the representations in
       *                     order to create your whitelist
       */
      setWhiteListRepresentations: function (set, representationFilter) {
        whiteList = whiteList || {};
        var setId = set.id || set;
        if (globalManifest) {
          var manifest = Object.assign({}, globalManifest.getValue());
          var currentAdaptation = globalDashManifestModel.getAdaptationForId(
                                      parseFloat(setId),
                                      manifest,
                                      currentPeriodIndex);
          var type = currentAdaptation.mimeType;
          type = type ? type.match(/.+?(?=\/)/)[0] : 'video';
          var currentQualityIndex = globalPlayer.getQualityFor(type);

          var currentRepresentation = currentAdaptation.Representation_asArray[
            currentQualityIndex];
          var newIndexInWhiteList = -1;
          var representations = currentAdaptation.Representation_asArray.filter(
            representationFilter);
          for (var i=0; i < representations.length; i++) {
            if (representations[i].id === currentRepresentation.id) {
              newIndexInWhiteList = currentQualityIndex;
              break;
            }
          }
          if (newIndexInWhiteList < 0) {
            newIndexInWhiteList = selectorFunction(currentQualityIndex,
                                                   currentAdaptation,
                                                   representations);
          }

          whiteList[setId] = representationFilter;
          globalOgPlayerSetQuality(type, newIndexInWhiteList);
        }
        else {
          whiteList[setId] = representationFilter;
        }
      },
      /**
       * @param {string} - string value of type
       * @param {number} - integer value of quality you wish to set
       */
      setQualityFor: function(type, value) {
        if (this.initialized) {
          if (globalManifest) {
            var manifest = Object.assign({}, globalManifest.getValue());
            var mediaInfo = globalPlayer.getCurrentTrackFor(type);
            var adaptationSet = globalDashManifestModel.getAdaptationForId(
                                    parseFloat(mediaInfo.id),
                                    manifest,
                                    currentPeriodIndex);
            if(whiteList && whiteList[adaptationSet.id]) {
              var proposedRepresentation = adaptationSet.Representation_asArray[value - 1];
              var reps = adaptationSet.Representation_asArray.filter(whiteList[adaptationSet.id]);
              var i,
                  len;
              for (i=0, len=reps.length; i < len; i++) {
                if (reps[i].id === proposedRepresentation.id) {
                  globalOgPlayerSetQuality(type, value);
                  break;
                }
              }
            }
            else {
              globalOgPlayerSetQuality(type, value);
            }
          }
        }
      },
      getRepresentationsByType: function(type) {
        if (this.initialized) {
          if (globalManifest) {
            var manifest = Object.assign({}, globalManifest.getValue());
            var adaptation = globalDashManifestModel.getAdaptationForType(manifest,
                                                                          currentPeriodIndex,
                                                                          type);
            return adaptation.Representation_asArray;
          }
        }
      },
      initialized: false
    };
  };

  var
    isArray = function(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    };

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

    // Set up plugins.
    this.whitelistPlugin = new WhitelistPlugin();
    this.whitelistPlugin.initialize(this.mediaPlayer_);

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

  Html5DashJS.prototype.setSelector = function (sFunc) {
    this.whitelistPlugin.setSelector(sFunc);
  };

  Html5DashJS.prototype.getAdaptations = function () {
    return this.whitelistPlugin.getAdaptations();
  };

  Html5DashJS.prototype.setWhiteListRepresentations = function (set, representationFilter) {
    this.whitelistPlugin.setWhiteListRepresentations(set, representationFilter);
  };

  Html5DashJS.prototype.setQualityFor = function (type, value) {
    this.whitelistPlugin.setQualityFor(type, value);
  };

  Html5DashJS.prototype.getRepresentationsByType = function () {
    return this.whitelistPlugin.getRepresentationsByType();
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
