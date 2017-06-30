const { URL } = require('url');
const crypto = require('crypto');
const CSP = require('csp-header');
const acorn = require('acorn');

module.exports = function({ node, csp, options }) {
  const code = node.childNodes.find(n => n.nodeName === '#text');
  if (!code) return;
  walk(acorn.parse(code.value), (_node) => {
    if (_node.type === 'NewExpression' && ['Worker', 'SharedWorker', 'ServiceWorker'].includes(_node.callee.name)) {
      finalize(_node.arguments[0].value);
    }
  });
  let match;
  const re = /serviceWorker\.register\((.+?)\)/g;
  while ((match = re.exec(code.value)) !== null) {
    finalize(match[1].slice(1, -1));
  }

  function finalize(src) {
    const raw = /^data:application\/javascript/.test(src);
    if (raw) {
      const hash = crypto.createHash(options.hashType).update(src).digest('hex');
      csp.add(`'${options.hashType}-${hash}'`);
    } else {
      const absolute = /^https?:\/\//i.test(src);
      if (absolute) {
        const origin = new URL(src).origin;
        csp.add(origin);
      } else {
        csp.add(CSP.SELF);
      }
    }
  }
};

// acorn/src/walk full not exported for some reason so i copy pasted
function walk(node, callback, base, state, override) {
  if (!base) base = require('acorn/dist/walk').base;
  (function c(node, st, override) { // eslint-disable-line no-shadow
    let type = override || node.type;
    base[type](node, st, c);
    callback(node, st, type);
  }(node, state, override));
}
