import videojs from 'video.js';
import Html5DashJS from './html5-dashjs';

/*
 * The source handler to play using Dash.js
 *
 * @param  {Object} source   The source object
 * @param  {Html5} tech  The instance of the Html5 tech
 */
let dashSourceHandler = {};

dashSourceHandler.canHandleSource = (source) => {
  const dashExtRE = /\.mpd/i;

  if (dashSourceHandler.canPlayType(source.type)) {
    return 'probably';
  } else if (dashExtRE.test(source.src)) {
    return 'maybe';
  }

  return '';
};

dashSourceHandler.handleSource = (source, tech) => {
  return new Html5DashJS(source, tech);
};

dashSourceHandler.canPlayType = (type) => {
  const dashTypeRE = /^application\/dash\+xml/i;

  if (dashTypeRE.test(type)) {
    return 'probably';
  }

  return '';
};

// Only add the SourceHandler if the browser supports MediaSourceExtensions
if (window.MediaSource) {
  videojs.getComponent('Html5').registerSourceHandler(dashSourceHandler, 0);
}

export default dashSourceHandler;
