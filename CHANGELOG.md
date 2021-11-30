<a name="5.1.1"></a>
## [5.1.1](https://github.com/videojs/videojs-contrib-dash/compare/v5.1.0...v5.1.1) (2021-11-30)

### Bug Fixes

* update dashjs to 4.2.0 ([#372](https://github.com/videojs/videojs-contrib-dash/issues/372)) ([2f83f71](https://github.com/videojs/videojs-contrib-dash/commit/2f83f71))

<a name="5.1.0"></a>
# [5.1.0](https://github.com/videojs/videojs-contrib-dash/compare/v5.0.0...v5.1.0) (2021-09-17)

### Features

* ttml support ([#319](https://github.com/videojs/videojs-contrib-dash/issues/319)) ([3859998](https://github.com/videojs/videojs-contrib-dash/commit/3859998))

### Bug Fixes

* **package:** update dash.js to 4.0.1 ([#369](https://github.com/videojs/videojs-contrib-dash/issues/369)) ([3a7b4a6](https://github.com/videojs/videojs-contrib-dash/commit/3a7b4a6))

### Chores

* add example that uses TTML subtitles ([#368](https://github.com/videojs/videojs-contrib-dash/issues/368)) ([563aac6](https://github.com/videojs/videojs-contrib-dash/commit/563aac6))
* don't run tests on version ([6b15e7e](https://github.com/videojs/videojs-contrib-dash/commit/6b15e7e))

<a name="5.0.0"></a>
# [5.0.0](https://github.com/videojs/videojs-contrib-dash/compare/v4.1.0...v5.0.0) (2021-06-25)

### Features

* Dash.js 4.0.0 ([#363](https://github.com/videojs/videojs-contrib-dash/issues/363)) ([a9d76fc](https://github.com/videojs/videojs-contrib-dash/commit/a9d76fc))

### Chores

* skip require in vjsverify ([10488f6](https://github.com/videojs/videojs-contrib-dash/commit/10488f6))

### Documentation

* Update README to show support for Dash 3.x ([#361](https://github.com/videojs/videojs-contrib-dash/issues/361)) ([3854c61](https://github.com/videojs/videojs-contrib-dash/commit/3854c61)), closes [#336](https://github.com/videojs/videojs-contrib-dash/issues/336)


### BREAKING CHANGES

* no longer able to be required in nodejs.
* update to DASH.js 4.0

<a name="4.1.0"></a>
# [4.1.0](https://github.com/videojs/videojs-contrib-dash/compare/v4.0.1...v4.1.0) (2021-02-18)

### Bug Fixes

* **package:** update to dashjs[@3](https://github.com/3).2.0 ([#356](https://github.com/videojs/videojs-contrib-dash/issues/356)) ([490817d](https://github.com/videojs/videojs-contrib-dash/commit/490817d))

<a name="4.0.1"></a>
## [4.0.1](https://github.com/videojs/videojs-contrib-dash/compare/v4.0.0...v4.0.1) (2021-02-18)

### Bug Fixes

* rollup plugins should be dev dependencies ([#352](https://github.com/videojs/videojs-contrib-dash/issues/352)) ([9d09a60](https://github.com/videojs/videojs-contrib-dash/commit/9d09a60))

### Chores

* setup github ci ([#355](https://github.com/videojs/videojs-contrib-dash/issues/355)) ([e28dbc4](https://github.com/videojs/videojs-contrib-dash/commit/e28dbc4))
* update deps to resolve all audit issues ([#354](https://github.com/videojs/videojs-contrib-dash/issues/354)) ([c4585b8](https://github.com/videojs/videojs-contrib-dash/commit/c4585b8))

<a name="4.0.0"></a>
# [4.0.0](https://github.com/videojs/videojs-contrib-dash/compare/v3.0.0...v4.0.0) (2020-11-05)

### Features

* include dash.js in build ([#351](https://github.com/videojs/videojs-contrib-dash/issues/351)) ([6879286](https://github.com/videojs/videojs-contrib-dash/commit/6879286))

CHANGELOG
=========

## 3.0.0 (2020-10-26)
* BREAKING CHANGE: Update Dash.js to 3.1.3 (major version 3)

## 2.11.0 (2019-03-08)
* Fix bug where VTT captions wouldn't show
* Support for human-readable track labels

## 2.10.1 (2018-12-18)
* Change main to be `dist/videojs-dash.cjs.js`
* Reformat test code
* Add v7 to list of supported video.js dependencies

## 2.10.0 (2018-07-30)
* Cleanup of event addition and removal on dispose to not bork on source change
* Use MPD type and duration to determine if we should report live status
* Add error handler for new `mssError` in dash.js 2.6.8
* Pass through text track kind to dash.js

## 2.9.3 (2018-04-12)
* Retrigger dash.js errors on video.js

## 2.9.2 (2017-10-11)
* Depend on either Video.js 5.x or 6.x

## 2.9.1 (2017-06-15)
* Fix text tracks in IE

## 2.9.0 (2017-05-11)
* Load text tracks from dashjs into video.js

## 2.8.2 (2017-04-26)
* Show role in audio track label

## 2.8.1 (2017-02-09)
* Call update source hook in canHandleSource

## 2.8.0 (2017-02-02)
* Add support for multiple audio tracks
* Introduce videojs 6 forward compatibility while maintaining backward compatibility

## 2.7.1 (2017-02-02)
* Allow dash config object to accept setters with multiple args

## 2.7.0 (2017-01-30)
* Support all dash.js configuration options

## 2.6.1 (2017-01-05)
* Fixed Live display for live streams

## 2.6.0 (2016-12-12)
* Added initialization and update source hooks.

## 2.5.2 (2016-11-22)
* Don't pass empty object for key systems.

## 2.5.1 (2016-09-09)
* Skip source if requestMediaKeySystemAccess isn't present for key system

## 2.5.0 (2016-08-24)
* Expose mediaPlayer on player

## 2.4.0 (2016-07-07)
* ES6 rewrite
* Allow to pass option to limit bitrate by portal size

## 2.3.0 (2016-05-10)
* Add a hook before dash.js media player initialization

## 2.2.0 (2016-05-04)
* Added browserify support
* Remove manifest parsing

## 2.1.0 (2016-03-08)
* Update project to support dash.js 2.0
* Update deprecated `laURL` to utilize new `serverURL`
* Add canPlayType

## 2.0.0 (2015-10-16)
* Update project to be compatible with video.js 5.0
