# video.js MPEG-DASH Source Handler

[![Build Status](https://travis-ci.org/videojs/videojs-contrib-dash.svg?branch=master)](https://travis-ci.org/videojs/videojs-contrib-dash)

A video.js source handler for supporting MPEG-DASH playback through a video.js player on browsers with support for Media Source Extensions.

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
        licenseUrl: 'http://m.widevine.com/proxy'
      }
    }
  ]
});
```

You may also manipulate the source object by setting the `videojs.Html5DashJS.updateSourceData` function. This function takes a source object as an argument and should return a source object.

```javascript
videojs.Html5DashJS.updateSourceData = function(source) {
  source.keySystemOptions = [{
    name: 'com.widevine.alpha',
    options: {
      serverURL:'https://example.com/anotherlicense'
    }
  }];
  return source;
};
```

## Passing options to Dash.js

It is possible to pass options to Dash.js during initialiation of video.js. The following options are currently supported:

* `limitBitrateByPortal` (defaults to `false`): if set to `true`, Dash.js will not request video tracks which are bigger than the video element.

To set these options, pass them in the `html5.dash` object of video.js during initialization.

For example:

```javascript
var player = videojs('example-video', {
  html5: {
    dash: {
      limitBitrateByPortal: true
    }
  }
});
```

## Before Initialize Hook

Sometimes you may need to extend Dash.js, or have access to the Dash.js MediaPlayer before it is initialized. For these cases we have a beforeInitialize hook. The method is passed the Video.js player instance and the instance of Dash.js' MediaPlayer we are using, before the media player is initialized.

```javascript
videojs.Html5DashJS.beforeInitialize = function(player, mediaPlayer) {
  // Log MediaPlayer messages through video.js
  if (videojs && videojs.log) {
    mediaPlayer.getDebug().setLogToBrowserConsole(false);
    mediaPlayer.on('log', function(event) {
      videojs.log(event.message);
    });
  }
};
```
