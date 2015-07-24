var util = require('util'),
  timeout = 5000;

var Player = function(url) {
  browser.get(url);
  browser.executeAsyncScript(function(done) {
    player = videojs(document.querySelectorAll('.video-js')[0]);
    player.ready(function() {
      // Disable control bar autohide
      player.options().inactivityTimeout = 0;
      done();
    });
  });
};

Player.prototype.bigPlayButton = function() {
  return $('.vjs-big-play-button');
};

Player.prototype.playControl = function() {
  return $('.vjs-play-control');
};

Player.prototype.fullscreen = function() {
  return $('.vjs-fullscreen-control');
};

Player.prototype.hasCss = function(css) {
  return browser.wait($(css).isPresent, timeout, 'Element by "+css+" could not be found')
    .then(function(res) {
      return true;
    }, function(err) {
      return false;
    });
};

Player.prototype.isPlaying = function() {
  return browser.executeAsyncScript(function(done) {
    player.one('timeupdate', function() {
      var result = !player.paused() &&
        !player.ended() &&
        player.error() === null;
      done(result);
    });
  }).then(function(res) {
    return res;
  }, function(err) {
    return false;
  });
};

Player.prototype.isFullscreen = function() {
  return browser.executeAsyncScript(function(done) {
    player.one('fullscreenchange', function() {
      done(player.isFullscreen());
    });
  }).then(function(res) {
    return res;
  }, function(err) {
    return false;
  });
};

Player.prototype.adIsPlaying = function() {
  return this.hasCss('.vjs-ad-playing') &&
    browser.executeScript('return !player.ima3.adPlayer.paused()');
};

Player.prototype.consoleLog = function() {
  // Skip errors about missing favicon
  return browser.manage().logs().get('browser').then(function(logs) {
    var filteredLogs = [];

    filteredLogs = logs.filter(function(log) {
      return !/favicon/.test(log.message);
    });
    if (filteredLogs.length > 0) {
      console.log('Console log: ' + util.inspect(filteredLogs));
    }

    return filteredLogs;
  });
};

Player.prototype.currentTime = function(time) {
  if (time === undefined) {
    return browser.executeScript('return player.currentTime()');
  }

  return browser.executeScript(function(t) {
    player.currentTime(t);
    return player.currentTime();
  }, time);
};

Player.prototype.play = function() {
  return browser.executeScript('player.play()');
};

Player.prototype.pause = function() {
  return browser.executeScript('player.pause()');
};

Player.prototype.paused = function() {
  return browser.executeScript('return player.paused()');
};

Player.prototype.ended = function() {
  return browser.executeAsyncScript(function(done) {
    player.one('ended', function() {
      done(player.ended());
    });
  }).then(function(res) {
    return res;
  }, function(err) {
    return false;
  });
};

Player.prototype.duration = function() {
  return browser.executeScript('return player.duration()');
};

Player.prototype.error = function() {
  return browser.executeScript('return player.error()');
};

module.exports = Player;
