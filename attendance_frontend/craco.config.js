'use strict';

/**
 * CRACO configuration hardened for Node 18 and with React Fast Refresh fully disabled:
 * - Remove CssMinimizerPlugin (postcss-svgo/css-tree/source-map './util' path)
 * - Add resolve.alias to force 'source-map' to a compatible version (0.6.1)
 * - Fully disable React Fast Refresh plugin in ALL modes (development and production) so
 *   react-refresh runtime and $RefreshSig/$RefreshReg helpers are never emitted.
 * - Ensure devServer hot is standard HMR (no react-refresh), and configure Babel to exclude
 *   react-refresh/babel via CRACO babel override.
 *
 * Env toggles:
 *   REACT_APP_DISABLE_FAST_REFRESH=true -> keep fast refresh disabled (default behavior here)
 *   REACT_APP_ENABLE_SOURCE_MAPS=false -> disable devtool/source maps for extra safety
 */
const path = require('path');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const ENABLE_SOURCE_MAPS =
  String(process.env.REACT_APP_ENABLE_SOURCE_MAPS || '').toLowerCase() !== 'false';

function stripReactRefreshPlugins(list) {
  if (!Array.isArray(list)) return list;
  return list.filter((plugin) => {
    const name = plugin && plugin.constructor && plugin.constructor.name;
    // Remove @pmmmwh/react-refresh-webpack-plugin
    return name !== 'ReactRefreshPlugin';
  });
}

/**
 * Remove react-refresh/babel from any babel-loader occurrences within module.rules.
 */
function stripReactRefreshFromRules(rules) {
  if (!Array.isArray(rules)) return rules;
  for (const rule of rules) {
    if (!rule) continue;
    if (rule.use) {
      const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
      uses.forEach((u) => {
        const loader = u && (u.loader || u.loaderName || u.loaderPath || '');
        if (loader && String(loader).includes('babel-loader') && u.options && u.options.plugins) {
          u.options.plugins = (u.options.plugins || []).filter((p) => {
            const name = Array.isArray(p) ? p[0] : p;
            return !(typeof name === 'string' && name.includes('react-refresh/babel'));
          });
        }
      });
    }
    if (rule.oneOf) stripReactRefreshFromRules(rule.oneOf);
    if (rule.rules) stripReactRefreshFromRules(rule.rules);
  }
  return rules;
}

module.exports = {
  // Ensure CRA's Babel pipeline does NOT inject react-refresh/babel
  babel: {
    plugins: (plugins) => {
      // Filter out react-refresh/babel if it ever appears
      return (plugins || []).filter((p) => {
        if (!p) return false === false; // keep others
        const name = Array.isArray(p) ? p[0] : p;
        return !(typeof name === 'string' && name.includes('react-refresh/babel'));
      });
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Ensure resolve and alias exist
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = webpackConfig.resolve.alias || {};

      // Force 'source-map' to a compatible v0.6 API
      webpackConfig.resolve.alias['source-map'] = path.resolve(
        __dirname,
        'node_modules/source-map'
      );

      // Remove CssMinimizerPlugin to avoid css-tree/source-map './util' issue in Node 18
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
      webpackConfig.plugins = stripReactRefreshPlugins(
        (webpackConfig.plugins || []).filter((p) => !(p instanceof CssMinimizerPlugin))
      );

      // Optionally disable source maps entirely
      const isDev = webpackConfig.mode === 'development' || process.env.NODE_ENV !== 'production';
      if (!ENABLE_SOURCE_MAPS) {
        webpackConfig.devtool = false;
        process.env.GENERATE_SOURCEMAP = 'false';
      } else if (isDev) {
        webpackConfig.devtool = 'cheap-module-source-map';
      }

      // Remove React Refresh plugin from any remaining plugin arrays (defensive)
      if (Array.isArray(webpackConfig.plugins)) {
        webpackConfig.plugins = stripReactRefreshPlugins(webpackConfig.plugins);
      }

      // Strip any react-refresh/babel transform from babel-loader inside rules (defensive)
      if (webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
        webpackConfig.module.rules = stripReactRefreshFromRules(webpackConfig.module.rules);
      }

      // Ensure devServer does not try to use react-refresh runtime; use plain HMR
      if (webpackConfig.devServer) {
        webpackConfig.devServer.hot = true;
        if (typeof webpackConfig.devServer.client === 'object') {
          webpackConfig.devServer.client.overlay = {
            errors: true,
            warnings: false,
          };
        }
      }

      return webpackConfig;
    },
  },
};
