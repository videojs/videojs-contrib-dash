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

## Note on API methods below

In the examples below, the tech is retrieved from the player by passing in { IWillNotUseThisInPlugins: true }. For more information on why this is required, please refer to [video.js issue 2617](https://github.com/videojs/video.js/issues/2617).

## Setting the Buffer Time

The buffer time value specifies how many seconds of video to keep in the video buffer.  This value can be set by using the `setBufferTime(seconds)` method on the `sourceHandler`.

```
var sourceHandler = player.tech({ IWillNotUseThisInPlugins: true }).sourceHandler_;
sourceHandler.setBufferTime(5);
```

## Interacting with representations

### Get all of the representations and enable/disable them

To get all of the available representations, call the `representations()` method on the `sourceHandler`. This will return a list of plain objects, each with `width`, `height`, `bandwidth`, and `id` properties, and an `enabled()` method.

```
var sourceHandler = player.tech({ IWillNotUseThisInPlugins: true }).sourceHandler_;
var representations = sourceHandler.representations();
```

To see whether the representation is enabled or disabled, call its `enabled()` method with no arguments. To set whether it is enabled/disabled, call its `enabled()` method and pass in a boolean value.
