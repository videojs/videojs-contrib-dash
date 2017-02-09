CHANGELOG
=========

## HEAD (Unreleased)
_(none)_

--------------------

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

