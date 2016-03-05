# video.js MPEG-DASH Source Handler

[![Build Status](https://travis-ci.org/videojs/videojs-contrib-dash.svg?branch=master)](https://travis-ci.org/videojs/videojs-contrib-dash)

A video.js source handler for supporting MPEG-DASH playback through a video.js player on browsers with support for Media Source Extensions.

## Getting Started

Download [Dash.js](https://github.com/Dash-Industry-Forum/dash.js/releases) and [videojs-contrib-dash](https://github.com/videojs/videojs-contrib-dash/releases). Include them both in your web page along with video.js:

```html
<video id=example-video width=600 height=300 class="video-js vjs-default-skin" controls>
  <source
     src="https://example.com/dash.mpd"
     type="application/dash+xml">
</video>
<script src="video.js"></script>

<!-- Dash.js -->
<script src="dash.all.min.js"></script>

<!-- videojs-contrib-dash stylesheet -->
<link rel="stylesheet" href="videojs-dash.css"></link>
<!-- videojs-contrib-dash script -->
<script src="videojs-dash.min.js"></script>

<script>
var player = videojs('example-video');
player.play();
</script>
```

Checkout our [live example](http://videojs.github.io/videojs-contrib-dash/) if you're having trouble.

## Configuring Dash.js

Certian properties of Dash.js can be configured with the `dashOptions` value pass to `player.src()`.

The following values can be set:

* bufferTime - A number that indicates the maximum amount of time that should be in the buffer.

```
player.src({
    src: 'http://example.com/my/manifest.mpd',
    type: 'application/dash+xml',
    dashOptions: {
        bufferTime: 5
    }
});
```

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

## Extending Dash.js

'Plugins' that utilze the Dash.js extension model can be included by using the `plugins` value passed to `player.src()`.

```
player.src({
    src: 'http://example.com/my/manifest.mpd',
    type: 'application/dash+xml',
    plugins: [
        videojs.dashAbrPlugin
    ]
});
```

Each object in the `plugins` array should have a method `initialize(mediaPlayer)`.  In the `initialize` method the plugin should use `mediaPlayer.extend()` to create the extension.

```
function SuperRequestModifier {
    ...
}

var myPlugin = {
    initialize: function (mediaPlayer) {
        mediaPlayer.extend('RequestModifier', SuperRequestModifier, false);
    }
}
```