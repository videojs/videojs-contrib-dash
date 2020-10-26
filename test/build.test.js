import QUnit from 'qunit';
import videojs from 'video.js';
import document from 'global/document';

const when = function(element, type, fn, condition) {
  const func = function() {
    if (condition()) {
      element.off(type, func);
      fn.apply(this, arguments);
    }
  };

  element.on(type, func);
};

QUnit.module('Webpack/Browserify Integration', {
  beforeEach(assert) {
    const done = assert.async();

    this.fixture = document.createElement('div');
    document.body.appendChild(this.fixture);

    const videoEl = document.createElement('video');

    videoEl.id = 'vid';
    videoEl.setAttribute('controls', '');
    videoEl.setAttribute('width', '600');
    videoEl.setAttribute('height', '300');
    videoEl.setAttribute('muted', 'true');
    videoEl.className = 'video-js vjs-default-skin';
    this.fixture.appendChild(videoEl);

    const player = videojs('vid');

    this.player = player;

    player.ready(function() {
      player.one('loadstart', done);

      player.src({
        src: 'http://dash.edgesuite.net/akamai/bbb_30fps/bbb_30fps.mpd',
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
  const
    done = assert.async();

  const player = this.player;

  assert.expect(2);

  when(player, 'timeupdate', function() {
    assert.ok(true, 'played for at least two seconds');
    assert.equal(player.error(), null, 'has no player errors');

    done();
  }, function() {
    return player.currentTime() >= 2;
  });

  player.play();
});
