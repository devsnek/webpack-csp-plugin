const crypto = require('crypto');
const { URL } = require('url');
const CSP = require('csp-header');

module.exports = function({ node, csp, options }) {
  const src = node.attrs.find(a => a.name === 'src');
  if (src) {
    const absolute = /^https?:\/\//i.test(src.value);
    if (absolute) {
      const origin = new URL(src.value).host;
      if (!csp.includes(origin)) csp.push(origin);
    } else if (!csp.includes(CSP.SELF)) {
      csp.push(CSP.SELF);
    }
  } else {
    let code = node.childNodes.find(n => n.nodeName === '#text');
    if (!code) return;
    const hash = crypto.createHash(options.hashType).update(code.value).digest('hex');
    csp.push(hash);
  }
};
