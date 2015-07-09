var url = require('url'),
  Player = require('videojs-automation'),
  suiteName, pageUrl;

if (/chrome/i.test(browser.browserName)) {
  suiteName = browser.name + ': MPEG-DASH Player w/ Widevine DRM';
  pageUrl = url.resolve(browser.baseUrl, 'test/functional/drm-player.html');
} else if (/explorer/i.test(browser.browserName)) {
  suiteName = browser.name + ': MPEG-DASH Player';
  pageUrl = url.resolve(browser.baseUrl, 'test/functional/no-drm-player.html');
}

if (suiteName && pageUrl) {
  describe(suiteName, function() {
    var player;

    beforeEach(function() {
      player = new Player(url.resolve(browser.baseUrl, pageUrl));
    });

    it('should have no console errors', function() {
      player.bigPlayButton().click();
      player.consoleLog().then(function(logs) {
        expect(logs.length).toBe(0);
      });
    });

    it('should have no player errors', function() {
      expect(player.error()).toBeNull();
    });

    it('should play', function() {
      player.bigPlayButton().click();
      expect(player.isPlaying()).toBe(true);
    });
  });
}
