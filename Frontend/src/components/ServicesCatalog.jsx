/* Sector 1 — Client Services: categories → subcategories → showcase templates + built-in packages.
   Data comes from GET /api/catalog (managed in Admin › Services & Packages). */
import { useState } from "react";
import { money } from "../utils/format";

const ACCENT = "#5c4ef8";

export default function ServicesCatalog({ catalog, onOrder }) {
  const { categories = [], templates = [], packages = [], maintenancePlans = [] } = catalog || {};
  const mains = categories.filter((c) => !c.parent);
  const [mainId, setMainId] = useState(() => String(mains[0]?._id || ""));
  const [subId, setSubId] = useState("all");

  const activeMain = mains.find((m) => String(m._id) === mainId) || mains[0];
  const subs = categories.filter((c) => activeMain && String(c.parent) === String(activeMain._id));
  const scope = !activeMain ? new Set()
    : subId !== "all" ? new Set([subId])
    : new Set([String(activeMain._id), ...subs.map((s) => String(s._id))]);

  const shownTemplates = templates.filter((t) => scope.has(String(t.category)));
  const shownPackages = packages.filter((p) => scope.has(String(p.category)));
  const planById = Object.fromEntries(maintenancePlans.map((m) => [String(m._id), m]));
  const catName = (id) => categories.find((c) => String(c._id) === String(id))?.name || "";

  if (!mains.length) return null;

  return (
    <section id="solutions" className="sc-section" aria-labelledby="solutions-title">
      <style>{CSS}</style>
      <div className="sc-wrap">
        <div className="sc-head">
          <div className="sc-eyebrow">✦ Digital Solutions</div>
          <h2 id="solutions-title" className="sc-title">Apps, web apps &amp; software — <em>built in, maintained monthly</em></h2>
          <p className="sc-sub">Pick a ready-made solution, we customise it to your business and keep it running with a monthly maintenance package.</p>
        </div>

        <div className="sc-tabs" role="tablist" aria-label="Service categories">
          {mains.map((m) => (
            <button key={m._id} role="tab" aria-selected={String(m._id) === String(activeMain?._id)}
              className={`sc-tab ${String(m._id) === String(activeMain?._id) ? "on" : ""}`}
              onClick={() => { setMainId(String(m._id)); setSubId("all"); }}>
              <span aria-hidden="true">{m.icon}</span> {m.name}
            </button>
          ))}
        </div>

        {activeMain?.description && <p className="sc-desc">{activeMain.description}</p>}

        {subs.length > 0 && (
          <div className="sc-chips" aria-label="Subcategories">
            <button className={`sc-chip ${subId === "all" ? "on" : ""}`} onClick={() => setSubId("all")}>All</button>
            {subs.map((s) => (
              <button key={s._id} className={`sc-chip ${subId === String(s._id) ? "on" : ""}`} onClick={() => setSubId(String(s._id))}>{s.name}</button>
            ))}
          </div>
        )}

        {shownPackages.length > 0 && (
          <>
            <h3 className="sc-h3">Built-in packages</h3>
            <div className="sc-grid sc-packages">
              {shownPackages.map((p) => {
                const plan = p.maintenancePlan && planById[String(p.maintenancePlan)];
                return (
                  <article key={p._id} className={`sc-pkg ${p.highlighted ? "hot" : ""}`}>
                    {p.highlighted && <div className="sc-badge">Most popular</div>}
                    <div className="sc-cat">{catName(p.category)}</div>
                    <h4 className="sc-name">{p.name}</h4>
                    {p.description && <p className="sc-text">{p.description}</p>}
                    <div className="sc-price">
                      <span className="sc-amt">{money(p.setupPrice, p.currency)}</span><span className="sc-per"> setup</span>
                      <div className="sc-monthly">+ {money(p.monthlyFee, p.currency)}<span> / month maintenance</span></div>
                    </div>
                    {p.deliveryTime && <div className="sc-meta">⏱ Delivery: {p.deliveryTime}</div>}
                    {plan && <div className="sc-meta">🛡 Includes {plan.name}</div>}
                    <ul className="sc-list">{p.features?.map((f) => <li key={f}>{f}</li>)}</ul>
                    <button className={p.highlighted ? "btn-lime" : "btn-dark"} style={{ width: "100%", padding: 13, fontSize: 15 }}
                      onClick={() => onOrder(`Package: ${p.name} (${catName(p.category)})`)}>
                      Choose this package →
                    </button>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {shownTemplates.length > 0 && (
          <>
            <h3 className="sc-h3">Showcase templates</h3>
            <div className="sc-grid">
              {shownTemplates.map((t) => (
                <article key={t._id} className="sc-tpl card-hover">
                  <div className="sc-img">
                    {t.imageUrl
                      ? <img src={t.imageUrl} alt={`${t.title} template preview`} loading="lazy" decoding="async" width="640" height="400" />
                      : <span aria-hidden="true">{activeMain?.icon || "🧩"}</span>}
                  </div>
                  <div className="sc-body">
                    <div className="sc-cat">{catName(t.category)}</div>
                    <h4 className="sc-name">{t.title}</h4>
                    {t.description && <p className="sc-text">{t.description}</p>}
                    {t.features?.length > 0 && <ul className="sc-list small">{t.features.slice(0, 4).map((f) => <li key={f}>{f}</li>)}</ul>}
                    <div className="sc-actions">
                      <button className="btn-dark" style={{ padding: "10px 18px", fontSize: 14 }} onClick={() => onOrder(`Template: ${t.title} (${catName(t.category)})`)}>Customise for me</button>
                      {t.demoUrl && <a className="sc-link" href={t.demoUrl} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {shownPackages.length === 0 && shownTemplates.length === 0 && (
          <div className="sc-empty">
            Packages for this category are being prepared.{" "}
            <button className="sc-linkbtn" onClick={() => onOrder(`Enquiry: ${activeMain?.name}`)}>Tell us what you need</button> and we'll send a quote.
          </div>
        )}

        {maintenancePlans.length > 0 && (
          <div className="sc-maint">
            <h3 className="sc-h3" style={{ marginTop: 0 }}>Monthly maintenance plans</h3>
            <div className="sc-grid">
              {maintenancePlans.map((m) => (
                <div key={m._id} className="sc-mplan">
                  <div className="sc-name">{m.name}</div>
                  <div className="sc-amt small">{money(m.monthlyFee, m.currency)}<span className="sc-per"> / month</span></div>
                  {m.description && <p className="sc-text">{m.description}</p>}
                  <ul className="sc-list small">{m.features?.map((f) => <li key={f}>{f}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const CSS = `
.sc-section{padding:100px 24px;background:#fff}
.sc-wrap{max-width:1140px;margin:0 auto}
.sc-head{text-align:center;margin-bottom:40px}
.sc-eyebrow{font-size:13px;color:${ACCENT};font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:12px}
.sc-title{font-size:clamp(32px,4vw,54px);font-weight:300;letter-spacing:-1.5px;color:#0e0e0e;line-height:1.1;max-width:860px;margin:0 auto 16px}
.sc-title em{font-style:italic}
.sc-sub{font-size:16px;color:#777;max-width:600px;margin:0 auto;line-height:1.6}
.sc-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:18px}
.sc-tab{border:1.5px solid #e6e6e6;background:#fafafa;border-radius:100px;padding:11px 22px;font:600 15px 'DM Sans',sans-serif;color:#333;cursor:pointer;transition:all .2s}
.sc-tab:hover{border-color:${ACCENT}}
.sc-tab.on{background:#1a1a1a;color:#fff;border-color:#1a1a1a}
.sc-desc{text-align:center;color:#666;font-size:15px;max-width:640px;margin:0 auto 18px;line-height:1.6}
.sc-chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:36px}
.sc-chip{border:none;background:#f0eeff;color:${ACCENT};border-radius:100px;padding:7px 16px;font:600 13px 'DM Sans',sans-serif;cursor:pointer}
.sc-chip.on{background:${ACCENT};color:#fff}
.sc-h3{font-size:22px;font-weight:500;color:#0e0e0e;margin:36px 0 18px;letter-spacing:-.5px}
.sc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px}
.sc-pkg{position:relative;background:#f7f7f7;border:1.5px solid #eee;border-radius:24px;padding:28px 24px;display:flex;flex-direction:column}
.sc-pkg.hot{background:#1a1a1a;border-color:#1a1a1a;color:#fff}
.sc-pkg.hot .sc-name,.sc-pkg.hot .sc-amt{color:#fff}
.sc-pkg.hot .sc-text,.sc-pkg.hot .sc-list li,.sc-pkg.hot .sc-meta,.sc-pkg.hot .sc-per,.sc-pkg.hot .sc-monthly span{color:rgba(255,255,255,.7)}
.sc-pkg.hot .sc-monthly{color:#d4f74b}
.sc-badge{position:absolute;top:18px;right:18px;background:#d4f74b;color:#1a1a1a;border-radius:100px;padding:4px 12px;font-size:11px;font-weight:700}
.sc-cat{font-size:11px;font-weight:700;color:${ACCENT};text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.sc-pkg.hot .sc-cat{color:#b9b2ff}
.sc-name{font-size:18px;font-weight:600;color:#0e0e0e;margin-bottom:6px}
.sc-text{font-size:14px;color:#666;line-height:1.55;margin-bottom:12px}
.sc-price{margin:6px 0 12px}
.sc-amt{font-size:38px;font-weight:300;letter-spacing:-1.5px;color:#0e0e0e}
.sc-amt.small{font-size:28px;display:block;margin-bottom:8px}
.sc-per{font-size:13px;color:#999;letter-spacing:0}
.sc-monthly{font-size:16px;font-weight:600;color:${ACCENT};margin-top:4px}
.sc-monthly span{font-weight:400;font-size:13px;color:#888}
.sc-meta{font-size:13px;color:#666;margin-bottom:6px}
.sc-list{list-style:none;padding:0;margin:10px 0 22px;display:flex;flex-direction:column;gap:9px;flex:1}
.sc-list li{font-size:14px;color:#555;padding-left:20px;position:relative;line-height:1.4}
.sc-list li:before{content:"✓";position:absolute;left:0;color:${ACCENT};font-size:13px}
.sc-pkg.hot .sc-list li:before{color:#d4f74b}
.sc-list.small{margin:6px 0 14px;gap:6px}
.sc-list.small li{font-size:13px}
.sc-tpl{background:#fff;border:1px solid #eee;border-radius:22px;overflow:hidden;display:flex;flex-direction:column}
.sc-img{aspect-ratio:16/10;background:linear-gradient(135deg,#f0eeff,#e8f0ff);display:flex;align-items:center;justify-content:center;font-size:42px;overflow:hidden}
.sc-img img{width:100%;height:100%;object-fit:cover;display:block}
.sc-body{padding:18px 20px 20px;display:flex;flex-direction:column;flex:1}
.sc-actions{display:flex;align-items:center;gap:14px;margin-top:auto;flex-wrap:wrap}
.sc-link{font-size:14px;font-weight:600;color:${ACCENT};text-decoration:none}
.sc-empty{text-align:center;background:#f0eeff;border-radius:20px;padding:24px;color:#555;font-size:15px;margin-top:12px}
.sc-linkbtn{background:none;border:none;color:${ACCENT};font:600 15px 'DM Sans',sans-serif;cursor:pointer;padding:0}
.sc-maint{margin-top:48px;background:#f9f9fb;border-radius:28px;padding:32px 28px}
.sc-mplan{background:#fff;border:1px solid #eee;border-radius:18px;padding:20px}
@media(max-width:640px){.sc-section{padding:72px 16px}.sc-maint{padding:24px 16px}.sc-tab{padding:9px 16px;font-size:14px}}
`;
