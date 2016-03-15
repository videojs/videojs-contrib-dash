import document from 'global/document';

import QUnit from 'qunit';
import videojs from 'video.js';
import '../src/plugin';
import '../node_modules/dashjs/dist/dash.all.debug.js';

let when = function(element, type, fn, condition) {
  let func = function() {
    if (condition()) {
      element.off(type, func);
      fn.apply(this, arguments);
    }
  };

  element.on(type, func);
};

QUnit.module('Integration', {
  beforeEach(assert) {
    let done = assert.async();
    let videoEl;
    let player;

    this.fixture = document.createElement('div');
    document.body.appendChild(this.fixture);

    videoEl = document.createElement('video');
    videoEl.id = 'vid';
    videoEl.setAttribute('controls', '');
    videoEl.setAttribute('width', '600');
    videoEl.setAttribute('height', '300');
    videoEl.className = 'video-js vjs-default-skin';
    this.fixture.appendChild(videoEl);

    player = videojs('vid');
    this.player = player;

    player.ready(function() {
      player.one('loadstart', done);

      player.src({
        src: 'http://wams.edgesuite.net/media/' +
          'SintelTrailer_MP4_from_WAME/sintel_trailer-1080p.ism/' +
          'manifest(format=mpd-time-csf)',
        type: 'application/dash+xml'
      });
    });
  },
  afterEach() {
    this.player.dispose();
    this.fixture.innerHTML = '';
  }
});

QUnit.test('should play', function(assert) {
  let done = assert.async();
  let player = this.player;

  player.one('seeked', function() {
    player.one('timeupdate', function() {
      assert.ok(true, 'seeked to 15s and continued playing');
      assert.equal(player.error(), null, 'has no player errors');
      done();
    });
  });

  when(player, 'timeupdate', function() {
    assert.ok(true, 'played for at least two seconds');
    player.currentTime(15);
  }, function() {
    return player.currentTime() >= 2;
  });

  player.play();
});
