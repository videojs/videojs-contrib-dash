/*! videojs-contrib-dash - v1.1.2 - 2016-03-07
 * Copyright (c) 2016 Brightcove  */
(function(window, dashjs) {
  'use strict';

  var WhitelistPlugin = function () {
    var globalManifest,
        globalDashManifestModel,
        globalStreamInfo,
        globalPlayer,
        globalAdapter,
        globalRulesController,
        globalOgPlayerSetQuality,
        whiteList,
        currentPeriodIndex,
        selectorFunction,

        /**
         * Custom object overriding the RulesController, specifically the applyRules
         * function to accomodate the whitelisting of Representations
         */
        CustomRulesController = function() {
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
        var proposedRepresentation,
            i,
            len,
            bestMatchedRep,
            before,
            current,
            max,
            beforeDelta,
            afterDelta,
            index,
            a;

        proposedRepresentation = adaptation.Representation_asArray[proposedQuality];
        whiteListSet.sort(function(a, b) {
          return a.bandwidth - b.bandwidth;
        });
        for (i=0, len=whiteListSet.length; i<len; i++) {
          before = whiteListSet[i-1] ? whiteListSet[i-1].bandwidth : 0;
          current = whiteListSet[i].bandwidth;
          max = whiteListSet[len - 1].bandwidth;
          if (max <= proposedRepresentation.bandwidth) {
            bestMatchedRep = whiteListSet[len-1];
            break;
          }
          if (proposedRepresentation.bandwidth > before &&
              proposedRepresentation.bandwidth <= current) {
            beforeDelta = proposedRepresentation.bandwidth - before;
            afterDelta = current - proposedRepresentation.bandwidth;
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
        for (a=0, len=adaptation.Representation_asArray.length; a < len; a++ ){
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
        var setId = set.id || set,
            manifest,
            currentAdaptation,
            type,
            currentQualityIndex,
            currentRepresentation,
            newIndexInWhiteList,
            representations;
        if (globalManifest) {
          manifest = Object.assign({}, globalManifest.getValue());
          currentAdaptation = globalDashManifestModel.getAdaptationForId(
                                      parseFloat(setId),
                                      manifest,
                                      currentPeriodIndex);
          type = currentAdaptation.mimeType;
          type = type ? type.match(/.+?(?=\/)/)[0] : 'video';
          currentQualityIndex = globalPlayer.getQualityFor(type);

          currentRepresentation = currentAdaptation.Representation_asArray[
            currentQualityIndex];
          newIndexInWhiteList = -1;
          representations = currentAdaptation.Representation_asArray.filter(
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
            var manifest = Object.assign({}, globalManifest.getValue()),
                mediaInfo = globalPlayer.getCurrentTrackFor(type),
                adaptationSet = globalDashManifestModel.getAdaptationForId(
                                    parseFloat(mediaInfo.id),
                                    manifest,
                                    currentPeriodIndex),
                proposedRepresentation,
                reps,
                i,
                len;
            if(whiteList && whiteList[adaptationSet.id]) {
              proposedRepresentation = adaptationSet.Representation_asArray[value - 1];
              reps = adaptationSet.Representation_asArray.filter(whiteList[adaptationSet.id]);
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
            var manifest = Object.assign({}, globalManifest.getValue()),
                adaptation = globalDashManifestModel.getAdaptationForType(manifest,
                                                                          currentPeriodIndex,
                                                                          type);
            return adaptation.Representation_asArray;
          }
        }
      },
      initialized: false
    };
  };

  window.whitelistDashPlugin = new WhitelistPlugin();
})(window, window.dashjs);
