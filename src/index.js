const parse5 = require('parse5');
const csp = require('csp-header');

const handlers = require('./handlers');

class WebpackCspPlugin {
  constructor(options = {}) {
    this.options = {
      hashType: options.hashType || 'sha256',
      output: options.output,
      reportUri: options.reportUri,
    };
    this.csp = {
      default: new Set(options.defaults || [csp.SELF]),
      script: new Set(options.scripts || []),
      style: new Set(options.styles || []),
      font: new Set(options.fonts || []),
      img: new Set(options.images || []),
      worker: new Set(options.workers || []),
    };
  }

  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      for (const [name, value] of Object.entries(compilation.assets)) {
        if (name.endsWith('.html')) this.handleHTML(value);
        else if (name.endsWith('.css')) this.handleCSS(value);
        else if (name.endsWith('.js')) this.handleJS(value);
      }

      const output = this.options.output;
      if (!output) throw new Error('[CspPlugin] options.output must be provided');
      const header = csp({
        policies: Object.entries(this.csp)
          .map(([name, value]) => [`${name}-src`, Array.from(value)])
          .reduce((o, [name, value]) => {
            o[name] = value;
            return o;
          }, {}),
        'report-uri': this.options.reportUri,
      });
      if (typeof output === 'function') {
        output(header);
      } else {
        compilation.assets[output] = {
          source: () => header,
          size: () => header.length,
        };
      }

      callback();
    });
  }

  handleHTML(value) {
    const ast = parse5.parseFragment(value.source());
    (function walk(obj) {
      if (!obj.childNodes) return;
      for (const node of obj.childNodes) {
        switch (node.nodeName) {
          case 'script':
            handlers.script({ node, csp: this.csp.script, options: this.options });
            // handlers.worker({ node, csp: this.csp.worker, options: this.options });
            break;
          case 'link': {
            const rel = node.attrs.find(a => a.name === 'rel');
            if (rel && rel.value === 'stylesheet') handlers.style({ node, csp: this.csp, options: this.options });
            break;
          }
          case 'style':
            handlers.style({ node, csp: this.csp, options: this.options });
            break;
          case 'img':
            handlers.image({ node, csp: this.csp.img, options: this.options });
            break;
          default:
            break;
        }
        walk(node);
      }
    }.bind(this)(ast));
  }

  handleCSS(value) {
    handlers.style({ node: {
      childNodes: [{ nodeName: '#text', value: value.source() }],
      attrs: [],
    }, csp: this.csp, options: this.options });
  }

  handleJS(value) {
    handlers.script({ node: {
      childNodes: [{ nodeName: '#text', value: value.source() }],
      attrs: [],
    }, csp: this.csp.script, options: this.options });
  }
}

module.exports = WebpackCspPlugin;
