var url = require('url'),
  Player = require('videojs-automation');

if (/explorer/i.test(browser.browserName) || /chrome/i.test(browser.browserName)) {
  if (/chrome/i.test(browser.browserName)) {
    suiteName = browser.name + ': DRM Widevine Perform Player';
    pageUrl = url.resolve(browser.baseUrl, 'tests/functional/widevine-player.html');
  } else {
    suiteName = browser.name + ': DRM PlayReady Perform Player';
    pageUrl = url.resolve(browser.baseUrl, 'tests/functional/playready-player.html');
  }

  describe(browser.name + ': DRM Widevine Player', function() {
    var player;

    beforeEach(function() {
      player = new Player(url.resolve(browser.baseUrl, 'test/functional/widevine-player.html'));
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
