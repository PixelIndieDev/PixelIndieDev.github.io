const fs = require('fs');
const path = require('path');
const lightningcss = require('lightningcss');
const { walk, countRefs } = require('./files');
const FIRST_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NEXT_CHARS = FIRST_CHARS + '0123456789-_';

class CssProcessor {
  constructor({ targets, safelist, ignoreList, preprocessors = [] }) {
    this.targets = targets;
    this.safelist = safelist;
    this.ignoreList = ignoreList;
    this.preprocessors = preprocessors;
    this.classMap = Object.create(null);
    this.counter = 0;
  }

  isSafe(name) {
    return this.safelist.some(p => (p instanceof RegExp ? p.test(name) : p === name));
  }
  
  nextName() {
    let n = this.counter++;
    let name = FIRST_CHARS[n % FIRST_CHARS.length];
    n = Math.floor(n / FIRST_CHARS.length);
    while (n > 0) {
      n--;
      name += NEXT_CHARS[n % NEXT_CHARS.length];
      n = Math.floor(n / NEXT_CHARS.length);
    }
    return name;
  }

  transform(filename, content, unusedSymbols = []) {
    return lightningcss.transform({
      filename,
      code: Buffer.from(content),
      minify: true,
      cssModules: { dashedIdents: true },
      targets: this.targets,
      unusedSymbols
    });
  }

  preprocess(content) {
    return this.preprocessors.reduce((text, p) => p.before(text), content);
  }

  postprocess(code) {
    return this.preprocessors.reduce((text, p) => p.after(text), code);
  }

  process(srcDir, distDir, usageText, reserved) {
    const files = walk(srcDir, ['.css'], this.ignoreList).map(src => ({
      src,
      dist: path.join(distDir, path.relative(srcDir, src)),
      name: path.basename(src),
      content: this.preprocess(fs.readFileSync(src, 'utf8'))
    }));

    const keep = new Set();
    const counts = Object.create(null);
    for (const file of files) {
      const { exports } = this.transform(file.name, file.content);
      const selectorNames = new Set([...file.content.matchAll(/[.#](-?[_a-zA-Z][\w-]*)/g)].map(m => m[1]));
      for (const m of file.content.matchAll(/#(-?[_a-zA-Z][\w-]*)/g)) keep.add(m[1]);
      file.unused = Object.keys(exports ?? {}).filter(n => selectorNames.has(n) && !n.startsWith('--') && !this.isSafe(n) && countRefs(n, usageText) === 0);
      if (file.unused.length) console.log(`${file.name}: removed unused`, file.unused.join(', '));
      const result = this.transform(file.name, file.content, file.unused);
      file.code = result.code.toString();
      file.exports = result.exports ?? {};
      for (const original of Object.keys(file.exports)) {
        counts[original] = (counts[original] ?? 0) + countRefs(original, usageText) + 1;
      }
    }

    for (const original of Object.keys(counts).sort((a, b) => counts[b] - counts[a])) {
      if (keep.has(original) || this.isSafe(original)) {
        this.classMap[original] = original;
        continue;
      }
      let short;
      do short = this.nextName();
      while (reserved.has(short) || keep.has(short));
      this.classMap[original] = original.startsWith('--') ? '--' + short : short;
    }

    for (const file of files) {
      let code = file.code;
      const entries = Object.entries(file.exports).sort((a, b) => b[1].name.length - a[1].name.length);
      for (const [original, mapping] of entries) code = code.split(mapping.name).join(this.classMap[original]);
      fs.mkdirSync(path.dirname(file.dist), { recursive: true });
      fs.writeFileSync(file.dist, this.postprocess(code));
    }
    return this.classMap;
  }
}
module.exports = CssProcessor;
