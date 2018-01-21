const { URL } = require('url');
const CSP = require('csp-header');

module.exports = ({ node, csp }) => {
  const src = node.attrs.find((a) => a.name === 'src');
  const absolute = /^https?:\/\//i.test(src.value);
  if (absolute) {
    const origin = new URL(src.value).origin;
    csp.add(origin);
  } else {
    csp.add(CSP.SELF);
  }
};
