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

## Setting the Buffer Time

The buffer time value specifies how many seconds of video to keep in the video buffer.  This value can be set by using the `setBufferTime(seconds)` method on the `sourceHandler`.

```
var sourceHandler = player.tech.sourceHandler_;
sourceHandler.setBufferTime(5);
```

## Interacting with Renditions

### Get all of the currently playing renditions.

To get the set of renditions that are currently in use for a particular type, use the `getRepresentationsByType(type)` method on the `sourceHandler`.  This will return a list of `rendition` objects.

```
var sourceHandler = player.tech.sourceHandler_;
var renditions = sourceHandler.getRepresentationsByType('video');
```

Any type accepted by Dash.js can be used.  The most commonly used types are `video` and `audio`.

### Automatic Bitrate Switching

By default, Dash.js will automatically switch between playing renditions depending on the user's environment.  Use the `setAutoSwitchQuality(boolean)` method to disable/enable this feature.

```
var sourceHandler = player.tech.sourceHandler_;
sourceHandler.setAutoSwitchQuality(false);
```

### Manually set the currently playing bitrate

The currently playing rendition can be manually set by using the `setQualityFor(type, value)` method on the `sourceHandler`.  Like `getRepresentationsByType(type)`, any valid `type` value from Dash.js can be used.  The `quality` value should the index value of the representation from the Array returned by `getRepresentationsByType(type)`.

```
var sourceHandler = player.tech.sourceHandler_;
var renditions = sourceHandler.getRepresentationsByType('video');
var hdIndex = renditions.findIndex(function (ren) {
    return (ren.width === 1920 && ren.height == 1080);
};
if (hdIndex !== -1) {
    sourceHandler.setQualityFor('video', hdIndex);
}
```

A few things to note when setting the bitrate manually:

* The video that has already been loaded by the player must finish playing before the new quality will be seen.  If quick switching is desired, the bufferTime (the max amount of time to keep in the buffer) should be set to a low value.  (The lowest this value could be is a single fragment.)
* If the automatic bitrate switching feature is *on* the video player may switch away from the manually selected bitrate.  To prevent this, automatic bitrate switching should be turned off.

## Interacting with Adaptation Sets

All available adaptation sets can be retrieved by using the `getAdaptations()` method on the `sourceHandler`.  This will return all adaptation sets for the current Period, even if the adaptation set is not currently being played.

```
var sourceHandler = player.tech.sourceHandler_;
var adaptations = sourceHandler.getAdaptations();
```

To get the currently playing adaptation set only, use the `getCurrentAdaptationSetFor(type)` method on the `sourceHandler`.  The type may be any valid Dash.js type.

```
var sourceHandler = player.tech.sourceHandler_;
var currentAdaptation = sourceHandler.getCurrentAdaptationSetFor('video');
```

## Rendition Whitelisting

The renditions that are available for playback (using manual switching and automatic bitrate switching) can be filtered so that only a 'whitelisted' subset can be played.  This can be accomplished by using the `setWhiteListRepresentations(set, filter)` method on the `sourceHandler`.  The value passed as the `set` arugment should either be the ID of the AdaptationSet or the entire AdaptationSet object.  The `filter` argument is a function which will be called for each representation object in the specified AdaptationSet and should return `true` or `false`, indicating whether or not the representation can be played.

```
var sourceHandler = player.tech.sourceHandler_;

var hdFilter = function (rep) {
    return (item.height >= 720);
};

// Using a known ID.
sourceHandler.setWhiteListRepresentations('primary_video', hdFilter);
```

```
var sourceHandler = player.tech.sourceHandler_;
var currentAdaptation = sourceHandler.getCurrentAdaptationSetFor('video');

var hdFilter = function (rep) {
    return (item.height >= 720);
};

// Using the video AdaptationSet that is currently playing.
sourceHandler.setWhiteListRepresentations(currentAdaptation, hdFilter);
```

When a whitelist is set, the player will verify whether or not the currently playing quality is in the whitelist.  If it is not, the player will transition to the most appropriate quality*.

When the Dash.js automatic bitrate switching logic selects a quality that is not in the whitelist the most appropriate quality* will be selected instead.

When the quality is manually set to a value that is not in the whitelist, no change will occur.

### *Most Appropriate Quality

When a bitrate is selected that is not in the whitelist, a `selector` function is used to determine which quality is most appropriate to transition to instead.  The `selector` is a function which accepts the arguments `proposedQuality`, `adaptation`, and `whiteListSet`.  Using this information, the `selector` function should return a new quality value of the actual representation to play.

The `selector` function can be set using the `setSelector(function)` method on `sourceHandler`.

The default `selector` function will choose the representation with the closest bandwidth value to the representation that was selected.