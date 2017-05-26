import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';

let config = {
  moduleName: 'videojsDash',
  entry: 'src/js/videojs-dash.js',
  dest: 'dist/videojs-dash.js',
  format: 'umd',
  external: ['video.js', 'dashjs'],
  globals: {
    'video.js': 'videojs',
    'dashjs': 'dashjs'
  },
  legacy: true,
  plugins: [
    resolve({ browser: true, main: true, jsnext: true }),
    json(),
    commonjs({ sourceMap: false }),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [ 'es3', ['es2015', { loose: true, modules: false }] ],
      plugins: [ 'external-helpers', 'transform-object-assign' ]
    })
  ]
};

if (process.env.SHAKA) {
  config.entry = 'src/js/videojs-shaka.js';
  config.dest = 'dist/videojs-shaka.js';
  config.external = ['video.js', 'shaka-player'];
  config.globals = {
    'video.js': 'videojs',
    'shaka-player': 'shaka'
  };
}

export default config;
