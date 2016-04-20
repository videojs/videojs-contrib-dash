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

  q.test('abr plugin functions', function(assert) {
    var
      player = this.player,
      sourceHandler = player.tech_.sourceHandler_;
      sourceHandler.setBufferTime(5);

    sourceHandler.mediaPlayer_.setAutoSwitchQualityFor('video', false);

    assert.equal(sourceHandler.getAdaptations().length, 4, 'four valid adaptations');
    assert.equal(sourceHandler.getRepresentationsByType('video').length, 13);
  });

  q.test('set quality test', function(assert) {
    var
      done = assert.async(),
      player = this.player,
      sourceHandler = player.tech_.sourceHandler_,
      getQualityFor = sourceHandler.mediaPlayer_.getQualityFor;

    sourceHandler.setBufferTime(2);
    sourceHandler.mediaPlayer_.setAutoSwitchQualityFor('video', false);

    sourceHandler.setQualityFor('video', 6);

    player.play();

    setTimeout(function() {
      assert.equal(getQualityFor('video'), 6, 'quality should be set to 6');
      done();
    }, 5000);
  });

  q.test('set whitelist', function(assert) {
    var
      done = assert.async(),
      player = this.player,
      sourceHandler = player.tech_.sourceHandler_,
      getQualityFor = sourceHandler.mediaPlayer_.getQualityFor;

    sourceHandler.mediaPlayer_.setAutoSwitchQualityFor('video', true);
    sourceHandler.setBufferTime(2);


    //nonHD filter function
    var filterFunc = function(item) {
        if( item.height < 720) {
            return true;
        }
        return false;
    };
    //set whitelist that removes HD representations (last 2 qualities)
    sourceHandler.setWhiteListRepresentations('1', filterFunc);
    sourceHandler.setQualityFor('video', 12);

    player.play();

    setTimeout(function(){
      assert.notEqual(getQualityFor('video'), 12, 'quality should never be above 10');
      assert.notEqual(getQualityFor('video'), 11, 'quality should never be above 10');
      done();
    }, 10000);
  });
})(window.videojs, window.QUnit);
