## Webpack CSP Plugin

This plugin generates a CSP header from your webpack build.

hashing is used over nonces.

```js
new WebpackCspPlugin({
  output: 'csp_header.txt', // or `(header) => { ... }`
  reportURI: 'https://example.com/cspreport',
});
```
