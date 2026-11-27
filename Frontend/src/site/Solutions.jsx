/* Sector 1 — Client solutions. Data from GET /api/catalog (Admin › Services & packages).
   Until the admin adds packages, the three core services are shown with a quote button. */
import { useState } from "react";
import { money } from "../utils/format";
import { IconPhone, IconGlobe, IconCode } from "./icons";

const CORE = [
  { icon: IconPhone, title: "Mobile Applications", text: "Ecommerce, marketing and business apps for Android and iPhone, built from proven templates and customised for you." },
  { icon: IconGlobe, title: "Web Applications", text: "Ecommerce, portfolio, institute and industry platforms that run in any browser, with an admin panel you control." },
  { icon: IconCode, title: "Custom Software", text: "Software shaped around how your business works: billing, stock, records and automation." },
];

function Package({ p, catName, plan, onOrder }) {
  return (
    <article className={`card pkg ${p.highlighted ? "hot" : ""}`}>
      <div className="pkg-top"><span className="cat">{catName(p.category)}</span>{p.highlighted && <span className="badge">Most popular</span>}</div>
      <h3>{p.name}</h3>
      {p.description && <p>{p.description}</p>}
      <div className="price">{money(p.setupPrice, p.currency)}<small> setup</small></div>
      <div className="monthly">+ {money(p.monthlyFee, p.currency)} / month maintenance</div>
      {(p.deliveryTime || plan) && <div className="meta">{[p.deliveryTime && `Delivery: ${p.deliveryTime}`, plan && `Includes ${plan.name}`].filter(Boolean).join(" · ")}</div>}
      <div className="rule" />
      <ul className="ticks">{p.features?.map((f) => <li key={f}>{f}</li>)}</ul>
      <button type="button" className={`btn btn-block ${p.highlighted ? "btn-orange" : "btn-line"}`} onClick={() => onOrder(`${p.name} (${catName(p.category)})`)}>Choose package</button>
    </article>
  );
}

export default function Solutions({ catalog, onOrder }) {
  const { categories = [], templates = [], packages = [], maintenancePlans = [] } = catalog || {};
  const mains = categories.filter((c) => !c.parent);
  const [mainId, setMainId] = useState("");
  const [subId, setSubId] = useState("all");

  const head = (
    <div className="head-row reveal">
      <div style={{ maxWidth: 640 }}>
        <div className="eyebrow">Client solutions</div>
        <h2 className="h2" id="solutions-title">Built in packages with monthly maintenance</h2>
      </div>
      <p className="lead">Every package is a proven template customised for your business, plus a monthly fee that covers hosting, updates and support.</p>
    </div>
  );

  if (!mains.length) {
    return (
      <section id="solutions" className="section" aria-labelledby="solutions-title">
        <div className="wrap">
          {head}
          <div className="grid-3">
            {CORE.map(({ icon: Icon, title, text }) => (
              <article key={title} className="card service-card reveal">
                <span className="service-icon"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <button type="button" className="btn btn-line" onClick={() => onOrder(`Enquiry: ${title}`)}>Get a quote</button>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const active = mains.find((m) => String(m._id) === mainId) || mains[0];
  const subs = categories.filter((c) => String(c.parent) === String(active._id));
  const scope = subId !== "all" ? new Set([subId]) : new Set([String(active._id), ...subs.map((s) => String(s._id))]);
  const shownPackages = packages.filter((p) => scope.has(String(p.category)));
  const shownTemplates = templates.filter((t) => scope.has(String(t.category)));
  const catName = (id) => categories.find((c) => String(c._id) === String(id))?.name || "";
  const planById = Object.fromEntries(maintenancePlans.map((m) => [String(m._id), m]));

  return (
    <section id="solutions" className="section" aria-labelledby="solutions-title">
      <div className="wrap">
        {head}
        <div className="tabs" role="tablist" aria-label="Service categories">
          {mains.map((m) => (
            <button key={m._id} type="button" role="tab" className="tab" aria-selected={String(m._id) === String(active._id)}
              onClick={() => { setMainId(String(m._id)); setSubId("all"); }}>{m.name}</button>
          ))}
        </div>
        {active.description && <p className="tab-desc">{active.description}</p>}
        {subs.length > 0 && (
          <div className="chips" role="group" aria-label="Subcategories">
            <button type="button" className="chip" aria-pressed={subId === "all"} onClick={() => setSubId("all")}>All</button>
            {subs.map((s) => (
              <button key={s._id} type="button" className="chip" aria-pressed={subId === String(s._id)} onClick={() => setSubId(String(s._id))}>{s.name}</button>
            ))}
          </div>
        )}

        {shownPackages.length > 0 && (
          <div className="grid-3">
            {shownPackages.map((p) => <Package key={p._id} p={p} catName={catName} plan={p.maintenancePlan && planById[String(p.maintenancePlan)]} onOrder={onOrder} />)}
          </div>
        )}

        {shownTemplates.length > 0 && (
          <>
            <h3 className="sub-h">Showcase templates</h3>
            <div className="grid-3">
              {shownTemplates.map((t) => (
                <article key={t._id} className="card tpl">
                  <div className="tpl-img">
                    {t.imageUrl ? <img src={t.imageUrl} alt={`${t.title} preview`} loading="lazy" decoding="async" width="640" height="400" /> : <IconGlobe size={36} />}
                  </div>
                  <div className="tpl-body">
                    <span className="cat">{catName(t.category)}</span>
                    <h3>{t.title}</h3>
                    {t.description && <p>{t.description}</p>}
                    <div className="tpl-actions">
                      <button type="button" className="btn btn-ink btn-sm" onClick={() => onOrder(`Template: ${t.title}`)}>Customise for me</button>
                      {t.demoUrl && <a href={t.demoUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 14 }}>Live demo ↗</a>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {!shownPackages.length && !shownTemplates.length && (
          <p className="tab-desc">Packages for this category are being prepared. <button type="button" className="link-btn" onClick={() => onOrder(`Enquiry: ${active.name}`)}>Tell us what you need</button> and we'll send a quote.</p>
        )}

        {maintenancePlans.length > 0 && (
          <div className="maint">
            <h3 className="sub-h" style={{ marginTop: 0 }}>Monthly maintenance plans</h3>
            <div className="grid-3">
              {maintenancePlans.map((m) => (
                <div key={m._id} className="card">
                  <h4>{m.name}</h4>
                  <div className="price">{money(m.monthlyFee, m.currency)}<small> / month</small></div>
                  {m.description && <p className="lead" style={{ fontSize: 14, marginBottom: 10 }}>{m.description}</p>}
                  <ul className="ticks" style={{ fontSize: 14 }}>{m.features?.map((f) => <li key={f}>{f}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
