var url = require('url'),
 Player = require('../src/player');

describe('Player', function() {
  var playerUrl = url.resolve(browser.baseUrl, 'test/index.html');
  var player;

  beforeEach(function() {
    player = new Player(playerUrl);
  });

  it('should have no console errors', function() {
    // cannot get logs with iedriver
    if (!/explorer/i.test(browser.browserName)) {
      player.bigPlayButton().click();
      player.consoleLog().then(function(logs) {
        expect(logs.length).toBe(0);
      });
    }
  });

  it('should have no player errors', function() {
    expect(player.error()).toBeNull();
  });

  it('should play', function() {
    player.bigPlayButton().click();
    expect(player.isPlaying()).toBe(true);
  });

  it('should set current time', function() {
    player.bigPlayButton().click();
    player.playControl().click();
    expect(player.currentTime(3)).toBeCloseTo(3, 0);
  });

  it('should seek (forwards and backwards)', function() {
    player.bigPlayButton().click();
    player.playControl().click();
    expect(player.currentTime(4)).toBeCloseTo(4, 0);
    expect(player.currentTime(2)).toBeCloseTo(2, 0);
  });

  it('should progress', function() {
    player.bigPlayButton().click();
    var time1 = player.currentTime();
    browser.executeAsyncScript(function(done) {
      player.on('timeupdate', function() {
        if (player.currentTime() >= 1) done();
      });
    });
    var time2 = player.currentTime();
    expect(time1).toBeLessThan(time2);
  });

  it('should pause and resume', function() {
    player.bigPlayButton().click();
    expect(player.isPlaying()).toBe(true);
    player.playControl().click();
    expect(player.paused()).toBe(true);

    // reset to beginning, the video may have finished
    // at the last isPlaying()
    player.currentTime(0);

    player.playControl().click();
    expect(player.isPlaying()).toBe(true);
  });
});
