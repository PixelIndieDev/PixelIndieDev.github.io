class AssetVersioner {
  constructor(version, exclude = ['Caching.js']) {
    this.version = version;
    this.exclude = exclude;
  }
  shouldVersion(url) {
    return !/^([a-z]+:)?\/\//i.test(url) && /\.(css|js)$/i.test(url) && !this.exclude.some(name => url.endsWith(name));
  }
  html(html) {
    return html.replace(/(?<![\w-])(href|src)=(["'])([^"'?#]+)\2/g, (m, attr, q, url) => this.shouldVersion(url) ? `${attr}=${q}${url}?v=${this.version}${q}` : m);
  }
  js(code) {
    return code.replace(/(["'`])(\/assets\/[^"'`?#]+)\1/g, (m, q, url) => this.shouldVersion(url) ? `${q}${url}?v=${this.version}${q}` : m);
  }
}
module.exports = AssetVersioner;
