const fs = require("fs");
const path = require("path");

class HtmlSource {
	static read(srcDir, fileName) {
		return fs.readFileSync(path.join(srcDir, fileName), "utf8");
	}
	static decode(text) {
		return text.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
	}
}

class SocialsExtractor {
	static extract(html) {
		const regex = /<a\s+href="([^"]+)"[^>]*>\s*<svg\s+aria-label="([^"]+?)\s+logo"/gi;
		return [...html.matchAll(regex)].map(match => ({
			name: HtmlSource.decode(match[2]),
			url: HtmlSource.decode(match[1])
		}));
	}
}

class ListItemExtractor {
	static extract(html) {
		const regex = /<li[^>]*>\s*<span>([\s\S]*?)<\/span>\s*<\/li>/gi;
		return [...html.matchAll(regex)].map(match => HtmlSource.decode(match[1]));
	}
}

class ModsExtractor {
	static extract(html) {
		const regex = /<a[^>]*class="[^"]*longButton[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<svg\s+aria-label="([^"]+?)\s+logo"/gi;
		return [...html.matchAll(regex)].map(match => ({ name: HtmlSource.decode(match[2]), url: HtmlSource.decode(match[1]), platform: HtmlSource.decode(match[3])}));
	}
}

class MarkdownFormatter {
	static links(items) {
		return items.map(item => `- [${item.name}](${item.url})`).join("\n");
	}
	static mods(items) {
		return items.map(item => `- [${item.name}](${item.url}) (on ${item.platform})`).join("\n");
	}
	static bullets(items) {
		return items.map(item => `- ${item}`).join("\n");
	}
}

class PlaceholderData {
	static build(srcDir) {
		const data = {
			socials: MarkdownFormatter.links(SocialsExtractor.extract(HtmlSource.read(srcDir, "index.html"))),
			aboutme: MarkdownFormatter.bullets(ListItemExtractor.extract(HtmlSource.read(srcDir, "aboutme.html"))),
			favoritegames: MarkdownFormatter.bullets(ListItemExtractor.extract(HtmlSource.read(srcDir, "favoritegames.html"))),
			mods: MarkdownFormatter.mods(ModsExtractor.extract(HtmlSource.read(srcDir, "mymods.html"))),
			date: new Date().toISOString().split("T")[0]
		};

		for (const [key, value] of Object.entries(data)) {
			if (!value) throw new Error(`Placeholder "${key}" is empty, check the matching html page`);
		}
		return data;
	}
}

class TemplateRenderer {
	static render(template, data, fileName) {
		return template.replace(/\{\{(\w+)\}\}/g, (full, key) => {
			if (!(key in data)) {
				throw new Error(`Unknown placeholder "${full}" in ${fileName}`);
			}
			return data[key];
		});
	}
}

class MarkdownGenerator {
	static run(srcDir, outDir) {
		const data = PlaceholderData.build(srcDir);
		const templateDir = path.join(srcDir, "markdown");
		for (const fileName of fs.readdirSync(templateDir)) {
			const template = fs.readFileSync(path.join(templateDir, fileName), "utf8");
			const output = TemplateRenderer.render(template, data, fileName);
			fs.writeFileSync(path.join(outDir, fileName), output);
			console.log(`Generated ${fileName}`);
		}
	}
}

if (require.main === module) {
	const rootDir = process.argv[2] || ".";
	MarkdownGenerator.run(rootDir, rootDir);
}
module.exports = MarkdownGenerator;
