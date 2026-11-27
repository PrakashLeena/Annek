/* Admin › Own Products — Annek's own apps/web apps/software, install links and subscription tiers. */
import { useEffect, useState } from "react";
import { adminFetch } from "../utils/adminApi";
import { Btn, Card, EntityForm, HiddenBadge, Notice } from "./ui";
import { C, inp, money, payload } from "./helpers";

const FIELDS = [
  { key: "name", label: "Product name", required: true, placeholder: "Annek POS" },
  { key: "type", label: "Type", type: "select", default: "web", options: [["web", "Web application"], ["mobile", "Mobile application"], ["software", "Software"]] },
  { key: "status", label: "Status", type: "select", default: "live", options: [["live", "Live"], ["beta", "Beta"], ["coming-soon", "Coming soon"]] },
  { key: "order", label: "Sort order", type: "number" },
  { key: "tagline", label: "Tagline", wide: true, placeholder: "Billing and stock for small shops" },
  { key: "description", label: "Description", type: "textarea", rows: 3 },
  { key: "features", label: "Key features (one per line)", type: "list", rows: 4 },
  { key: "links.web", label: "Open in browser URL", type: "url", placeholder: "https://app.annek.tech" },
  { key: "links.android", label: "Android (Play Store / APK) URL", type: "url" },
  { key: "links.ios", label: "iOS App Store URL", type: "url" },
  { key: "links.windows", label: "Windows download URL", type: "url" },
  { key: "links.mac", label: "macOS download URL", type: "url" },
  { key: "image", label: "Product image / screenshot", type: "image", hint: "PNG/JPG/WebP up to 4 MB" },
  { key: "visible", label: "Visible on site", type: "checkbox", default: true },
];

const emptyPlan = () => ({ name: "", price: 0, currency: "USD", interval: "month", features: [], highlighted: false, checkoutUrl: "" });

function PlansEditor({ plans, setPlans }) {
  const update = (i, patch) => setPlans((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <div style={{ marginTop: 18, borderTop: "1.5px solid #FDE3D0", paddingTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <strong style={{ fontSize: 14 }}>Subscription plans</strong>
        <Btn kind="soft" onClick={() => setPlans((ps) => [...ps, emptyPlan()])} disabled={plans.length >= 12}>+ Plan</Btn>
      </div>
      {plans.length === 0 && <p style={{ fontSize: 13, color: C.muted }}>No plans. The product shows as free / open access.</p>}
      {plans.map((p, i) => (
        <div key={p._id || i} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", gap: 8 }} className="plan-grid">
            <input aria-label="Plan name" style={inp} placeholder="Plan name *" value={p.name} onChange={(e) => update(i, { name: e.target.value })} required />
            <input aria-label="Price" style={inp} type="number" min="0" step="any" value={p.price} onChange={(e) => update(i, { price: e.target.value })} />
            <select aria-label="Currency" style={inp} value={p.currency} onChange={(e) => update(i, { currency: e.target.value })}>
              {["USD", "LKR", "EUR", "GBP"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select aria-label="Billing" style={inp} value={p.interval} onChange={(e) => update(i, { interval: e.target.value })}>
              <option value="free">Free</option><option value="month">per month</option><option value="year">per year</option><option value="one-time">one time</option>
            </select>
          </div>
          <textarea aria-label="Plan features" rows={3} style={{ ...inp, marginTop: 8, resize: "vertical" }} placeholder="Features (one per line)"
            value={Array.isArray(p.features) ? p.features.join("\n") : p.features}
            onChange={(e) => update(i, { features: e.target.value.split("\n") })} />
          <input aria-label="Checkout URL" style={{ ...inp, marginTop: 8 }} type="url" placeholder="Subscribe / checkout URL (optional)" value={p.checkoutUrl || ""} onChange={(e) => update(i, { checkoutUrl: e.target.value })} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" checked={!!p.highlighted} onChange={(e) => update(i, { highlighted: e.target.checked })} style={{ accentColor: C.accent }} /> Most popular
            </label>
            <Btn kind="danger" onClick={() => setPlans((ps) => ps.filter((_, j) => j !== i))}>Remove plan</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductEditor({ doc, onSaved, onCancel }) {
  const [plans, setPlans] = useState(() => (doc?.plans || []).map((p) => ({ ...emptyPlan(), ...p })));
  const save = async (body, file) => {
    body.plans = plans.map((p) => ({
      ...p,
      price: Number(p.price) || 0,
      features: (Array.isArray(p.features) ? p.features : String(p.features).split("\n")).map((s) => s.trim()).filter(Boolean),
    }));
    await adminFetch(doc ? `/products/${doc._id}` : "/products", { method: doc ? "PUT" : "POST", body: payload(body, file) });
    onSaved(doc ? "Saved." : "Product added.");
  };
  return (
    <EntityForm title={doc ? `Edit ${doc.name}` : "New product"} fields={FIELDS} initial={doc || {}} onSave={save} onCancel={onCancel}>
      {() => <PlansEditor plans={plans} setPlans={setPlans} />}
    </EntityForm>
  );
}

const TYPE_LABEL = { web: "🌐 Web app", mobile: "📱 Mobile app", software: "💻 Software" };
const INTERVAL = { free: "", month: "/mo", year: "/yr", "one-time": " once" };

export default function ProductsTab() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, doc = edit
  const [notice, setNotice] = useState(null);

  const load = async () => {
    try { setItems(await adminFetch("/products/admin")); }
    catch (err) { setNotice({ type: "error", message: err.message }); setItems([]); }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const saved = async (message) => { setEditing(undefined); await load(); setNotice({ type: "success", message }); setTimeout(() => setNotice(null), 2500); };
  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}" and its subscription plans? This cannot be undone.`)) return;
    try { await adminFetch(`/products/${p._id}`, { method: "DELETE" }); await saved("Deleted."); }
    catch (err) { setNotice({ type: "error", message: err.message }); }
  };

  if (!items) return <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Loading products…</div>;

  return (
    <div>
      <style>{`@media (max-width: 640px) { .plan-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Own Products <span style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}>({items.length})</span></h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Apps and software built and run by Annek, with install links and subscription tiers.</p>
        </div>
        <Btn onClick={() => setEditing(null)}>+ Add product</Btn>
      </div>
      <Notice notice={notice} />
      {editing !== undefined && (
        <ProductEditor key={editing?._id || "new"} doc={editing} onSaved={saved} onCancel={() => setEditing(undefined)} />
      )}
      {items.length === 0 && editing === undefined && <p style={{ color: "#aaa", textAlign: "center", padding: 30 }}>No products yet.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {items.map((p) => (
          <Card key={p._id} hidden={!p.visible} style={{ padding: 0, overflow: "hidden" }}>
            {p.imageUrl
              ? <img src={p.imageUrl} alt="" loading="lazy" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
              : <div style={{ height: 140, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📦</div>}
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{TYPE_LABEL[p.type]} · {p.status}</div>
              <div style={{ fontSize: 16, fontWeight: 700, margin: "2px 0 4px" }}>{p.name} {!p.visible && <HiddenBadge />}</div>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{p.tagline}</p>
              <div style={{ fontSize: 13, color: "#444", marginBottom: 10 }}>
                {p.plans?.length ? p.plans.map((pl) => `${pl.name}: ${pl.interval === "free" ? "Free" : money(pl.price, pl.currency) + INTERVAL[pl.interval]}`).join(" · ") : "No plans"}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn kind="soft" style={{ flex: 1 }} onClick={() => setEditing(p)}>Edit</Btn>
                <Btn kind="danger" style={{ flex: 1 }} onClick={() => remove(p)}>Delete</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
