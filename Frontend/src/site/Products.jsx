/* Sector 2 — Annek's own products. Data from GET /api/products (Admin › Own products). */
import { useState } from "react";
import { money } from "../utils/format";
import { IconPhone, IconGlobe, IconCode } from "./icons";

const TYPE = { web: ["Web app", IconGlobe], mobile: ["Mobile app", IconPhone], software: ["Software", IconCode] };
const STATUS = { live: ["Live", "live"], beta: ["Beta", "soon"], "coming-soon": ["Coming soon", "soon"] };
const INTERVAL = { month: "/ month", year: "/ year", "one-time": "one time", free: "" };
const LINKS = [["web", "Open web app"], ["android", "Android"], ["ios", "iPhone"], ["windows", "Windows"], ["mac", "macOS"]];

export default function Products({ products, onOrder }) {
  const [open, setOpen] = useState(null);
  if (!products?.length) return null;

  return (
    <section id="products" className="section" aria-labelledby="products-title">
      <div className="wrap">
        <div className="eyebrow reveal">Our products</div>
        <h2 className="h2 reveal" id="products-title" style={{ marginBottom: 40 }}>Apps &amp; software made by Annek</h2>
        <div className="grid-2">
          {products.map((p) => {
            const [typeLabel, Icon] = TYPE[p.type] || TYPE.web;
            const [statusLabel, statusClass] = STATUS[p.status] || STATUS.live;
            const links = LINKS.filter(([k]) => p.links?.[k]);
            const soon = p.status === "coming-soon";
            const expanded = open === p._id;
            return (
              <article key={p._id} className="card prod reveal">
                <div className="prod-icon">{p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" decoding="async" width="264" height="264" /> : <Icon size={40} />}</div>
                <div className="prod-body">
                  <div className="prod-tags"><span className="tag">{typeLabel}</span><span className={`tag ${statusClass}`}>{statusLabel}</span></div>
                  <h3>{p.name}</h3>
                  {p.tagline && <p style={{ color: "var(--ink-2)", fontWeight: 500 }}>{p.tagline}</p>}
                  {p.description && <p>{p.description}</p>}
                  <div className="prod-links">
                    {soon
                      ? <button type="button" className="btn btn-line btn-sm" onClick={() => onOrder(`Notify me: ${p.name}`)}>Notify me at launch</button>
                      : links.map(([k, label], i) => (
                        <a key={k} href={p.links[k]} target="_blank" rel="noopener noreferrer" className={`btn btn-sm ${i === 0 ? "btn-ink" : "btn-soft"}`}>{label}</a>
                      ))}
                    {p.plans?.length > 0 && (
                      <button type="button" className="link-btn" style={{ fontSize: 14, padding: "10px 4px" }} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : p._id)}>
                        {expanded ? "Hide plans" : "Plans"} →
                      </button>
                    )}
                  </div>
                  {expanded && (
                    <div className="plans">
                      {p.plans.map((pl) => (
                        <div key={pl._id || pl.name} className={`plan ${pl.highlighted ? "hot" : ""}`}>
                          <b>{pl.name}</b>
                          <div className="price">{pl.interval === "free" || !pl.price ? "Free" : money(pl.price, pl.currency)}<small> {pl.interval !== "free" && pl.price > 0 ? INTERVAL[pl.interval] : ""}</small></div>
                          {pl.features?.length > 0 && <ul>{pl.features.map((f) => <li key={f}>{f}</li>)}</ul>}
                          {pl.checkoutUrl
                            ? <a className="btn btn-orange btn-sm" href={pl.checkoutUrl} target="_blank" rel="noopener noreferrer">Subscribe</a>
                            : <button type="button" className="btn btn-orange btn-sm" onClick={() => onOrder(`Subscription: ${p.name} (${pl.name})`)}>Subscribe</button>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
