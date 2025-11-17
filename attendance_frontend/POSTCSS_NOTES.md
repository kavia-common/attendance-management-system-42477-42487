Why we disabled CSS minimization (postcss-svgo path)

Context:
- CRA v5 uses css-minimizer-webpack-plugin + cssnano, which pulls postcss-svgo.
- On Node 18 certain dependency paths lead to css-tree/source-map './util' runtime error.

What we changed:
- Configured CRACO to remove CssMinimizerPlugin from the build. This avoids the failing optimization step.
- Also included a postcss.config.js disabling postcss-svgo for extra safety.

Impact:
- CSS minification (esp. SVG optimization) is skipped; JS minification remains enabled.
- Dev server and production build remain stable on Node 18.

How to re-enable safely (optional):
- Upgrade the cssnano/postcss-svgo toolchain to a set known to work on Node 18.
- Remove the CRACO minimizer override and the postcss.config.js once verified.
