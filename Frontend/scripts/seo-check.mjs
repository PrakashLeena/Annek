/* npm run seo:check  (after npm run build)
   Reads the built HTML exactly as a crawler gets it (no JavaScript) for every URL in
   dist/sitemap.xml and fails if any page breaks the SEO rules in src/seo/pages.js:
   title max 60, description max 155, unique titles and descriptions, absolute canonical,
   og:url = canonical, one H1, valid JSON-LD, no dashes, no "Mannar", no review markup,
   no Google review content, preloader inlined, body pre-rendered. */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const SITE = "https://annek.tech";
const DASH = /[‐–—-]/;

const decode = (s) => s && s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&");
const pick = (html, re) => decode((html.match(re) || [])[1]);
const fileFor = (path) => resolve(DIST, path === "/" ? "index.html" : `.${path}/index.html`);

const sitemap = await readFile(resolve(DIST, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const problems = [];
const rows = [];
const seenTitle = new Map();
const seenDesc = new Map();

if (!urls.length) problems.push("sitemap.xml has no URLs");
for (const url of urls) {
  if (url.includes("#")) problems.push(`sitemap has a hash URL: ${url}`);
  const path = url.slice(SITE.length) || "/";
  const html = await readFile(fileFor(path), "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const root = html.slice(html.indexOf('<div id="root"'), html.indexOf("window.__ANNEK_DATA__"));
  const title = pick(head, /<title>([^<]*)<\/title>/);
  const desc = pick(head, /<meta name="description" content="([^"]*)"/);
  const canonical = pick(head, /<link rel="canonical" href="([^"]*)"/);
  const ogUrl = pick(head, /<meta property="og:url" content="([^"]*)"/);
  const robots = pick(head, /<meta name="robots" content="([^"]*)"/);
  const h1s = [...root.matchAll(/<h1[\s>][\s\S]*?<\/h1>/g)].map((m) => decode(m[0].replace(/<[^>]+>/g, "")));
  const types = [...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => {
    try { return JSON.parse(m[1])["@type"]; } catch (e) { problems.push(`${path}: JSON-LD does not parse (${e.message})`); return "INVALID"; }
  });
  const ok = (cond, msg) => { if (!cond) problems.push(`${path}: ${msg}`); };

  ok(title && title.length <= 60, `title length ${title?.length}`);
  ok(desc && desc.length <= 155, `description length ${desc?.length}`);
  ok(canonical === (path === "/" ? `${SITE}/` : `${SITE}${path}`), `canonical is ${canonical}`);
  ok(ogUrl === canonical, "og:url differs from canonical");
  ok(robots && !robots.includes("noindex"), `robots is ${robots}`);
  ok(h1s.length === 1, `${h1s.length} H1 elements`);
  ok(types.includes("BreadcrumbList") || path === "/", "no BreadcrumbList");
  for (const k of ["og:title", "og:description", "og:type", "og:image", "og:site_name"]) ok(head.includes(`property="${k}"`), `missing ${k}`);
  for (const k of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) ok(head.includes(`name="${k}"`), `missing ${k}`);
  ok(html.includes('id="annek-preloader"'), "preloader not inlined");
  ok(/<div id="root" data-path="[^"]+">\s*<[a-z]/.test(html), "body not pre-rendered");
  for (const [k, v] of [["title", title], ["description", desc], ["H1", h1s[0]]]) ok(!(v && DASH.test(v)), `dash in ${k}: ${v}`);
  ok(!/mannar/i.test(html), 'contains "Mannar"');
  ok(!/AggregateRating|"@type":"Review"/.test(html), "rating or review markup");
  ok(!/g-review|userRatingCount|"google":\{/.test(html), "Google review content baked into the HTML");
  if (seenTitle.has(title)) problems.push(`${path}: same title as ${seenTitle.get(title)}`);
  if (seenDesc.has(desc)) problems.push(`${path}: same description as ${seenDesc.get(desc)}`);
  seenTitle.set(title, path);
  seenDesc.set(desc, path);
  rows.push({ path, title, t: title?.length, d: desc?.length, canonical, h1: h1s.length, og: ogUrl === canonical ? "yes" : "NO", ld: types.join(", ") });
}

for (const f of ["404.html", "app.html"]) {
  const shell = await readFile(resolve(DIST, f), "utf8");
  if (!/<meta name="robots" content="noindex/.test(shell)) problems.push(`${f} is not noindex`);
  if (/<link rel="canonical"/.test(shell)) problems.push(`${f} has a canonical`);
}

console.log("| Path | Title | Title chars | Description chars | Canonical | H1 | og:url = canonical | JSON-LD |");
console.log("|---|---|---|---|---|---|---|---|");
for (const r of rows) console.log(`| \`${r.path}\` | ${r.title} | ${r.t} | ${r.d} | ${r.canonical} | ${r.h1} | ${r.og} | ${r.ld} |`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} sitemap pages pass.`);
