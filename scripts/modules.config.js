import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

let config = {
  moduleName: 'videojsDash',
  entry: 'src/js/videojs-dash.js',
  format: 'umd',
  external: ['video.js', 'dashjs'],
  globals: {
    'video.js': 'videojs',
    'dashjs': 'dashjs'
  },
  legacy: true,
  plugins: [
    json(),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [ 'es3', ['es2015', { loose: true, modules: false }] ],
      plugins: [ 'external-helpers', 'transform-object-assign' ]
    })
  ],
  targets: [
    {dest: 'dist/videojs-dash.cjs.js', format: 'cjs'},
    {dest: 'dist/videojs-dash.es.js', format: 'es'}
  ]
};

if (process.env.SHAKA) {
  config.entry = 'src/js/videojs-shaka.js';
  config.external = ['video.js', 'shaka-player'];
  config.globals = {
    'video.js': 'videojs',
    'shaka-player': 'shaka'
  };
  config.targets = [
    {dest: 'dist/videojs-dash.cjs.js', format: 'cjs'},
    {dest: 'dist/videojs-dash.es.js', format: 'es'}
  ];
}

export default config;
