# video.js MPEG-DASH Source Handler

[![Build Status](https://travis-ci.org/videojs/videojs-contrib-dash.svg?branch=master)](https://travis-ci.org/videojs/videojs-contrib-dash)
[![Slack Status](http://slack.videojs.com/badge.svg)](http://slack.videojs.com)

A video.js source handler for supporting MPEG-DASH playback through a video.js player on browsers with support for Media Source Extensions.

Lead Maintainer: Joe Forbes [forbesjo](https://github.com/forbesjo)

Maintenance Status: Stable

Drop by our slack channel (#playback) on the [Video.js slack](http://slack.videojs.com).

## Getting Started

Download [Dash.js](https://github.com/Dash-Industry-Forum/dash.js/releases) and [videojs-contrib-dash](https://github.com/videojs/videojs-contrib-dash/releases). Include them both in your web page along with video.js:

```html
<video id=example-video width=600 height=300 class="video-js vjs-default-skin" controls></video>
<script src="video.js"></script>

<!-- Dash.js -->
<script src="dash.all.min.js"></script>

<!-- videojs-contrib-dash script -->
<script src="videojs-dash.min.js"></script>

<script>
var player = videojs('example-video');

player.ready(function() {
  player.src({
    src: 'https://example.com/dash.mpd',
    type: 'application/dash+xml'
  });

  player.play();
});
</script>
```

Checkout our [live example](http://videojs.github.io/videojs-contrib-dash/) if you're having trouble.

## Protected Content

If the browser supports Encrypted Media Extensions and includes a Content Decryption Module for one of the protection schemes in the dash manifest, video.js will be able to playback protected content.

For most protection schemes, the license server information (URL &amp; init data) is included inside the manifest. The notable exception to this is Widevine-Modular (WV). To playback WV content, you must provide the URL to a Widevine license server proxy.

For this purpose, videojs-contrib-dash adds support for a "keySystemOptions" array to the object when using the `player.src()` function:

```javascript
player.src({
  src: 'http://example.com/my/manifest.mpd',
  type: 'application/dash+xml',
  keySystemOptions: [
    {
      name: 'com.widevine.alpha',
      options: {
        serverURL: 'http://m.widevine.com/proxy'
      }
    }
  ]
});
```

You may also manipulate the source object by registering a function to the `updatesource` hook. Your function should take a source object as an argument and should return a source object.

```javascript
var updateSourceData = function(source) {
  source.keySystemOptions = [{
    name: 'com.widevine.alpha',
    options: {
      serverURL:'https://example.com/anotherlicense'
    }
  }];
  return source;
};

videojs.Html5DashJS.hook('updatesource', updateSourceData);
```

## Captions

As of `video.js@5.14`, native captions are no longer supported on any browser besides Safari. Dash can handle captions referenced embedded vtt files, embedded captions in the manifest, and with fragmented text streaming. It is impossible to use video.js captions when dash.js is using fragmented text captions, so the user must disable native captions when using `videojs-contrib-dash`.

```javascript
videojs('example-video', {
  html5: {
    nativeCaptions: false
  }
});
```

A warning will be logged if this setting is not applied.

## Passing options to Dash.js

It is possible to pass options to Dash.js during initialiation of video.js. All methods in the [`Dash.js#MediaPlayer` docs](http://cdn.dashjs.org/latest/jsdoc/module-MediaPlayer.html) are supported.

To set these options, pass the exact function name with a scalar or array value to call the correpsonding MediaPlayer function.

For example:

```javascript
var player = videojs('example-video', {
  html5: {
    dash: {
      setLimitBitrateByPortal: true,
      setMaxAllowedBitrateFor: ['video', 2000]
    }
  }
});
```

A warning will be logged if the configuration property is not found.

### Deprecation Warning

Previously the `set` prefix was expected to be omitted. This has been deprecated and will be removed in a future version.

## Initialization Hook

Sometimes you may need to extend Dash.js, or have access to the Dash.js MediaPlayer before it is initialized. For these cases, you can register a function to the `beforeinitialize` hook, which will be called just before the Dash.js MediaPlayer is initialized.

Your function should have two parameters:
 1. The video.js Player instance
 2. The Dash.js MediaPlayer instance

```javascript
var myCustomCallback = function(player, mediaPlayer) {
  // Log MediaPlayer messages through video.js
  if (videojs && videojs.log) {
    mediaPlayer.getDebug().setLogToBrowserConsole(false);
    mediaPlayer.on('log', function(event) {
      videojs.log(event.message);
    });
  }
};

videojs.Html5DashJS.hook('beforeinitialize', myCustomCallback);
```
