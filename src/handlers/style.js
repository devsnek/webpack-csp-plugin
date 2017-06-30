const crypto = require('crypto');
const { URL } = require('url');
const CSP = require('csp-header');
const cssparser = require('cssparser/lib/cssparser');

module.exports = function({ src, node, csp, options }) {
  if (node) {
    const href = node.attrs.find(a => a.name === 'href');
    if (href) {
      addHref(href.value, csp.style);
    } else {
      let style = node.childNodes.find(n => n.nodeName === '#text');
      if (!style) return;
      const hash = crypto.createHash(options.hashType).update(style.value).digest('hex');
      csp.style.add(`'${options.hashType}-${hash}'`);
    }
  } else if (src) {
    const parser = new cssparser.Parser();
    const rules = parser.parse(src)._props_.value;
    for (const rule of rules) {
      switch (rule.constructor.name) {
        case 'AtImport':
          addHref(rule._props_.value._props_.value, csp.font);
          break;
        case 'AtFontface': {
          for (const declaration of rule._props_.value._props_.value) addFontFace(declaration);
          break;
        }
        default:
          break;
      }
    }
  }

  function addFontFace(declaration) {
    if (declaration.constructor.name === 'UrlVal') {
      addHref(declaration._props_.value, csp.font);
    } else if (declaration.constructor.name === 'Array') {
      for (const d of declaration._props_.value) addFontFace(d);
    } else if (declaration._props_.value.constructor.name === 'UrlVal') {
      addHref(declaration._props_.value._props_.value, csp.font);
    } else if (declaration._props_.value.constructor.name === 'Array') {
      for (const d of declaration._props_.value) addFontFace(d);
    }
  }

  function addHref(href, c) {
    const absolute = /^https?:\/\//i.test(href);
    if (absolute) {
      const origin = new URL(href).origin;
      c.add(origin);
    } else {
      c.add(CSP.SELF);
    }
  }
};
