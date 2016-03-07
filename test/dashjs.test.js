(function(window, videojs, dashjs, qunit) {
  'use strict';

  var
    // local QUnit aliases
    // http://api.qunitjs.com/

    // test(name, callback)
    test = qunit.test,
    // ok(value, [message])
    ok = qunit.ok,
    // strictEqual(actual, expected, [message])
    strictEqual = qunit.strictEqual,
    // deepEqual(actual, expected, [message])
    deepEqual = qunit.deepEqual,

    sampleSrc = {
      src: 'movie.mpd',
      type: 'application/dash+xml',
      keySystemOptions: [
        {
          name: 'com.widevine.alpha',
          options: {
            extra: 'data',
            licenseUrl: 'https://example.com/license'
          }
        }
      ]
    },
    sampleSrcNoDRM = {
      src: 'movie.mpd',
      type: 'application/dash+xml'
    },
    testHandleSource = function (source, fakeManifest, expectedKeySystemOptions) {
      var
        startupCalled = false,
        attachViewCalled = false,
        resetSrcCalled = false,
        el = document.createElement('div'),
        player = {
          id: function(){ return 'id'; },
          el: function(){ return el; },
          options_: {},
          options: function(){ return this.options_; },
          bufferedPercent: function() { return 0; },
          controls: function(){ return false; },
          usingNativeControls: function(){ return false; },
          on: function(){ return this; },
          off: function() { return this; },
          ready: function(){},
          addChild: function(){},
          trigger: function(){}
        },
        tech,

        //stubs
        origMediaPlayer = dashjs.MediaPlayer,
        origVJSXHR = videojs.xhr,
        origResetSrc = videojs.Html5DashJS.prototype.resetSrc_;

      expect(7);

      el.innerHTML = '<div />';
      tech = new videojs.Html5(player, {});

      dashjs.MediaPlayer = function () {
        return {
          create: function () {
            return {
              initialize: function () {
                startupCalled = true;
              },
              retrieveManifest: function (manifestUrl, callback) {
                strictEqual(manifestUrl, 'movie.mpd',
                    'manifest url is requested via retrieveManifest');

                return callback(fakeManifest, null);
              },
              attachView: function () {
                attachViewCalled = true;
              },
              setAutoPlay: function (autoplay) {
                strictEqual(autoplay, false, 'autoplay is set to false by default');
              },
              setProtectionData: function (keySystemOptions) {
                deepEqual(keySystemOptions, expectedKeySystemOptions,
                  'src and manifest key system options are merged');
              },
              attachSource: function (manifest) {
                deepEqual(manifest, fakeManifest, 'manifest object is sent to attachSource');

                strictEqual(startupCalled, true, 'MediaPlayer.startup was called');
                strictEqual(attachViewCalled, true, 'MediaPlayer.attachView was called');
                strictEqual(resetSrcCalled, true, 'Html5DashJS#resetSrc_ was called');

                tech.dispose();

                // Restore
                dashjs.MediaPlayer = origMediaPlayer;
                videojs.xhr = origVJSXHR;
                videojs.Html5DashJS.prototype.resetSrc_ = origResetSrc;
              }
            };
          }
        };
      };

      // We have to override this because PhantomJS does not have Encrypted Media Extensions
      videojs.Html5DashJS.prototype.resetSrc_ = function (fn) {
        resetSrcCalled = true;
        return fn();
      };

      var dashSourceHandler = videojs.Html5.selectSourceHandler(source);
      dashSourceHandler.handleSource(source, tech);
    };

  qunit.module('videojs-dash dash.js SourceHandler', {
    setup: function() {

    },
    teardown: function() {
    }
  });

  test('validate the Dash.js SourceHandler in Html5', function() {
    var dashSource = {
      src:'some.mpd',
      type:'application/dash+xml'
    },
    maybeDashSource = {
      src:'some.mpd'
    },
    nonDashSource = {
      src:'some.mp4',
      type:'video/mp4'
    };

    var dashSourceHandler = videojs.Html5.selectSourceHandler(dashSource);

    ok(dashSourceHandler, 'A DASH handler was found');

    strictEqual(dashSourceHandler.canHandleSource(dashSource), 'probably',
      'canHandleSource with proper mime-type returns "probably"');
    strictEqual(dashSourceHandler.canHandleSource(maybeDashSource), 'maybe',
      'canHandleSource with expected extension returns "maybe"');
    strictEqual(dashSourceHandler.canHandleSource(nonDashSource), '',
      'canHandleSource with anything else returns ""');
  });

  test('validate buildDashJSProtData function', function() {
    var output = videojs.Html5DashJS.buildDashJSProtData(sampleSrc.keySystemOptions);

    var empty = videojs.Html5DashJS.buildDashJSProtData(undefined);

    strictEqual(output['com.widevine.alpha'].serverURL, 'https://example.com/license',
      'licenceUrl converted to serverURL');
    deepEqual(empty, {}, 'undefined keySystemOptions returns empty object');
  });

  test('validate handleSource function with src-provided key options', function() {
    var
      manifestWithProtection = {
        Period: {
          AdaptationSet: []
        }
      },
      mergedKeySystemOptions = {
        'com.widevine.alpha': {
          extra: 'data',
          serverURL:'https://example.com/license'
        }
      };

    testHandleSource(sampleSrc, manifestWithProtection, mergedKeySystemOptions);
  });

  test('validate handleSource function with invalid manifest', function() {
    var
      manifestWithProtection = {},
      mergedKeySystemOptions = {};

    testHandleSource(sampleSrcNoDRM, manifestWithProtection, mergedKeySystemOptions);
  });

})(window, window.videojs, window.dashjs, window.QUnit);
