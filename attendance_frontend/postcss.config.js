module.exports = {
  plugins: [
    // Keep default CRA PostCSS plugins implicitly, but explicitly disable svgo used by cssnano to avoid css-tree/source-map util error
    // This configuration prevents postcss-svgo from running in the minification pipeline.
    [
      'postcss-svgo',
      false
    ]
  ]
};
