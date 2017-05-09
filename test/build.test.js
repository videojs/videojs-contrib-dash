var q = window.QUnit;
var videojs = require('video.js');
require('../es5/videojs-dash.js');

var when = function(element, type, fn, condition) {
  var func = function() {
    if (condition()) {
      element.off(type, func);
      fn.apply(this, arguments);
    }
  };

  element.on(type, func);
};

q.module('Webpack/Browserify Integration', {
  beforeEach: function(assert) {
    var
      done = assert.async(),
      fixture = document.querySelector('#qunit-fixture'),
      videoEl = document.createElement('video'),
      player;

    // show the fixture
    fixture.style.top = 0;
    fixture.style.left = 0;

    fixture.appendChild(videoEl);

    player = videojs(videoEl);
    this.player = player;

    player.ready(function() {
      player.one('loadstart', done);

      player.src({
        src: 'http://dash.edgesuite.net/akamai/bbb_30fps/bbb_30fps.mpd',
        type: 'application/dash+xml'
      });
    });
  },
  afterEach: function() {
    this.player.dispose();
  }
});

q.test('should play', function(assert) {
  var
    done = assert.async(),
    player = this.player;

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
