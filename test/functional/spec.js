var url = require('url'),
  Player = require('videojs-automation'),
  players = [{
    suiteName: browser.name + ': MPEG-DASH Player',
    source: {
      src: 'http://wams.edgesuite.net/media/' +
        'SintelTrailer_MP4_from_WAME/sintel_trailer-1080p.ism/manifest(format=mpd-time-csf)',
      type: 'application/dash+xml'
    }
  }];

if (/chrome/i.test(browser.browserName)) {
  players.push({
    suiteName: browser.name + ': MPEG-DASH Player w/ Widevine DRM',
    source: {
      src: 'http://html5.cablelabs.com:8100/cenc/wv/dash.mpd',
      type: 'application/dash+xml',
      keySystemOptions: [{
        name: 'com.widevine.alpha',
        options: {
          'licenseUrl': 'https://html5.cablelabs.com:8025'
        }
      }]
    }
  });
}

players.map(function(p) {
  return describe(p.suiteName, function() {
    var player;

    beforeEach(function() {
      player = new Player(url.resolve(browser.baseUrl, 'test/functional/player.html'));
      browser.executeScript(function(source) {
        player.src(source);
      }, p.source);
    });

    if (!/explorer/i.test(browser.browserName)) {
      it('should have no console errors', function() {
        player.bigPlayButton().click();
        player.consoleLog().then(function(logs) {
          expect(logs.length).toBe(0);
        });
      });
    }

    it('should have no player errors', function() {
      expect(player.error()).toBeNull();
    });

    it('should play', function() {
      player.bigPlayButton().click();
      browser.executeAsyncScript(function(done) {
        player.one('timeupdate', done);
      });
    });
  });
});
