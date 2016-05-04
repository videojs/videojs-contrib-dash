(function(videojs, q) {
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
          src: 'http://rdmedia.bbc.co.uk/dash/ondemand/testcard/1/client_manifest-events.mpd',
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

  q.test('representations API', function(assert) {
    var
      player = this.player,
      numEnabledReps = 0;

    assert.equal(player.dash.representations().length, 13, 'have all representations');

    player.dash.representations().forEach(function(rep) {
      assert.ok(rep.id, 'representation has a valid id');
      assert.ok(rep.width, 'representation has a valid width');
      assert.ok(rep.height, 'representation has a valid height');
      assert.ok(rep.bandwidth, 'representation has a valid bandwidth');
      assert.ok(rep.enabled(), 'all representations start enabled');
    });

    player.dash.representations().forEach(function(rep) {
      if (rep.height >= 720) {
        rep.enabled(false);
      }
    });

    player.dash.representations().forEach(function(rep) {
      if (rep.enabled()) {
        numEnabledReps++;
        if (rep.height >= 720) {
          throw new Error('representation should not be enabled');
        }
      }
    });

    assert.equal(numEnabledReps,
                 11,
                 'has the correct number of enabled representations');
  });

  q.test('set buffer time', function(assert) {
    var
      done = assert.async(),
      player = this.player,
      getQualityFor = player.tech_.sourceHandler_.mediaPlayer_.getQualityFor,
      originalQuality;

    originalQuality = getQualityFor('video');

    player.play();

    player.dash.representations()[originalQuality].enabled(false);
    player.dash.setBufferTime(1);

    setTimeout(function(){
      assert.notEqual(getQualityFor('video'),
                      originalQuality,
                      'quality should be different');
      done();
    }, 2);
  });
})(window.videojs, window.QUnit);
