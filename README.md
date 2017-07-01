## Webpack CSP Plugin

This plugin generates a CSP header from your webpack build.

Hashing is used over nonces to prevent modifying the build in unexpected ways.

Right now workers (`Worker`, `SharedWorker`, `ServiceWorker`) are not parsed due to the
complexity of how they can be mounted, so you will need to add those rules manually.

```js
new WebpackCspPlugin({
  output: 'csp_header.txt', // or `(header) => { ... }`
  reportURI: 'https://example.com/cspreport', // if you have a csp reporting server
  workerSRC: ['https://worker.io/sw.js'], // if you use workers (see above)
});
```
