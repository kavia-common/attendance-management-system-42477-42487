/**
 * Configure CRA via CRACO without ejecting.
 * We disable the CssMinimizerPlugin to avoid the postcss-svgo/css-tree/source-map './util' error.
 * This keeps JS minimization enabled while skipping CSS minification only.
 */
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      if (webpackConfig.optimization && Array.isArray(webpackConfig.optimization.minimizer)) {
        // Filter out CssMinimizerPlugin instances
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
          (minimizer) => !(minimizer && minimizer.constructor && minimizer.constructor.name === 'CssMinimizerPlugin')
        );
        // As a safety net, also remove any direct references
        webpackConfig.plugins = (webpackConfig.plugins || []).filter(
          (p) => !(p instanceof CssMinimizerPlugin)
        );
      }
      return webpackConfig;
    },
  },
};
