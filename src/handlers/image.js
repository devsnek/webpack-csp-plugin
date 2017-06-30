const { URL } = require('url');
const CSP = require('csp-header');

module.exports = function({ node, csp }) {
  const src = node.attrs.find(a => a.name === 'src');
  const absolute = /^https?:\/\//i.test(src.value);
  if (absolute) {
    const origin = new URL(src.value).host;
    if (!csp.includes(origin)) csp.push(origin);
  } else if (!csp.includes(CSP.SELF)) {
    csp.push(CSP.SELF);
  }
};
