/**
 * Configure CRA via CRACO for Node 18.
 * We disable CssMinimizerPlugin to avoid postcss-svgo/css-tree/source-map './util' error path.
 * JS minimization remains enabled; only CSS minification is skipped to keep builds stable.
 */
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      if (webpackConfig.optimization && Array.isArray(webpackConfig.optimization.minimizer)) {
        // Filter out CssMinimizerPlugin instances
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
          (minimizer) =>
            !(minimizer && minimizer.constructor && minimizer.constructor.name === 'CssMinimizerPlugin')
        );
        // Safety net: also remove any plugin instance references
        webpackConfig.plugins = (webpackConfig.plugins || []).filter(
          (p) => !(p instanceof CssMinimizerPlugin)
        );
      }
      return webpackConfig;
    },
  },
};
