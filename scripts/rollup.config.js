const generate = require('videojs-generate-rollup-config');
const nodeBuiltinsPlugin = require('@gkatsev/rollup-plugin-node-builtins');
const nodeGlobalsPlugin = require('rollup-plugin-node-globals');

// see https://github.com/videojs/videojs-generate-rollup-config
// for options
const options = {
  input: 'src/js/videojs-dash.js',
  distName: 'videojs-dash',
  exportName: 'videojsDash',
  // stream and string_decoder are used by some modules
  plugins(defaults) {
    return {
      browser: defaults.browser.concat([
        nodeBuiltinsPlugin(),
        nodeGlobalsPlugin()
      ]),
      module: defaults.module.concat([
        nodeBuiltinsPlugin(),
        nodeGlobalsPlugin()
      ]),
      test: defaults.test.concat([
        nodeBuiltinsPlugin(),
        nodeGlobalsPlugin()
      ])
    };
  }
};
const config = generate(options);

// Add additonal builds/customization here!

// export the builds to rollup
export default Object.values(config.builds);
