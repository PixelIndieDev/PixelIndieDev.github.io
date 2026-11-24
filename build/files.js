const fs = require('fs');
const path = require('path');

function walk(dir, exts, ignoreList, out = []) {
  for (const item of fs.readdirSync(dir)) {
    if (ignoreList.includes(item)) continue;
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) walk(full, exts, ignoreList, out);
    else if (!exts || exts.includes(path.extname(item).toLowerCase())) out.push(full);
  }
  return out;
}

function escapeRegex(text) {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function countRefs(name, text) {
  return (text.match(new RegExp(`(?<![\\w-])${escapeRegex(name)}(?![\\w-])`, 'g')) ?? []).length;
}
module.exports = { walk, escapeRegex, countRefs };
