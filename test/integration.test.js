(function(videojs, q) {
  'use strict';

  var when = function(element, type, fn, condition) {
    var func = function() {
      if (condition()) {
        element.off(type, func);
        fn.apply(this, arguments);
      }
    };

    element.on(type, func);
  };

  q.module('Integration', {
    beforeEach: function(assert) {
      var
        done = assert.async(),
        videoEl,
        player;

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
          src: 'http://dash.edgesuite.net/envivio/EnvivioDash3/manifest.mpd',
          type: 'application/dash+xml'
        });
      });
    },
    afterEach: function() {
      this.player.dispose();
      this.fixture.innerHTML = '';
    }
  });

  q.test('should play', function(assert) {
    var
      done = assert.async(),
      player = this.player;

    assert.expect(4);

    when(player, 'timeupdate', function() {
      assert.ok(true, 'played for at least two seconds');

      when(player, 'timeupdate', function() {
        assert.ok(true, 'seeked to 15s');

        when(player, 'timeupdate', function() {
          assert.ok(!player.paused(), 'continued playing');
          assert.equal(player.error(), null, 'has no player errors');

          done();
        }, function() {
          return Math.floor(player.currentTime()) > 15;
        });
      }, function() {
        return Math.floor(player.currentTime()) === 15;
      });

      player.currentTime(15);
    }, function() {
      return player.currentTime() >= 2;
    });

    player.play();
  });
})(window.videojs, window.QUnit);
