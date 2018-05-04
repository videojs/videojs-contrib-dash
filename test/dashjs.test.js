(function(window, videojs, dashjs, q) {
  'use strict';

  var
    sampleSrc = {
      src: 'movie.mpd',
      type: 'application/dash+xml',
      keySystemOptions: [{
        name: 'com.widevine.alpha',
        options: {
          extra: 'data',
          licenseUrl: 'https://example.com/license'
        }
      }]
    },
    sampleSrcNoDRM = {
      src: 'movie.mpd',
      type: 'application/dash+xml'
    },

    testHandleSource = function(assert, source, expectedKeySystemOptions, config) {
      if (config === undefined) {
        config = {};
      }
      var eventHandlers = config.eventHandlers ? config.eventHandlers : {};
      var
        startupCalled = false,
        attachViewCalled = false,
        setLimitBitrateByPortalCalled = false,
        setLimitBitrateByPortalValue = null,
        el = document.createElement('div'),
        fixture = document.querySelector('#qunit-fixture'),
        Html5,
        tech,
        options,

        //stubs
        origMediaPlayer = dashjs.MediaPlayer,
        origVJSXHR = videojs.xhr;

      assert.expect(7);

      // Default limitBitrateByPortal to false
      var limitBitrateByPortal = config.limitBitrateByPortal || false;

      el.setAttribute('id', 'test-vid');
      fixture.appendChild(el);

      Html5 = videojs.getTech('Html5');
      tech = new Html5({
        playerId: el.getAttribute('id')
      });
      options = {
        playerId: el.getAttribute('id'),
        dash: {
          limitBitrateByPortal: limitBitrateByPortal
        }
      };
      tech.el = function() { return el; };
      tech.triggerReady = function() { };

      dashjs.MediaPlayer = function() {
        return {
          create: function() {
            return {
              initialize: function() {
                startupCalled = true;
              },

              attachView: function() {
                attachViewCalled = true;
              },
              setAutoPlay: function(autoplay) {
                assert.strictEqual(autoplay, false, 'autoplay is set to false by default');
              },
              setProtectionData: function(keySystemOptions) {
                assert.deepEqual(keySystemOptions, expectedKeySystemOptions,
                  'src and manifest key system options are merged');
              },
              attachSource: function(manifest) {
                assert.deepEqual(manifest, source.src, 'manifest url is sent to attachSource');

                assert.strictEqual(setLimitBitrateByPortalCalled, true,
                  'MediaPlayer.setLimitBitrateByPortal was called');
                assert.strictEqual(setLimitBitrateByPortalValue, limitBitrateByPortal,
                  'MediaPlayer.setLimitBitrateByPortal was called with the correct value');
                assert.strictEqual(startupCalled, true, 'MediaPlayer.startup was called');
                assert.strictEqual(attachViewCalled, true, 'MediaPlayer.attachView was called');

                tech.dispose();

                // Restore
                dashjs.MediaPlayer = origMediaPlayer;
                videojs.xhr = origVJSXHR;
              },

              setLimitBitrateByPortal: function(value) {
                setLimitBitrateByPortalCalled = true;
                setLimitBitrateByPortalValue = value;
              },

              on: function(event, fn) {
                if (!eventHandlers[event]) {
                  eventHandlers[event] = [];
                }
                eventHandlers[event].push(fn);
              },

              reset: config.resetCallback,

              trigger: function(event, data) {
                if (!eventHandlers[event]) {
                  return;
                }
                eventHandlers[event].forEach(function(handler) {
                  handler(data);
                });
              },

            };
          }
        };
      };

      dashjs.MediaPlayer.events = origMediaPlayer.events;

      var dashSourceHandler = Html5.selectSourceHandler(source);
      return dashSourceHandler.handleSource(source, tech, options);
    };

  q.module('videojs-dash dash.js SourceHandler', {
    afterEach: function() {
      videojs.Html5DashJS.hooks_ = {};
      sampleSrc = {
        src: 'movie.mpd',
        type: 'application/dash+xml',
        keySystemOptions: [{
          name: 'com.widevine.alpha',
          options: {
            extra: 'data',
            licenseUrl: 'https://example.com/license'
          }
        }]
      };
    }
  });

  q.test('validate the Dash.js SourceHandler in Html5', function(assert) {
    var dashSource = {
        src: 'some.mpd',
        type: 'application/dash+xml'
      },
      maybeDashSource = {
        src: 'some.mpd'
      },
      nonDashSource = {
        src: 'some.mp4',
        type: 'video/mp4'
      };

    var dashSourceHandler = videojs.getTech('Html5').selectSourceHandler(dashSource);

    assert.ok(dashSourceHandler, 'A DASH handler was found');

    assert.strictEqual(dashSourceHandler.canHandleSource(dashSource), 'probably',
      'canHandleSource with proper mime-type returns "probably"');
    assert.strictEqual(dashSourceHandler.canHandleSource(maybeDashSource), 'maybe',
      'canHandleSource with expected extension returns "maybe"');
    assert.strictEqual(dashSourceHandler.canHandleSource(nonDashSource), '',
      'canHandleSource with anything else returns ""');

    assert.strictEqual(dashSourceHandler.canPlayType(dashSource.type), 'probably',
      'canPlayType with proper mime-type returns "probably"');
    assert.strictEqual(dashSourceHandler.canPlayType(nonDashSource.type), '',
      'canPlayType with anything else returns ""');
  });

  q.test('validate buildDashJSProtData function', function(assert) {
    var output = videojs.Html5DashJS.buildDashJSProtData(sampleSrc.keySystemOptions);

    var empty = videojs.Html5DashJS.buildDashJSProtData(undefined);

    assert.strictEqual(output['com.widevine.alpha'].serverURL, 'https://example.com/license',
      'licenceUrl converted to serverURL');
    assert.equal(empty, null, 'undefined keySystemOptions returns null');
  });

  q.test('validate handleSource function with src-provided key options', function(assert) {
    var mergedKeySystemOptions = {
      'com.widevine.alpha': {
        extra: 'data',
        serverURL: 'https://example.com/license'
      }
    };

    testHandleSource(assert, sampleSrc, mergedKeySystemOptions);
  });

  q.test('validate handleSource function with "limit bitrate by portal" option', function(assert) {
    var mergedKeySystemOptions = {
      'com.widevine.alpha': {
        extra: 'data',
        serverURL: 'https://example.com/license'
      }
    };

    testHandleSource(assert, sampleSrc, mergedKeySystemOptions, {limitBitrateByPortal: true});
  });

  q.test('validate handleSource function with invalid manifest', function(assert) {
    var mergedKeySystemOptions = null;

    testHandleSource(assert, sampleSrcNoDRM, mergedKeySystemOptions);
  });

  q.test('update the source keySystemOptions', function(assert) {
    var mergedKeySystemOptions = {
      'com.widevine.alpha': {
        extra: 'data',
        serverURL: 'https://example.com/license'
      },
      'com.widevine.alpha1': {
        serverURL: 'https://example.com/anotherlicense'
      }
    };

    var updateSourceData = function(source) {
      var numOfKeySystems = source.keySystemOptions.length;
      source.keySystemOptions.push({
        name: 'com.widevine.alpha' + numOfKeySystems,
        options: {
          serverURL: 'https://example.com/anotherlicense'
        }
      });
      return source;
    };
    videojs.Html5DashJS.hook('updatesource', updateSourceData);

    testHandleSource(assert, sampleSrc, mergedKeySystemOptions);
  });

  q.test('registers hook callbacks correctly', function(assert) {
    var cb1Count = 0;
    var cb2Count = 0;
    var cb1 = function(source) {
      cb1Count++;
      return source;
    };
    var cb2 = function() {
      cb2Count++;
    };
    var mergedKeySystemOptions = {
      'com.widevine.alpha': {
        extra: 'data',
        serverURL: 'https://example.com/license'
      }
    };

    videojs.Html5DashJS.hook('updatesource', cb1);
    videojs.Html5DashJS.hook('beforeinitialize', cb2);

    testHandleSource(assert, sampleSrc, mergedKeySystemOptions, {limitBitrateByPortal: true});

    assert.expect(9);

    assert.equal(cb1Count, 2,
      'registered first callback and called');
    assert.equal(cb2Count, 1,
      'registered second callback and called');
  });

  q.test('removes callbacks with removeInitializationHook correctly', function(assert) {
    var cb1Count = 0;
    var cb2Count = 0;
    var cb3Count = 0;
    var cb4Count = 0;
    var cb1 = function() {
      cb1Count++;
    };
    var cb2 = function() {
      cb2Count++;
      assert.ok(videojs.Html5DashJS.removeHook('beforeinitialize', cb2),
        'removed hook cb2');
    };
    var cb3 = function(source) {
      cb3Count++;
      return source;
    };
    var cb4 = function(source) {
      cb4Count++;
      return source;
    };
    var mergedKeySystemOptions = {
      'com.widevine.alpha': {
        extra: 'data',
        serverURL: 'https://example.com/license'
      }
    };

    videojs.Html5DashJS.hook('beforeinitialize', [cb1, cb2]);
    videojs.Html5DashJS.hook('updatesource', [cb3, cb4]);

    assert.equal(videojs.Html5DashJS.hooks('beforeinitialize').length, 2,
      'added 2 hooks to beforeinitialize');
    assert.equal(videojs.Html5DashJS.hooks('updatesource').length, 2,
      'added 2 hooks to updatesource');

    assert.ok(!videojs.Html5DashJS.removeHook('beforeinitialize', cb3),
      'nothing removed if callback not found');
    assert.ok(videojs.Html5DashJS.removeHook('updatesource', cb3), 'removed cb3');

    assert.equal(videojs.Html5DashJS.hooks('updatesource').length, 1, 'removed hook cb3');

    testHandleSource(assert, sampleSrc, mergedKeySystemOptions, {limitBitrateByPortal: true});

    assert.expect(18);

    assert.equal(cb1Count, 1, 'called cb1');
    assert.equal(cb2Count, 1, 'called cb2');
    assert.equal(cb3Count, 0, 'did not call cb3');
    assert.equal(cb4Count, 2, 'called cb4');
    assert.equal(videojs.Html5DashJS.hooks('beforeinitialize').length, 1,
      'cb2 removed itself');
  });

  q.test('attaches dash.js error handler', function(assert) {
    var eventHandlers = {};
    var sourceHandler = testHandleSource(assert, sampleSrcNoDRM, null, {eventHandlers});
    assert.expect(8);
    assert.equal(eventHandlers[dashjs.MediaPlayer.events.ERROR][0],
      sourceHandler.retriggerError_);
  });

  q.test('handles various errors', function(assert) {
    var errors = [
      {
        receive: {error: 'capability', event: 'mediasource'},
        trigger: {code: 4, message: 'The media cannot be played because it requires a feature ' +
            'that your browser does not support.'},
      },
      {
        receive: {error: 'manifestError',
          event: {id: 'createParser', message: 'manifest type unsupported'}},
        trigger: {code: 4, message: 'manifest type unsupported'},
      },
      {
        receive: {error: 'manifestError',
          event: {id: 'codec', message: 'Codec (h264) is not supported'}},
        trigger: {code: 4, message: 'Codec (h264) is not supported'},
      },
      {
        receive: {error: 'manifestError',
          event: {id: 'nostreams', message: 'No streams to play.'}},
        trigger: {code: 4, message: 'No streams to play.'},
      },
      {
        receive: {error: 'manifestError',
          event: {id: 'nostreamscomposed', message: 'Error creating stream.'}},
        trigger: {code: 4, message: 'Error creating stream.'},
      },
      {
        receive: {error: 'manifestError',
          event: {id: 'parse', message: 'parsing the manifest failed'}},
        trigger: {code: 4, message: 'parsing the manifest failed'},
      },
      {
        receive: {error: 'manifestError',
          event: {id: 'nostreams', message: 'Multiplexed representations are intentionally not ' +
            'supported, as they are not compliant with the DASH-AVC/264 guidelines'}},
        trigger: {code: 4, message: 'Multiplexed representations are intentionally not ' +
          'supported, as they are not compliant with the DASH-AVC/264 guidelines'},
      },
      {
        receive: {error: 'mediasource', event: 'MEDIA_ERR_ABORTED: Some context'},
        trigger: {code: 1, message: 'MEDIA_ERR_ABORTED: Some context'},
      },
      {
        receive: {error: 'mediasource', event: 'MEDIA_ERR_NETWORK: Some context'},
        trigger: {code: 2, message: 'MEDIA_ERR_NETWORK: Some context'},
      },
      {
        receive: {error: 'mediasource', event: 'MEDIA_ERR_DECODE: Some context'},
        trigger: {code: 3, message: 'MEDIA_ERR_DECODE: Some context'},
      },
      {
        receive: {error: 'mediasource', event: 'MEDIA_ERR_SRC_NOT_SUPPORTED: Some context'},
        trigger: {code: 4, message: 'MEDIA_ERR_SRC_NOT_SUPPORTED: Some context'},
      },
      {
        receive: {error: 'mediasource', event: 'MEDIA_ERR_ENCRYPTED: Some context'},
        trigger: {code: 5, message: 'MEDIA_ERR_ENCRYPTED: Some context'},
      },
      {
        receive: {error: 'mediasource', event: 'UNKNOWN: Some context'},
        trigger: {code: 4, message: 'UNKNOWN: Some context'},
      },
      {
        receive: {error: 'mediasource', event: 'Error creating video source buffer'},
        trigger: {code: 4, message: 'Error creating video source buffer'},
      },
      {
        receive: {error: 'capability', event: 'encryptedmedia'},
        trigger: {code: 5, message: 'The media cannot be played because it requires encryption ' +
          'features that your browser does not support.'},
      },
      {
        receive: {error: 'key_session', event: 'Some encryption error'},
        trigger: {code: 5, message: 'Some encryption error'},
      },
      {
        receive: {error: 'download', event: { id: 'someId', url: 'http://some/url', request: {} }},
        trigger: {code: 2, message: 'The media playback was aborted because too many ' +
          'consecutive download errors occurred.'},
      },
      {
        receive: {error: 'mssError', event: 'MSS_NO_TFRF : Missing tfrf in live media segment'},
        trigger: {code: 3, message: 'MSS_NO_TFRF : Missing tfrf in live media segment'},
      },
    ];

    // Make sure the MediaPlayer gets reset enough times
    var done = assert.async(errors.length);
    var resetCallback = function() {
      done();
    };

    var eventHandlers = {};
    var sourceHandler = testHandleSource(assert, sampleSrcNoDRM, null,
      {eventHandlers, resetCallback});
    assert.expect(7 + (errors.length * 2));

    var i;
    sourceHandler.player.on('error', function() {
      assert.equal(sourceHandler.player.error().code, errors[i].trigger.code, 'error code matches');
      assert.equal(sourceHandler.player.error().message, errors[i].trigger.message,
        'error message matches');
    });

    // dispatch all handled errors and see if they throw the correct details
    for (i=0; i<errors.length; i++) {
      sourceHandler.mediaPlayer_.trigger(dashjs.MediaPlayer.events.ERROR, errors[i].receive);
    }

  });

  q.test('ignores unknown errors', function(assert) {
    var resetCalled = false;
    var resetCallback = () => {
      resetCalled = true;
    };

    var sourceHandler = testHandleSource(assert, sampleSrcNoDRM, null, {resetCallback});

    var done = assert.async(1);
    sourceHandler.mediaPlayer_.trigger(dashjs.MediaPlayer.events.ERROR, {error: 'unknown'});
    assert.equal(sourceHandler.player.error(), null, 'No error dispatched');
    // The error handler waits 10ms before firing reset, so we wait for
    // 20ms here to make sure it doesn't fire
    setTimeout(function() {
      assert.notOk(resetCalled, 'MediaPlayer has not been reset');
      done();
    }, 20);
    assert.expect(9);
  });

})(window, window.videojs, window.dashjs, window.QUnit);
