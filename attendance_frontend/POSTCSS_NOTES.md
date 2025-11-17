Why we disabled postcss-svgo

Context:
- react-scripts@5 (CRA v5) uses css-minimizer-webpack-plugin + cssnano, which pulls postcss-svgo.
- On Node 18 with the dependency graph in this project, postcss-svgo resolves to svgo@2 which depends on css-tree -> source-map, causing a runtime error:
  Error: Cannot find module './util' (from css-tree/node_modules/source-map/lib/source-map-generator.js)

What we changed:
- Added postcss.config.js that disables the postcss-svgo plugin. This avoids the failing optimization step while keeping the rest of CSS minification intact.

Impact:
- CSS SVG optimization is skipped; other minifications still apply.
- No change to npm scripts; `react-scripts start` and `react-scripts build` remain the same.

How to re-enable safely (optional):
- Update dependency graph to versions known to work together (e.g., pin cssnano preset + postcss-svgo to a set compatible with Node 18).
- Remove the postcss.config.js override once the toolchain is upgraded and tested.
