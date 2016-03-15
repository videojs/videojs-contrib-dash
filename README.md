# video.js MPEG-DASH Source Handler

[![Build Status](https://travis-ci.org/videojs/videojs-contrib-dash.svg?branch=master)](https://travis-ci.org/videojs/videojs-contrib-dash)

A video.js source handler for supporting MPEG-DASH playback through a video.js player on browsers with support for Media Source Extensions.

### Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Getting Started](#getting-started)
  - [Running Tests](#running-tests)
  - [Tag and Release](#tag-and-release)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting Started

Download [videojs-contrib-dash](https://github.com/videojs/videojs-contrib-dash/releases). Include it in your web page along with video.js:

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
<link rel="stylesheet" href="videojs-contrib-dash.css"></link>
<!-- videojs-contrib-dash script -->
<script src="videojs-contrib-dash.min.js"></script>

<script>
var player = videojs('example-video');
player.play();
</script>
```

Note that `videojs-contrib-dash` contains the code of Dash.js, so there is no need to load it separately.

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

### Running Tests

- In all available and supported browsers: `npm test`
- In a specific browser: `npm run test:chrome`, `npm run test:firefox`, etc.
- While development server is running, navigate to [`http://localhost:9999/test/`](http://localhost:9999/test/) (_note:_ port may vary, check console output)

### Tag and Release

1. Make sure everything is committed.
1. `npm version *` where `*` is `major`, `minor`, `patch`, etc. [Read more about versioning.](https://github.com/videojs/generator-videojs-plugin/docs/standards.md#versioning)
1. `npm publish`

## License

Apache-2.0. Copyright (c) Brightcove, Inc.
