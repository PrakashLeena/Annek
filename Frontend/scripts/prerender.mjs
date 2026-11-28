/* Build step 3 of 3 (see package.json "build"):
     1. vite build                    → dist/ (client app, index.html with the preloader inlined)
     2. vite build --ssr              → dist-ssr/entry-server.js
     3. node scripts/prerender.mjs    → one HTML file per public page, plus 404.html, app.html and sitemap.xml

   For every page in src/seo/pages.js, and every published portfolio project (/portfolio/<slug>),
   it writes dist/<path>/index.html with that page's head (title, description, canonical, Open
   Graph, Twitter, JSON-LD) and its pre-rendered body.

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
const { render, PAGES, projectPage, buildHead, headToHtml, privateHead, EMPTY_DATA, prerenderSafe, publicFeedback, publicPortfolio } = ssr;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // also keeps every project path inside dist/

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
  // Every published project's page data. If a detail can't be loaded the card data is used.
  const projects = {};
  for (const card of (portfolio || []).filter((c) => c && typeof c.slug === "string" && SLUG.test(c.slug))) {
    projects[card.slug] = (await getJson(`/portfolio/${card.slug}`, isObj)) || card;
  }
  return prerenderSafe({
    ...EMPTY_DATA,
    ...(settings && { settings }),
    ...(catalog && { catalog }),
    ...(products && { products }),
    ...(portfolio && { portfolio: publicPortfolio(portfolio) }),
    ...(feedback && { feedback: publicFeedback(feedback) }),
    ...(stats && { stats }),
    solutions: { mobile: mobile || [], web: web || [], software: software || [] },
    projects,
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

async function writePage(page, pageData) {
  const head = buildHead(page, pageData);
  const body = render(page.path, pageData);
  const html = fill(
    template,
    headToHtml(head),
    `<div id="root" data-path="${page.path}">${body}</div>
    <script>window.__ANNEK_DATA__=${scriptJson(pageData)}</script>`,
  );
  const file = page.path === "/" ? resolve(DIST, "index.html") : resolve(DIST, `.${page.path}`, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  written.push({ page, head });
}

for (const page of Object.values(PAGES)) {
  // Each page only carries the data it shows.
  await writePage(page, { ...data, projects: {}, solutions: page.category ? { [page.category]: data.solutions[page.category] || [] } : {} });
}
for (const project of Object.values(data.projects)) {
  await writePage(projectPage(project), { ...data, solutions: {}, projects: { [project.slug]: project } });
}

// Not pre-rendered, rendered in the browser.
//   404.html      Vercel serves it with a real HTTP 404 for any path without a file; the app shows the branded 404.
//   app.html      the shell vercel.json rewrites /admin to (noindex).
//   project.html  the shell vercel.json rewrites /portfolio/<slug> to when that project has no built page yet
//                 (published after the last deploy, or an old slug). The browser loads it, sets its head,
//                 redirects old slugs and shows the 404 (noindex) for unknown ones.
const shell = '<div id="root"></div>';
await writeFile(resolve(DIST, "404.html"), fill(template, headToHtml(privateHead("Page Not Found | Annek Software Development", "noindex")), shell));
await writeFile(resolve(DIST, "app.html"), fill(template, headToHtml(privateHead("Admin | Annek", "noindex, nofollow")), shell));
await writeFile(resolve(DIST, "project.html"), fill(template, headToHtml({ title: "Portfolio | Annek Software Development", canonical: null, meta: [], jsonLd: [], preload: [] }), shell));

// sitemap.xml: every indexable pre-rendered page (real URLs only, no #, no admin, no 404).
const today = new Date().toISOString().slice(0, 10);
const indexable = written.filter(({ head }) => head.meta.some(([, k, v]) => k === "robots" && v && !v.includes("noindex")));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map(({ head }) => `  <url>
    <loc>${head.canonical}</loc>
    <lastmod>${today}</lastmod>
  </url>`).join("\n")}
</urlset>
`;
await writeFile(resolve(DIST, "sitemap.xml"), sitemap);

await rm(SSR, { recursive: true, force: true });
console.log(`[prerender] ${written.length} pages + 404.html + app.html + project.html, sitemap.xml with ${indexable.length} URLs (data: ${OFFLINE ? "offline" : API})`);
for (const { page, head } of written) console.log(`  ${page.path.padEnd(34)} ${head.title}`);
