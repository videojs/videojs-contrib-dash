(function(window, videojs, qunit) {
  'use strict';

  var
    // local QUnit aliases
    // http://api.qunitjs.com/

    // module(name, {[setup][ ,teardown]})
    module = qunit.module,
    // test(name, callback)
    test = qunit.test,
    // ok(value, [message])
    ok = qunit.ok;

  module('videojs-dash globals');

  test('has expected globals', function() {
    ok(videojs.Html5DashJS, 'videojs has "Html5Dash" property');
    ok(window.MediaPlayer, 'global has "MediaPlayer" property');
    ok(window.Dash, 'global has "Dash" property');
  });

})(window, window.videojs, window.QUnit);
