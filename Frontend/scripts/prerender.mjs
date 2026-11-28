/* Build step 3 of 3 (see package.json "build"):
     1. vite build                    → dist/ (client app, index.html with the preloader inlined)
     2. vite build --ssr              → dist-ssr/entry-server.js
     3. node scripts/prerender.mjs    → one HTML file per public page, plus app.html and sitemap.xml

   For every page in src/seo/pages.js it writes dist/<path>/index.html with that page's head
   (title, description, canonical, Open Graph, Twitter, JSON-LD) and its pre-rendered body.

   Public data (settings, portfolio, testimonials, solutions) is read from the live API once, so
   the HTML shows real content. If the API can't be reached the pages are still built, just
   without that data, and the browser fills it in. Google reviews and ratings are never baked in.
     PRERENDER_API_URL   API base (default https://annek.tech/api)
     PRERENDER_OFFLINE=1 skip the API entirely */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const SSR = resolve(ROOT, "dist-ssr");
const OFFLINE = process.env.PRERENDER_OFFLINE === "1";
const API = (process.env.PRERENDER_API_URL || "https://annek.tech/api").replace(/\/+$/, "");

const ssr = await import(pathToFileURL(resolve(SSR, "entry-server.js")).href);
const { render, PAGES, buildHead, headToHtml, privateHead, EMPTY_DATA, prerenderSafe, publicFeedback, publicPortfolio } = ssr;

// A slow or broken API must not stall the deploy: after 3 failures in a row the rest is skipped.
let failuresInARow = 0;

async function getJson(path, ok) {
  if (failuresInARow >= 3) { console.warn(`[prerender] ${path}: skipped, the API is not answering.`); return undefined; }
  // One retry, but only for network errors and timeouts (a cold start), not for HTTP errors.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(12000), headers: { accept: "application/json" } });
      if (!res.ok) { attempt = 2; throw new Error(`HTTP ${res.status}`); }
      const json = await res.json();
      if (!ok(json)) { attempt = 2; throw new Error("unexpected shape"); }
      failuresInARow = 0;
      return json;
    } catch (err) {
      if (attempt >= 2) {
        failuresInARow++;
        console.warn(`[prerender] ${path}: ${err.message}. Built without it; the browser loads it.`);
      }
    }
  }
  return undefined;
}

async function loadData() {
  if (OFFLINE) return { ...EMPTY_DATA, solutions: {} };
  const isArr = Array.isArray;
  const isObj = (d) => d && typeof d === "object" && !isArr(d);
  // One at a time: the API is serverless and a burst of cold starts can time out.
  const settings = await getJson("/settings", isObj);
  const catalog = await getJson("/catalog", (d) => isObj(d) && isArr(d.categories));
  const products = await getJson("/products", isArr);
  const portfolio = await getJson("/portfolio", isArr);
  const feedback = await getJson("/feedback", isArr);
  const stats = await getJson("/stats", isObj);
  const mobile = await getJson("/solutions?category=mobile", isArr);
  const web = await getJson("/solutions?category=web", isArr);
  const software = await getJson("/solutions?category=software", isArr);
  return prerenderSafe({
    ...EMPTY_DATA,
    ...(settings && { settings }),
    ...(catalog && { catalog }),
    ...(products && { products }),
    ...(portfolio && { portfolio: publicPortfolio(portfolio) }),
    ...(feedback && { feedback: publicFeedback(feedback) }),
    ...(stats && { stats }),
    solutions: { mobile: mobile || [], web: web || [], software: software || [] },
  });
}

// JSON inside an inline <script>: nothing in it can close the tag or open a comment.
const scriptJson = (o) => JSON.stringify(o)
  .replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
  .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

const HEAD_SLOT = "<!--seo:head-->";
const ROOT_SLOT = '<div id="root"><!--app--></div>';

function fill(template, headHtml, rootHtml) {
  for (const slot of [HEAD_SLOT, ROOT_SLOT]) {
    if (!template.includes(slot)) throw new Error(`[prerender] dist/index.html is missing ${slot}`);
  }
  if (!template.includes('id="annek-preloader"')) throw new Error("[prerender] dist/index.html has no inlined preloader");
  return template.replace(HEAD_SLOT, () => headHtml).replace(ROOT_SLOT, () => rootHtml);
}

const template = await readFile(resolve(DIST, "index.html"), "utf8");
const data = await loadData();
const written = [];

for (const page of Object.values(PAGES)) {
  // Each page only carries the solutions it shows.
  const pageData = { ...data, solutions: page.category ? { [page.category]: data.solutions[page.category] || [] } : {} };
  const head = buildHead(page, pageData);
  const body = render(page.path, pageData);
  const html = fill(
    template,
    headToHtml(head),
    `<div id="root" data-path="${page.path}">${body}</div>\n    <script>window.__ANNEK_DATA__=${scriptJson(pageData)}</script>`,
  );
  const file = page.path === "/" ? resolve(DIST, "index.html") : resolve(DIST, `.${page.path}`, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  written.push({ page, head });
}

// Shell for everything else (/admin, unknown paths → branded 404). Never indexed.
await writeFile(resolve(DIST, "app.html"), fill(template, headToHtml(privateHead("Annek", "noindex")), '<div id="root"></div>'));

await rm(SSR, { recursive: true, force: true });
console.log(`[prerender] ${written.length} pages + app.html (data: ${OFFLINE ? "offline" : API})`);
for (const { page, head } of written) console.log(`  ${page.path.padEnd(22)} ${head.title}`);
