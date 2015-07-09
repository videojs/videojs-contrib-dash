var url = require('url'),
  Player = require('videojs-automation');

if (/chrome/i.test(browser.browserName)) {
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
