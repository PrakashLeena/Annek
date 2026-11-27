// Inlines the Annek preloader (src/preloader/*) into index.html for dev and build.
//   <!--preloader:css-->   →  <style>…preloader.css…</style>
//   <!--preloader:html-->  →  preloader.html markup + <script>…preloader.js…</script>
// The script stays classic (no type="module", no defer) so it runs before the app.
// CSS and JS are minified in production builds only.
import { readFileSync } from "node:fs";
import { resolve, normalize, sep } from "node:path";
import { transform } from "esbuild";

const CSS_SLOT = "<!--preloader:css-->";
const HTML_SLOT = "<!--preloader:html-->";

export default function preloaderPlugin({ dir = "src/preloader" } = {}) {
  let srcDir = "";
  let isBuild = false;
  const read = (file) => readFileSync(resolve(srcDir, file), "utf8");

  return {
    name: "annek-preloader",

    configResolved(config) {
      srcDir = resolve(config.root, dir);
      isBuild = config.command === "build";
    },

    // Dev: editing a preloader file reloads the page (index.html is not HMR-able).
    configureServer(server) {
      server.watcher.add(srcDir);
      server.watcher.on("change", (file) => {
        if (normalize(file).startsWith(srcDir + sep) && !file.endsWith(".md")) {
          server.ws.send({ type: "full-reload" });
        }
      });
    },

    transformIndexHtml: {
      order: "post",
      async handler(html, ctx) {
        // The site's own index.html must have both slots; any other HTML page is left alone.
        const isIndex = !ctx || ctx.path === "/index.html" || ctx.path === "/";
        if (!isIndex && !html.includes(CSS_SLOT) && !html.includes(HTML_SLOT)) return html;
        for (const slot of [CSS_SLOT, HTML_SLOT]) {
          if (!html.includes(slot)) throw new Error(`[annek-preloader] ${isIndex ? "index.html" : ctx.path} is missing the ${slot} placeholder`);
        }

        let css = read("preloader.css");
        let js = read("preloader.js");
        let markup = read("preloader.html");

        if (isBuild) {
          css = (await transform(css, { loader: "css", minify: true })).code.trim();
          js = (await transform(js, { loader: "js", minify: true })).code.trim();
          markup = markup.replace(/<!--[\s\S]*?-->/g, "").trim();
        }

        // Replacer functions, so "$&"-style sequences in the content are not treated as patterns.
        return html
          .replace(CSS_SLOT, () => `<style>${css}</style>`)
          .replace(HTML_SLOT, () => `${markup}\n<script>${js}</script>`);
      },
    },
  };
}
