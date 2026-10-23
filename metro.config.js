const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [__dirname,require('fs').realpathSync(__dirname+'/node_modules')],
  transformer: {
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
  resolver: {
    alias: {
      'react-native': 'react-native',
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
