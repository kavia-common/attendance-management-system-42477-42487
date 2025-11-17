/**
 * Development proxy to forward API calls from CRA dev server to Flask backend.
 * This avoids mixed content (HTTPS frontend -> HTTP backend) and CORS during local dev.
 *
 * Note: In the cloud preview, the platform may already terminate TLS and expose
 * both services over HTTPS. The proxy remains harmless and helps local runs.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

// PUBLIC_INTERFACE
module.exports = function(app) {
  /** Proxy /api and /docs to backend on port 3001 in development */
  const target = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
  const commonOptions = {
    target,
    changeOrigin: true,
    secure: false,
    // Preserve path as-is
    pathRewrite: (path) => path,
    onProxyReq(proxyReq) {
      // Ensure no caching
      proxyReq.setHeader('Cache-Control', 'no-cache');
    },
  };
  app.use(
    ['/api', '/docs', '/openapi.json'],
    createProxyMiddleware(commonOptions)
  );
};
