const fs = require('fs');
const path = require('path');
const browserslist = require('browserslist');
const lightningcss = require('lightningcss');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');
const CssProcessor = require('./CssProcessor');
const ReferenceMangler = require('./ReferenceMangler');
const AssetVersioner = require('./AssetVersioner');
const { walk, escapeRegex } = require('./files');

const BUILD_ID = Date.now().toString(36);
const srcDir = path.join(__dirname, '..');
const distDir = path.join(srcDir, 'dist');
const ignoreList = [
  '.git', '.github', 'node_modules', 'dist', 'build',
  'package.json', 'package-lock.json', '.gitignore', 'README.md', 'LICENSE'
];
const targets = lightningcss.browserslistToTargets(browserslist('defaults'));
const SAFELIST = [/^Trigger_bg_/];
const HTML_OPTIONS = {
  collapseWhitespace: true,
  removeComments: true,
  removeAttributeQuotes: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyJS: true,
  sortAttributes: true,
  sortClassName: true,
  decodeEntities: true,
  removeEmptyAttributes: true,
  collapseBooleanAttributes: true,
  removeOptionalTags: true,
  minifyCSS: (text, type) => {
    if (type === 'media') return text;
    if (type === 'inline') return lightningcss.transformStyleAttribute({ code: Buffer.from(text), minify: true, targets }).code.toString();
    return lightningcss.transform({ filename: 'inline.css', code: Buffer.from(text), minify: true, targets }).code.toString();
  }
};

const JS_OPTIONS = {
  ecma: 2020,
  compress: {
    passes: 3,
    drop_console: true,
    drop_debugger: true,
    unsafe_arrows: true,
    unsafe_methods: true
  },
  mangle: true,
  format: { comments: false }
};

function minifyJsonLd(html) {
  return html.replace(/(<script\b[^>]*type=["']?application\/ld\+json["']?[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, open, body, close) => open + JSON.stringify(JSON.parse(body)) + close);
}

function collectReservedNames(html) {
  const names = new Set();
  for (const m of html.matchAll(/(?<![\w-])(?:class|id)=(["'])([^"']+)\1/g)) {
    for (const token of m[2].split(/\s+/)) names.add(token);
  }
  return names;
}

function reportLeftovers(classMap) {
  const html = walk(distDir, ['.html'], []).map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const js = walk(distDir, ['.js'], []).map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const classTokens = new Set();
  for (const m of html.matchAll(/(?<![\w-])class=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    for (const token of (m[1] ?? m[2] ?? m[3]).split(/\s+/)) classTokens.add(token);
  }
  const leftovers = Object.entries(classMap).filter(([original, short]) => original !== short).filter(([original]) => classTokens.has(original)|| new RegExp(`[.#'"\`]${escapeRegex(original)}(?![\\w-])`).test(js)).map(([original]) => original);
  if (leftovers.length) console.warn('Check these, the original name is still in the output:', leftovers.join(', '));
}

function reportSizes() {
  const total = (dir, ext) => walk(dir, [ext], ignoreList).reduce((sum, f) => sum + fs.statSync(f).size, 0);
  for (const ext of ['.html', '.css', '.js']) {
    const before = total(srcDir, ext);
    const after = total(distDir, ext);
    console.log(`${ext.padEnd(6)} ${before} -> ${after} bytes (${Math.round((1 - after / before) * 100)}% smaller)`);
  }
}

(async () => {
  fs.rmSync(distDir, { recursive: true, force: true });
  
  const htmlFiles = walk(srcDir, ['.html'], ignoreList);
  const jsFiles = walk(srcDir, ['.js'], ignoreList);
  const htmlText = htmlFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const usageText = htmlText + '\n' + jsFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const css = new CssProcessor({ targets, safelist: SAFELIST, ignoreList });
  const classMap = css.process(srcDir, distDir, usageText, collectReservedNames(htmlText));
  const mangler = new ReferenceMangler(classMap);
  const versioner = new AssetVersioner(BUILD_ID);

  for (const src of walk(srcDir, null, ignoreList)) {
    const dist = path.join(distDir, path.relative(srcDir, src));
    const ext = path.extname(src).toLowerCase();
    fs.mkdirSync(path.dirname(dist), { recursive: true });

    if (ext === '.css') continue;
    if (ext === '.html') {
      const html = versioner.html(mangler.html(minifyJsonLd(fs.readFileSync(src, 'utf8'))));
      fs.writeFileSync(dist, await minifyHtml(html, HTML_OPTIONS));
    } else if (ext === '.js') {
      const code = fs.readFileSync(src, 'utf8').replaceAll('__BUILD_ID__', BUILD_ID);
      const result = await minifyJs(versioner.js(mangler.js(code)), JS_OPTIONS);
      fs.writeFileSync(dist, result.code);
    } else if (ext === '.webmanifest' || ext === '.json') {
      fs.writeFileSync(dist, JSON.stringify(JSON.parse(fs.readFileSync(src, 'utf8'))));
    } else {
      fs.copyFileSync(src, dist);
    }
  }

  reportLeftovers(classMap);
  reportSizes();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
