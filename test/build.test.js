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
      video,
      player;

    video = document.createElement('video');
    document.querySelector('#qunit-fixture').appendChild(video);

    player = videojs(video);
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
