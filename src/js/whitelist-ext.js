var dashjs = require('dashjs');

// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function generateUUID() {
  var d = new Date().getTime();
  if (window.performance && typeof window.performance.now === 'function') {
    d += window.performance.now(); //use high-precision timer if available
  }
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
  });
  return uuid;
}

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
       * We are replacing this method with a *slightly* modified version.
       * When Dash.js parses the representations and adaptations, it appears
       * that if the `id` field is a number (i.e., "1" or "2") that it is
       * set to a `number` JavaScript type.  The `id` field should *not* be
       * a number though since it's a string the specification.
       * This leads to problems when we are searching for an adaptation by `id`.
       * If the user provides the string '1' and the id is parsed by Dash.js
       * as `1`, then we can't reliably get the adaptation set by `id`.
       * This method uses *non-strict* equality so that `1` and '1' are
       * considered equal.
       * JSHint is being told to ignore this, since this is a specific exception.
       */
      CustomDashManifestModel = function () {
        /* jshint ignore:start */
        return {
           getAdaptationForId: function(id, manifest, periodIndex) {
              var adaptations = manifest.Period_asArray[periodIndex].AdaptationSet_asArray,
                  i,
                  len;

              for (i = 0, len = adaptations.length; i < len; i++) {
                  // Use non-strict equality here.
                  if (adaptations[i].hasOwnProperty('id') && adaptations[i].id == id) {
                      return adaptations[i];
                  }
              }

              return null;
          }
        };
        /* jshint ignore:end */
      },

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
            index = (i === 0) ? 1
              : (i === len - 1) ? i
              : i + 1;
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
     * Initialize plugin.
     *
     * @param  {MediaPlayer} player - Dash MediaPlayer
     */
    initialize: function (player) {
      this.initialized = true;
      player.extend('DashManifestModel', CustomDashManifestModel, true);
      player.extend('RulesController', CustomRulesController, true);
      player.on(dashjs.MediaPlayer.events.PERIOD_SWITCH_COMPLETED, periodSwitch);
      globalPlayer = player;

      globalOgPlayerSetQuality = player.setQualityFor;

      // Patch the player object so that the original setQualityFor cannot be used.
      player.setQualityFor = this.setQualityFor;
    },
    /**
     * Returns the currently playing AdaptationSet for a type.
     * @return {[type]} Any valid Dash.js type (i.e., video or audio).
     */
    getCurrentAdaptationFor: function (type) {
      var currentTrack = globalPlayer.getCurrentTrackFor(type);
      return globalDashManifestModel.getAdaptationForIndex(
                        currentTrack.index,
                        globalManifest.getValue(),
                        currentPeriodIndex);
    },
    /**
     * @param {AdaptationSet} - AdaptationSet object or AdaptationSet
     *                          id that you wish to set whitelist for
     * @param {function} - function to filter the representations in
     *                     order to create your whitelist
     */
    setWhiteListRepresentations: function (set, representationFilter) {
      whiteList = whiteList || {};
      var setId,
          manifest,
          currentAdaptation,
          type,
          currentQualityIndex,
          currentRepresentation,
          newIndexInWhiteList,
          representations;

      if (set === undefined || set === null) {
        throw new Error('AdaptationSet must be defined.');
      }

      if (typeof set !== 'object') {
        setId = set;
      }
      else {
        // If the Set doesn't have an id, make one and pass it down.
        if (!set.hasOwnProperty('id')) {
          set.id = generateUUID();
        }
        setId = set.id;
      }

      if (globalManifest) {
        manifest = Object.assign({}, globalManifest.getValue());
        currentAdaptation = globalDashManifestModel.getAdaptationForId(
                                    setId,
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
                                  mediaInfo.id,
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
    initialized: false
  };
};

module.exports = WhitelistPlugin;
