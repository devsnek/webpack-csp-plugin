const crypto = require('crypto');
const { URL } = require('url');
const CSP = require('csp-header');

module.exports = function({ src, node, csp, options }) {
  if (node) {
    const href = node.attrs.find(a => a.name === 'href');
    if (href) {
      addHref(href.value);
    } else {
      let style = node.childNodes.find(n => n.nodeName === '#text');
      if (!style) return;
      const hash = crypto.createHash(options.hashType).update(style.value).digest('hex');
      csp.push(`'${options.hashType}-${hash}'`);
    }
  } else if (src) {
    const re = /@import (?:url\()?(.+?)\)?;/g;
    let match;
    while ((match = re.exec(src)) !== null) {
      addHref(match[1].replace(/("|')/g, ''));
    }
  }

  function addHref(href) {
    const absolute = /^https?:\/\//i.test(href);
    if (absolute) {
      const origin = new URL(href).host;
      if (!csp.includes(origin)) csp.push(origin);
    } else if (!csp.includes(CSP.SELF)) {
      csp.push(CSP.SELF);
    }
  }
};
