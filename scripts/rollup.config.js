const generate = require('videojs-generate-rollup-config');

// see https://github.com/videojs/videojs-generate-rollup-config
// for options
const options = {
  input: 'src/js/videojs-dash.js',
  distName: 'videojs-dash',
  exportName: 'videojsDash',
  globals(defaults) {
    Object.keys(defaults).forEach(function(type) {
      defaults[type].dashjs = 'dashjs';
    });

    return defaults;
  }
};
const config = generate(options);

// Add additonal builds/customization here!

// export the builds to rollup
export default Object.values(config.builds);
