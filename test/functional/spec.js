var url = require('url'),
  Player = require('videojs-automation'),
  suiteName, pageUrl;

// Note: DRM is only supported on desktop browsers and DRM does not work in a VM
if (/chrome/i.test(browser.browserName)) {
  suiteName = browser.name + ': DRM Widevine Perform Player';
  pageUrl = url.resolve(browser.baseUrl, 'test/functional/widevine-player.html');

  describe(suiteName, function() {
    var player;

    beforeEach(function() {
      player = new Player(pageUrl);
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
