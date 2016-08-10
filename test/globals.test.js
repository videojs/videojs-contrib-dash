(function(window, videojs, q) {
  'use strict';

  q.module('videojs-dash globals');

  q.test('has expected globals', function(assert) {
    assert.ok(videojs.Html5DashJS, 'videojs has "Html5Dash" property');
    assert.ok(window.dashjs, 'global has "dashjs" property');
    assert.ok(window.dashjs.MediaPlayer, 'global has "dashjs.MediaPlayer" property');
  });

})(window, window.videojs, window.QUnit);
