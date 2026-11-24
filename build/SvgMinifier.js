const fs = require('fs');
const { optimize } = require('svgo');

class SvgMinifier {
  constructor() {
    this.config = {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              cleanupIds: false, // stop it from breaking file.svg#id
              removeHiddenElems: false,
              removeUselessDefs: false
            }
          }
        }
      ]
    };
  }

  ids(svg) {
    return new Set([...svg.matchAll(/\sid=["']([^"']+)["']/g)].map(m => m[1]));
  }

  minify(src, dist) {
    const input = fs.readFileSync(src, 'utf8');
    const { data } = optimize(input, { ...this.config, path: src });

    const after = this.ids(data);
    const lost = [...this.ids(input)].filter(id => !after.has(id));
    if (lost.length) {
      console.warn(`SVG ${src} lost ids (${lost.join(', ')}), copied unminified`);
      fs.copyFileSync(src, dist);
      return;
    }
    fs.writeFileSync(dist, data);
  }
}
module.exports = SvgMinifier;