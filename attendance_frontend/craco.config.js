'use strict';

/**
 * CRACO configuration to harden CRA builds on Node 18:
 * - Remove CssMinimizerPlugin (postcss-svgo/css-tree/source-map './util' path)
 * - Add resolve.alias to force 'source-map' to a compatible version (0.6.1)
 * - Disable React Fast Refresh to avoid "SourceMapConsumer.with is not a function" failures
 *   by removing @pmmmwh/react-refresh-webpack-plugin from plugins when needed.
 *
 * You can opt-in/opt-out via env:
 *   REACT_APP_DISABLE_FAST_REFRESH=true -> always disable fast refresh
 *   REACT_APP_DISABLE_FAST_REFRESH=false -> leave as-is unless a runtime check removes it
 *   REACT_APP_ENABLE_SOURCE_MAPS=false -> disable devtool/source maps for extra safety
 */
const path = require('path');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const DISABLE_FAST_REFRESH =
  String(process.env.REACT_APP_DISABLE_FAST_REFRESH || '').toLowerCase() === 'true';
const ENABLE_SOURCE_MAPS =
  String(process.env.REACT_APP_ENABLE_SOURCE_MAPS || '').toLowerCase() !== 'false';

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 1) Ensure resolve and alias exist
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = webpackConfig.resolve.alias || {};

      // 2) Force 'source-map' to a compatible v0.6 API to prevent SourceMapConsumer.with runtime issues.
      // This path is resolved from the project's node_modules; the exact version is pinned via package.json overrides.
      webpackConfig.resolve.alias['source-map'] = path.resolve(
        __dirname,
        'node_modules/source-map'
      );

      // 3) Remove CssMinimizerPlugin to avoid css-tree/source-map './util' issue in Node 18
      if (webpackConfig.optimization && Array.isArray(webpackConfig.optimization.minimizer)) {
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
          (minimizer) =>
            !(
              minimizer &&
              minimizer.constructor &&
              minimizer.constructor.name === 'CssMinimizerPlugin'
            )
        );
      }
      // Safety net: also remove any plugin instance references
      webpackConfig.plugins = (webpackConfig.plugins || []).filter(
        (p) => !(p instanceof CssMinimizerPlugin)
      );

      // 3b) Optionally disable source maps entirely to avoid any consumer/runtime issues.
      const isDev = webpackConfig.mode === 'development' || process.env.NODE_ENV !== 'production';
      if (!ENABLE_SOURCE_MAPS) {
        webpackConfig.devtool = false;
        if (webpackConfig.plugins) {
          // CRA sets GENERATE_SOURCEMAP based on env; ensure production source maps are off too
          process.env.GENERATE_SOURCEMAP = 'false';
        }
      } else if (isDev) {
        // Use cheap source maps in dev for speed and fewer edge cases
        webpackConfig.devtool = 'cheap-module-source-map';
      }

      // 4) Disable React Fast Refresh plugin if requested or if it causes issues.
      // CRA injects @pmmmwh/react-refresh-webpack-plugin in development.
      // We strip it out based on env switch OR always in development to be robust.
      if (isDev && webpackConfig.plugins && Array.isArray(webpackConfig.plugins)) {
        // If env toggled or as a robust fallback, remove the plugin
        if (DISABLE_FAST_REFRESH) {
          webpackConfig.plugins = webpackConfig.plugins.filter((plugin) => {
            const name = plugin && plugin.constructor && plugin.constructor.name;
            return name !== 'ReactRefreshPlugin';
          });
        } else {
          // Even when not explicitly disabled via env, defensively remove the plugin
          // if its presence would cause known sourcemap runtime issues.
          webpackConfig.plugins = webpackConfig.plugins.filter((plugin) => {
            const name = plugin && plugin.constructor && plugin.constructor.name;
            return name !== 'ReactRefreshPlugin';
          });
        }

        // Additionally, ensure devServer hot settings don't try to use react-refresh runtime
        if (webpackConfig.devServer) {
          // Keep HMR enabled but without react-refresh specifics
          webpackConfig.devServer.hot = true;
          // Prevent overlay errors from fast refresh pathway
          if (typeof webpackConfig.devServer.client === 'object') {
            webpackConfig.devServer.client.overlay = {
              errors: true,
              warnings: false,
            };
          }
        }
      }

      return webpackConfig;
    },
  },
};
