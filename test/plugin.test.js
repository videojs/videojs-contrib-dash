import document from 'global/document';

import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';
import '../src/plugin';
import Html5DashJS from '../src/js/html5-dashjs';

QUnit.test('the environment is sane', function(assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
});

const sampleSrc = {
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
};

const sampleSrcNoDRM = {
  src: 'movie.mpd',
  type: 'application/dash+xml'
};

const testHandleSource = function(source, fakeManifest, expectedKeySystemOptions) {
  let createCalled = false;
  let initializeCalled = false;
  let attachViewCalled = false;
  let resetSrcCalled = false;
  const el = document.createElement('div');
  const parentEl = document.createElement('div');
  let Html5;
  let tech;
  const contextObj = { fake: 'context' };

  // Stubs
  const origContext = Html5DashJS.context_;
  const origMediaPlayer = window.MediaPlayer;
  const origVJSXHR = videojs.xhr;
  const origResetSrc = Html5DashJS.prototype.resetSrc_;

  QUnit.expect(9);

  Html5 = videojs.getComponent('Html5');
  tech = new Html5({});
  tech.el = function() {
    return el;
  };
  tech.triggerReady = function() {};
  parentEl.appendChild(el);

  Html5DashJS.context_ = contextObj;

  window.dashjs.MediaPlayer = function(context) {
    QUnit.deepEqual(context, contextObj, 'context is passed into MediaPlayer correctly');

    return {
      create() {
	createCalled = true;
	return this;
      },
      initialize() {
	initializeCalled = true;
      },
      retrieveManifest(manifestUrl, callback) {
	QUnit.strictEqual(manifestUrl, 'movie.mpd',
	  'manifest url is requested via retrieveManifest');

	return callback(fakeManifest, null);
      },
      attachView() {
	attachViewCalled = true;
      },
      setAutoPlay(autoplay) {
	QUnit.strictEqual(autoplay, false, 'autoplay is set to false by default');
      },
      attachSource(manifest, keySystem, keySystemOptions) {
	QUnit.deepEqual(keySystemOptions, expectedKeySystemOptions,
	  'src and manifest key system options are merged');
	QUnit.deepEqual(manifest, fakeManifest,
	  'manifest object is sent to attachSource');

	QUnit.strictEqual(createCalled, true, 'MediaPlayer.create was called');
	QUnit.strictEqual(initializeCalled, true, 'MediaPlayer.initialize was called');
	QUnit.strictEqual(attachViewCalled, true, 'MediaPlayer.attachView was called');
	QUnit.strictEqual(resetSrcCalled, true, 'Html5DashJS#resetSrc_ was called');

	tech.dispose();

	// Restore
	Html5DashJS.context_ = origContext;
	window.MediaPlayer = origMediaPlayer;
	videojs.xhr = origVJSXHR;
	Html5DashJS.prototype.resetSrc_ = origResetSrc;
      }
    };
  };

  // We have to override this because PhantomJS does not have Encrypted Media Extensions
  Html5DashJS.prototype.resetSrc_ = function(fn) {
    resetSrcCalled = true;
    return fn();
  };

  Html5.selectSourceHandler(source).handleSource(source, tech);
};

QUnit.module('videojs-contrib-dash', {

  beforeEach() {

    // Mock the environment's timers because certain things - particularly
    // player readiness - are asynchronous in video.js 5. This MUST come
    // before any player is created; otherwise, timers could get created
    // with the actual timer methods!
    this.clock = sinon.useFakeTimers();

    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('validate the Dash.js SourceHandler in Html5', function(assert) {
  const dashSource = {
    src: 'some.mpd',
    type: 'application/dash+xml'
  };
  const maybeDashSource = {
    src: 'some.mpd'
  };
  const nonDashSource = {
    src: 'some.mp4',
    type: 'video/mp4'
  };

  const dashSourceHandler = videojs.getComponent('Html5').selectSourceHandler(dashSource);

  assert.ok(dashSourceHandler, 'A DASH handler was found');

  assert.strictEqual(dashSourceHandler.canHandleSource(dashSource), 'probably',
    'canHandleSource with proper mime-type returns "probably"');
  assert.strictEqual(dashSourceHandler.canHandleSource(maybeDashSource), 'maybe',
    'canHandleSource with expected extension returns "maybe"');
  assert.strictEqual(dashSourceHandler.canHandleSource(nonDashSource), '',
    'canHandleSource with anything else returns ""');
});

QUnit.test('validate buildDashJSProtData function', function(assert) {
  const output = Html5DashJS.buildDashJSProtData(sampleSrc.keySystemOptions);

  const empty = Html5DashJS.buildDashJSProtData();

  assert.strictEqual(output['com.widevine.alpha'].serverURL,
    'https://example.com/license', 'licenceUrl converted to serverURL');
  assert.deepEqual(empty, {}, 'undefined keySystemOptions returns empty object');
});

QUnit.test('validate handleSource function with src-provided key options',
  function(assert) {
    const manifestWithProtection = {
      Period: {
	AdaptationSet: []
      }
    };
    const mergedKeySystemOptions = {
      'com.widevine.alpha': {
	extra: 'data',
	serverURL: 'https://example.com/license'
      }
    };

    testHandleSource(sampleSrc, manifestWithProtection, mergedKeySystemOptions);
  }
);

QUnit.test('validate handleSource function with invalid manifest', function(assert) {
  const manifestWithProtection = {};
  const mergedKeySystemOptions = {};

  testHandleSource(sampleSrcNoDRM, manifestWithProtection, mergedKeySystemOptions);
});
