const parse5 = require('parse5');
const csp = require('csp-header');

const handlers = require('./handlers');

class WebpackCspPlugin {
  constructor(options = {}) {
    this.options = {
      hashType: options.hashType || 'sha256',
      output: options.output,
      reportURI: options.reportURI,
    };
    this.csp = {
      'default-src': options.defaultSRC || [csp.SELF],
      'script-src': options.scriptSRC || [],
      'style-src': options.styleSRC || [],
      'img-src': options.imageSRC || [],
      'worker-src': options.workerSRC || [],
    };
  }
  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      for (const [name, value] of Object.entries(compilation.assets)) {
        if (!name.endsWith('.html')) continue;
        const ast = parse5.parseFragment(value.source());
        (function walk(obj) {
          if (!obj.childNodes) return;
          for (const node of obj.childNodes) {
            switch (node.nodeName) {
              case 'script':
                handlers.script({ node, csp: this.csp['script-src'], options: this.options });
                handlers.worker({ node, csp: this.csp['worker-src'], options: this.options });
                break;
              case 'link':
                handlers.style({ node, csp: this.csp['style-src'], options: this.options });
                break;
              case 'img':
                handlers.image({ node, csp: this.csp['img-src'], options: this.options });
                break;
              default:
                break;
            }
            walk(node);
          }
        }.bind(this)(ast));
      }

      const output = this.options.output;
      if (!output) throw new Error('[CspPlugin] options.output must be provided');
      const header = csp({
        policies: this.csp,
        'report-uri': this.options.reportURI,
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
}

module.exports = WebpackCspPlugin;
