const crypto = require('crypto');
const { URL } = require('url');
const CSP = require('csp-header');
const css = require('css');

function addOrigin(link, c) {
  const absolute = /^https?:\/\//i.test(link);
  if (absolute) {
    const origin = new URL(link).origin;
    c.add(origin);
  } else {
    c.add(CSP.SELF);
  }
}

module.exports = ({ node, csp, options }) => {
  const href = node.attrs.find((a) => a.name === 'href');
  if (href) {
    addOrigin(href.value, csp.style);
  } else {
    const text = node.childNodes.find((n) => n.nodeName === '#text');
    if (!text)
      return;
    const hash = crypto.createHash(options.hashType).update(text.value).digest('hex');
    csp.style.add(`'${options.hashType}-${hash}'`);

    const rules = css.parse(text.value).stylesheet.rules;
    for (const rule of rules) {
      switch (rule.type) {
        case 'import':
          addOrigin(rule.import.replace(/(url\(|\))/g, '').replace(/["']/g, ''), csp.style);
          break;
        case 'font-face': {
          const src = rule.declarations.find((d) => d.property === 'src');
          if (!src)
            break;
          for (const url of src.value.split('\n').map((x) => x.trim()))
            addOrigin(url.replace(/(url\(|\))/g, '').replace(/["']/g, ''), csp.font);
          break;
        }
        default:
          break;
      }
    }
  }
};
