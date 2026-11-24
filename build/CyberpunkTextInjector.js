const fs = require('fs');
const OLD_COLUMN_RULES = /\.matrix-column:nth-child\([^)]*\)::before\s*\{\s*content\s*:\s*"[^"]*"\s*\}/g;
const PLACEHOLDER = /__CYBERPUNK_TEXT_(\d+)__/g;

class CyberpunkTextInjector {
  constructor({ sentencesFile, columnCount = 40, minLength = 120, separator = ' ' }) {
    this.sentences = fs.readFileSync(sentencesFile, 'utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    if (!this.sentences.length) throw new Error(`No sentences found in ${sentencesFile}`);
    this.columnCount = columnCount;
    this.minLength = minLength;
    this.separator = separator;
    this.columnTexts = [];
  }

  static encode(sentence) {
    let text = sentence + ' ';
    while (Buffer.byteLength(text, 'utf8') % 3 !== 0) text += ' ';
    return Buffer.from(text, 'utf8').toString('base64');
  }

  shuffledEncoded() {
    const list = this.sentences.map(CyberpunkTextInjector.encode);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  buildColumnTexts() {
    let encoded = this.shuffledEncoded();
    let next = 0;
    const texts = [];
    for (let column = 0; column < this.columnCount; column++) {
      const parts = [];
      let length = 0;
      while (length < this.minLength) {
        if (next === encoded.length) {
          encoded = this.shuffledEncoded();
          next = 0;
        }
        const part = encoded[next++];
        parts.push(part);
        length += part.length + this.separator.length;
      }
      texts.push(parts.join(this.separator));
    }
    return texts;
  }

  before(content) {
    if (!content.includes('.matrix-column')) return content;
    this.columnTexts = this.buildColumnTexts();
    let rules = '';
    for (let i = 0; i < this.columnCount; i++) {
      rules += `.matrix-column:nth-child(${i + 1})::before{content:"__CYBERPUNK_TEXT_${i}__"}`;
    }
    return content.replace(OLD_COLUMN_RULES, '') + '\n' + rules;
  }

  after(code) {
    let filled = 0;
    const result = code.replace(PLACEHOLDER, (match, index) => {
      filled++;
      return this.columnTexts[Number(index)];
    });
    if (filled) console.log(`cyberpunk text: filled ${filled} columns using ${this.sentences.length} sentences`);
    return result;
  }
}
module.exports = CyberpunkTextInjector;
