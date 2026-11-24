const acorn = require('acorn');
const walk = require('acorn-walk');
const { MagicString } = require('magic-string');

const SELECTOR_REF = /([.#])(-?[_a-zA-Z][\w-]*)/g;
const SELECTOR_CHARS = /^[\w\s.#>+~:,()[\]="'*^$|-]+$/;

class ReferenceMangler {
  constructor(classMap) {
    this.map = classMap;
  }

  name(n) {
    return n in this.map ? this.map[n] : n;
  }

  // Rewrites .foo and #foo inside a selector like '.content a' or 'picture.stats'
  selector(text) {
    return text.replace(SELECTOR_REF, (m, prefix, n) => (n in this.map ? prefix + this.map[n] : m));
  }

  // Rewrites a space separated list only when every word is a known class
  classList(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length || !words.every(w => w in this.map)) return text;
    return text.replace(/\S+/g, w => this.map[w]);
  }

  string(text) {
    if (text in this.map) return this.map[text];
    if (/[.#]/.test(text) && SELECTOR_CHARS.test(text)) return this.selector(text);
    return this.classList(text);
  }

  css(text) {
    return this.selector(text).replace(/--[\w-]+/g, n => this.name(n));
  }

  js(code) {
    let ast;
    try {
      ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script' });
    } catch {
      ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    }

    // Import paths are never class references
    const skip = new Set();
    walk.full(ast, node => {
      if (node.source && /Import|Export/.test(node.type)) skip.add(node.source);
    });

    // The walker never visits plain object keys, but Piggy.js uses quoted keys as selectors
    const out = new MagicString(code);
    const rewrite = node => {
      const next = this.string(node.value);
      if (next !== node.value) out.overwrite(node.start, node.end, JSON.stringify(next));
    };
    walk.full(ast, node => {
      if (skip.has(node)) return;
      if (node.type === 'Property' && !node.computed && node.key.type === 'Literal' && typeof node.key.value === 'string') {
        rewrite(node.key);
      } else if (node.type === 'Literal' && typeof node.value === 'string') {
        rewrite(node);
      } else if (node.type === 'TemplateElement') {
        const next = this.string(node.value.raw);
        if (next !== node.value.raw) out.overwrite(node.start, node.end, next);
      }
    });
    return out.toString();
  }

  html(html) {
    return html
      .replace(/(?<![\w-])class=(["'])([^"']+)\1/g, (m, q, v) =>
        `class=${q}${v.split(/\s+/).map(c => this.name(c)).join(' ')}${q}`)
      .replace(/(?<![\w-])style=(["'])([^"']*)\1/g, (m, q, v) => `style=${q}${this.css(v)}${q}`)
      .replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, o, b, c) => o + this.css(b) + c)
      .replace(/(<script\b(?![^>]*\bsrc=)[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, o, b, c) => {
        const type = o.match(/\btype=["']?([^"'\s>]+)/i)?.[1];
        if (type && !/^(module|text\/javascript)$/i.test(type)) return m;
        return o + this.js(b) + c;
      });
  }
}

module.exports = ReferenceMangler;
