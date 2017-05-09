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

  q.test('populates representations', function(assert) {
    var
      player = this.player,
      mediaPlayer = player.dash.mediaPlayer,
      representations = player.dash.representations();

    assert.equal(representations.length, 10, 'video has 10 representations');

    // ABR is in auto mode
    assert.equal(mediaPlayer.getMinAllowedBitrateFor('video') + '',
      'NaN', 'minimum bitrate is not set');
    assert.equal(mediaPlayer.getMaxAllowedBitrateFor('video') + '',
      'NaN', 'maximum bitrate is not set');
  });

  q.test('sets representations', function(assert) {
    var
      done = assert.async(),
      player = this.player,
      mediaPlayer = player.dash.mediaPlayer,
      representations = player.dash.representations();

    assert.expect(3);

    player.play();

    representations.forEach(function(representation, i) {
      // leave the second representation disabled
      if (!(i === 0 || i === 2)) {
        representation.enabled(false);
      }
    });

    var enabledRepresentations = representations.filter(function(representation) {
      return representation.enabled();
    });

    mediaPlayer.on('qualityChangeRendered', function qualityChanged() {
      assert.equal(enabledRepresentations.length, 2);
      assert.equal(mediaPlayer.getMinAllowedBitrateFor('video'),
        254.32, 'minimum bitrate is set to first representation');
      assert.equal(mediaPlayer.getMaxAllowedBitrateFor('video'),
        759.798, 'maximum bitrate is set to third representation');

      mediaPlayer.off('qualityChangeRendered', qualityChanged);
      done();
    });
  });

  q.test('ABR is not limited if all representations are disabled', function(assert) {
    var
      player = this.player,
      mediaPlayer = player.dash.mediaPlayer,
      representations = player.dash.representations();

    representations.forEach(function(representation) {
      representation.enabled(false);
    });

    var enabledRepresentations = representations.filter(function(representation) {
      return representation.enabled();
    });

    assert.equal(enabledRepresentations.length, 0);

    // ABR is in auto mode
    assert.equal(mediaPlayer.getMinAllowedBitrateFor('video') + '',
      'NaN', 'minimum bitrate is not set');
    assert.equal(mediaPlayer.getMaxAllowedBitrateFor('video') + '',
      'NaN', 'maximum bitrate is not set');
  });

  q.test('populates quality levels list when available', function(assert) {
    var
      done = assert.async(),
      player = this.player,
      addCount = 0,
      changeCount = 0;

    player.qualityLevels().on('addqualitylevel', function() {
      addCount++;
    });

    player.qualityLevels().on('change', function() {
      changeCount++;
    });

    when(player, 'timeupdate', function() {
      assert.equal(addCount, 10, 'added quality levels');
      assert.equal(changeCount, 1, 'triggered change event on initial quality selection');
      done();
    }, function() {
      return player.currentTime() >= 1;
    });

    // reset the source to get all addqualitylevel events
    player.src(player.currentSource());
    player.one('loadstart', player.play);
  });
})(window.videojs, window.QUnit);
