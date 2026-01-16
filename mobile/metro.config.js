/**
 * Metro Configuration for React Native
 * Bundler for the mobile app
 */

const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  
  return {
    ...defaultConfig,
    resolver: {
      alias: {
        '@components': './src/components',
        '@styles': './src/styles',
        '@utils': './src/utils',
        '@services': './src/services',
        '@hooks': './src/hooks'
      }
    }
  };
});
