/* Sector 2 — Annek's own products: browse, open/install, and see subscription plans.
   Data comes from GET /api/products (managed in Admin › Own Products). */
import { useState } from "react";
import { money } from "../utils/format";

const TYPE = { web: "Web app", mobile: "Mobile app", software: "Software" };
const STATUS = { live: null, beta: "Beta", "coming-soon": "Coming soon" };
const INTERVAL = { month: "/ month", year: "/ year", "one-time": "one-time", free: "" };
const LINKS = [
  ["web", "Open web app"],
  ["android", "Get it on Android"],
  ["ios", "App Store"],
  ["windows", "Download for Windows"],
  ["mac", "Download for macOS"],
];

function Plans({ plans, onOrder, product }) {
  if (!plans?.length) return <div className="op-free">Free to use</div>;
  return (
    <div className="op-plans">
      {plans.map((pl) => (
        <div key={pl._id || pl.name} className={`op-plan ${pl.highlighted ? "hot" : ""}`}>
          <div className="op-plan-name">{pl.name}{pl.highlighted && <span className="op-pop">Popular</span>}</div>
          <div className="op-plan-price">
            {pl.interval === "free" || !pl.price ? "Free" : money(pl.price, pl.currency)}
            {pl.interval !== "free" && pl.price > 0 && <span> {INTERVAL[pl.interval]}</span>}
          </div>
          {pl.features?.length > 0 && <ul>{pl.features.map((f) => <li key={f}>{f}</li>)}</ul>}
          {pl.checkoutUrl
            ? <a className="op-sub" href={pl.checkoutUrl} target="_blank" rel="noopener noreferrer">Subscribe →</a>
            : <button className="op-sub" onClick={() => onOrder(`Subscription: ${product} — ${pl.name}`)}>Subscribe →</button>}
        </div>
      ))}
    </div>
  );
}

export default function OwnProducts({ products, onOrder }) {
  const [open, setOpen] = useState(null);
  if (!products?.length) return null;

  return (
    <section id="products" className="op-section" aria-labelledby="products-title">
      <style>{CSS}</style>
      <div className="op-wrap">
        <div className="op-head">
          <div className="op-eyebrow">✦ Our Products</div>
          <h2 id="products-title" className="op-title">Apps &amp; software <em>made by Annek</em></h2>
          <p className="op-sub-head">Ready-to-use products we build and run ourselves. Open them in your browser or install them on your device.</p>
        </div>
        <div className="op-grid">
          {products.map((p) => {
            const links = LINKS.filter(([k]) => p.links?.[k]);
            const expanded = open === p._id;
            return (
              <article key={p._id} className="op-card">
                <div className="op-img">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={`${p.name} screenshot`} loading="lazy" decoding="async" width="640" height="400" />
                    : <span aria-hidden="true">{p.type === "mobile" ? "📱" : p.type === "software" ? "💻" : "🌐"}</span>}
                  <div className="op-tags">
                    <span>{TYPE[p.type]}</span>
                    {STATUS[p.status] && <span className="warn">{STATUS[p.status]}</span>}
                  </div>
                </div>
                <div className="op-body">
                  <h3 className="op-name">{p.name}</h3>
                  {p.tagline && <p className="op-tagline">{p.tagline}</p>}
                  {p.description && <p className="op-desc">{p.description}</p>}
                  {p.features?.length > 0 && <ul className="op-feat">{p.features.slice(0, 5).map((f) => <li key={f}>{f}</li>)}</ul>}
                  {links.length > 0 && p.status !== "coming-soon" && (
                    <div className="op-links">
                      {links.map(([k, label], i) => (
                        <a key={k} href={p.links[k]} target="_blank" rel="noopener noreferrer" className={i === 0 ? "btn-dark op-btn" : "op-btn2"}>{label}</a>
                      ))}
                    </div>
                  )}
                  {p.status === "coming-soon" && (
                    <button className="op-btn2" onClick={() => onOrder(`Notify me: ${p.name}`)}>Notify me at launch</button>
                  )}
                  <button className="op-toggle" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : p._id)}>
                    {expanded ? "Hide plans ▲" : `View plans${p.plans?.length ? ` (${p.plans.length})` : ""} ▼`}
                  </button>
                  {expanded && <Plans plans={p.plans} onOrder={onOrder} product={p.name} />}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const CSS = `
.op-section{padding:100px 24px;background:#0f0f12;color:#fff}
.op-wrap{max-width:1140px;margin:0 auto}
.op-head{text-align:center;margin-bottom:48px}
.op-eyebrow{font-size:13px;color:#d4f74b;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:12px}
.op-title{font-size:clamp(32px,4vw,54px);font-weight:300;letter-spacing:-1.5px;line-height:1.1;margin-bottom:16px}
.op-title em{font-style:italic;color:#ff8a3d}
.op-sub-head{font-size:16px;color:rgba(255,255,255,.6);max-width:580px;margin:0 auto;line-height:1.6}
.op-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;align-items:start}
.op-card{background:#18181d;border:1px solid rgba(255,255,255,.08);border-radius:24px;overflow:hidden}
.op-img{position:relative;aspect-ratio:16/10;background:linear-gradient(135deg,#25202e,#1b2230);display:flex;align-items:center;justify-content:center;font-size:44px}
.op-img img{width:100%;height:100%;object-fit:cover;display:block}
.op-tags{position:absolute;top:12px;left:12px;display:flex;gap:6px}
.op-tags span{background:rgba(0,0,0,.55);backdrop-filter:blur(6px);border-radius:100px;padding:4px 10px;font-size:11px;font-weight:700;color:#fff}
.op-tags span.warn{background:#ff8a3d;color:#1a1a1a}
.op-body{padding:20px 22px 22px}
.op-name{font-size:20px;font-weight:600;margin-bottom:4px}
.op-tagline{font-size:14px;color:#d4f74b;margin-bottom:10px}
.op-desc{font-size:14px;color:rgba(255,255,255,.65);line-height:1.6;margin-bottom:12px}
.op-feat{list-style:none;padding:0;margin:0 0 16px;display:flex;flex-direction:column;gap:6px}
.op-feat li{font-size:13px;color:rgba(255,255,255,.75);padding-left:18px;position:relative}
.op-feat li:before{content:"✓";position:absolute;left:0;color:#d4f74b}
.op-links{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.op-btn{padding:10px 18px!important;font-size:14px!important;text-decoration:none;background:#fff!important;color:#111!important}
.op-btn2{display:inline-block;padding:9px 16px;border-radius:100px;border:1px solid rgba(255,255,255,.22);color:#fff;background:none;text-decoration:none;font:600 13px 'DM Sans',sans-serif;cursor:pointer}
.op-btn2:hover{border-color:#fff}
.op-toggle{display:block;background:none;border:none;color:rgba(255,255,255,.6);font:600 13px 'DM Sans',sans-serif;cursor:pointer;padding:8px 0 0}
.op-free{margin-top:12px;font-size:14px;color:#d4f74b}
.op-plans{display:grid;gap:10px;margin-top:12px}
.op-plan{border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:14px 16px;background:#1f1f26}
.op-plan.hot{border-color:#d4f74b}
.op-plan-name{font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px}
.op-pop{background:#d4f74b;color:#111;border-radius:100px;padding:2px 8px;font-size:10px}
.op-plan-price{font-size:24px;font-weight:300;margin:4px 0 6px}
.op-plan-price span{font-size:12px;color:rgba(255,255,255,.5)}
.op-plan ul{list-style:none;padding:0;margin:0 0 10px}
.op-plan li{font-size:12.5px;color:rgba(255,255,255,.7);padding:2px 0}
.op-sub{display:inline-block;background:#d4f74b;color:#111;border:none;border-radius:100px;padding:8px 16px;font:700 13px 'DM Sans',sans-serif;text-decoration:none;cursor:pointer}
@media(max-width:640px){.op-section{padding:72px 16px}}
`;
