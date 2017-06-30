const crypto = require('crypto');
const { URL } = require('url');
const CSP = require('csp-header');

module.exports = function({ node, csp, options }) {
  const href = node.attrs.find(a => a.name === 'href');
  if (href) {
    const absolute = /^https?:\/\//i.test(href.value);
    if (absolute) {
      const origin = new URL(href.value).host;
      if (!csp.includes(origin)) csp.push(origin);
    } else if (!csp.includes(CSP.SELF)) {
      csp.push(CSP.SELF);
    }
  } else {
    let style = node.childNodes.find(n => n.nodeName === '#text');
    if (!style) return;
    const hash = crypto.createHash(options.hashType).update(style.value).digest('hex');
    csp.push(hash);
  }
};
