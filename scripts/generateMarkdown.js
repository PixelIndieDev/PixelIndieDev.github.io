const fs = require("fs");
const path = require("path");
const ROOT_DIR = process.argv[2] || ".";
const TEMPLATE_DIR = path.join(ROOT_DIR, "markdown");

class HtmlSource {
	static read(fileName) {
		return fs.readFileSync(path.join(ROOT_DIR, fileName), "utf8");
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
	static build() {
		const data = {
			socials: MarkdownFormatter.links(SocialsExtractor.extract(HtmlSource.read("index.html"))),
			aboutme: MarkdownFormatter.bullets(ListItemExtractor.extract(HtmlSource.read("aboutme.html"))),
			favoritegames: MarkdownFormatter.bullets(ListItemExtractor.extract(HtmlSource.read("favoritegames.html"))),
			mods: MarkdownFormatter.mods(ModsExtractor.extract(HtmlSource.read("mymods.html"))),
			date: new Date().toISOString().split("T")[0]
		};

		for (const [key, value] of Object.entries(data)) {
			if (!value) throw new Error(`Placeholder "${key}" is empty, check the matching html page`);
		}
		return data;
	}
}

// replace placeholders in template
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
	static run() {
		const data = PlaceholderData.build();
		const templates = fs.readdirSync(TEMPLATE_DIR);
            
		for (const fileName of templates) {
			const template = fs.readFileSync(path.join(TEMPLATE_DIR, fileName), "utf8");
			const output = TemplateRenderer.render(template, data, fileName);
			fs.writeFileSync(path.join(ROOT_DIR, fileName), output);
			console.log(`Generated ${fileName}`);
		}
	}
}
MarkdownGenerator.run();