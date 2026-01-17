/* eslint-disable */
const { getDefaultConfig } = require('expo/metro-config');

/**
 * Build Optimization Configuration
 * Metro bundler optimizations and performance settings
 */

const config = {
  ...getDefaultConfig(__dirname),
  
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  
  resolver: {
    alias: {
      // Optimize imports for faster resolution
      '@components': './src/components',
      '@screens': './screens',
      '@context': './src/context',
      '@utils': './src/utils',
      '@services': './src/services',
    },
    
    // Exclude unnecessary modules from bundle
    blacklistRE: /expo\/(AppEntry|Expo\.js)/,
  },
  
  serializer: {
    // Enable Hermes for better performance
    enableHermes: true,
    
    // Optimize bundle size
    getModulesRunBeforeMainModule: () => [
      require.resolve('react-native/Libraries/Core/InitializeCore'),
    ],
  },
};

// Add bundle splitting configuration
config.config = {
  // Enable code splitting for better performance
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        enforce: true,
      },
    },
  },
  
  // Optimize bundle size
  optimization: {
    minimize: true,
    minimizer: [
      // Terser for JavaScript minification
      new (require('terser')).TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production' ? true : false,
            drop_debugger: process.env.NODE_ENV === 'production' ? false : true,
          },
          mangle: true,
          output: {
            comments: false,
          },
        },
      }),
    ],
    
    // Tree shaking
    usedExports: true,
    sideEffects: false,
  },
};

// Performance monitoring
config.performance = {
  hints: 'warning',
  maxEntrypointSize: 512000, // 512KB
  maxAssetSize: 512000, // 512KB
};

// Development optimizations
config.development = {
  // Fast refresh for development
  fastRefresh: true,
  
  // Source maps for debugging
  sourceMap: true,
  
  // Hot module replacement
  hot: true,
};

// Production optimizations
config.production = {
  // Disable source maps in production
  sourceMap: false,
  
  // Enable all optimizations
  minimize: true,
  
  // Remove development code
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __DEV__: 'false',
  },
};

module.exports = config;
