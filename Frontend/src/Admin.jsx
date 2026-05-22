import { useState, useEffect } from "react";
import { auth, signInWithGoogle, logOut, onAuthStateChanged } from "./firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

const STATUS_COLORS = {
  pending:     { bg: "#fff3e8", color: "#c05621" },
  "in-review": { bg: "#e8f0ff", color: "#3451b2" },
  "in-progress":{ bg: "#e8f5f0", color: "#276749" },
  completed:   { bg: "#f0fdf4", color: "#166534" },
  cancelled:   { bg: "#fef2f2", color: "#991b1b" },
};

function Badge({ status }) {
  const s = STATUS_COLORS[status] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

/* ─── Orders Tab ─── */
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/orders`);
      setOrders(await r.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`${API}/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setOrders(o => o.map(x => x._id === id ? { ...x, status } : x));
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    await fetch(`${API}/orders/${id}`, { method: "DELETE" });
    setOrders(o => o.filter(x => x._id !== id));
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const Field = ({ label, value }) => value ? (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#5c4ef8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>{value}</div>
    </div>
  ) : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0e0e0e" }}>Customer Orders <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>({orders.length})</span></h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", "pending", "in-review", "in-progress", "completed", "cancelled"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: filter === f ? "#5c4ef8" : "#f3f4f6", color: filter === f ? "#fff" : "#555", border: "none", transition: "all 0.2s",
            }}>{f === "all" ? "All" : f}</button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Loading orders…</div> :
        filtered.length === 0 ? <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>No orders found.</div> :
        filtered.map(order => (
          <div key={order._id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, marginBottom: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer", flexWrap: "wrap" }}
              onClick={() => setExpanded(expanded === order._id ? null : order._id)}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0e0e0e" }}>{order.name}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{order.email} {order.company ? `· ${order.company}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Badge status={order.status} />
                <select value={order.status} onClick={e => e.stopPropagation()}
                  onChange={e => updateStatus(order._id, e.target.value)}
                  style={{ fontSize: 13, padding: "4px 10px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fafafa", cursor: "pointer", fontFamily: "inherit" }}>
                  {["pending","in-review","in-progress","completed","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 12, color: "#bbb" }}>{new Date(order.createdAt).toLocaleDateString()}</div>
              <button onClick={e => { e.stopPropagation(); deleteOrder(order._id); }}
                style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                🗑 Delete
              </button>
              <span style={{ fontSize: 18, color: "#bbb" }}>{expanded === order._id ? "▲" : "▼"}</span>
            </div>

            {/* Expanded details */}
            {expanded === order._id && (
              <div style={{ borderTop: "1px solid #f0f0f0", padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
                <Field label="Pages Needed" value={[...(order.pages||[]), order.otherPages].filter(Boolean).join(", ")} />
                <Field label="Design Colour" value={order.colour} />
                <Field label="Design Style" value={order.designStyle?.join(", ")} />
                <Field label="Theme" value={order.theme?.join(", ")} />
                <Field label="Fonts" value={order.fonts} />
                <Field label="Liked Sites" value={order.likedSites} />
                <Field label="Features" value={[...(order.features||[]), order.otherFeatures].filter(Boolean).join(", ")} />
                <Field label="Domain Purchase" value={order.buyDomain === true ? "Yes" : order.buyDomain === false ? "No (Free)" : null} />
                <Field label="Has Domain" value={order.hasDomain === true ? "Yes" : order.hasDomain === false ? "No" : null} />
                <Field label="Timeline" value={order.timeline} />
                <Field label="Maintenance" value={order.maintenance?.join(", ")} />
                <Field label="Text Content" value={order.textContent} />
                <Field label="Product Details" value={order.productDetails} />
                <Field label="Social Links" value={order.socialLinks} />
                <Field label="Contact Info" value={order.contactInfo} />
                {order.logoUrl && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#5c4ef8", textTransform: "uppercase", marginBottom: 6 }}>Logo</div><a href={order.logoUrl} target="_blank" rel="noreferrer" style={{ color: "#5c4ef8", fontSize: 13 }}>View Logo ↗</a></div>}
                {order.imageUrls?.length > 0 && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#5c4ef8", textTransform: "uppercase", marginBottom: 6 }}>Images</div>{order.imageUrls.map((u,i) => <a key={i} href={u} target="_blank" rel="noreferrer" style={{ display: "block", color: "#5c4ef8", fontSize: 13 }}>Image {i+1} ↗</a>)}</div>}
                {order.videoUrls?.length > 0 && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#5c4ef8", textTransform: "uppercase", marginBottom: 6 }}>Videos</div>{order.videoUrls.map((u,i) => <a key={i} href={u} target="_blank" rel="noreferrer" style={{ display: "block", color: "#5c4ef8", fontSize: 13 }}>Video {i+1} ↗</a>)}</div>}
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
}

/* ─── Portfolio Tab ─── */
function PortfolioTab() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", category: "", desc: "", accent: "#5c4ef8", tags: "", visible: true });
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const r = await fetch(`${API}/portfolio`);
      setItems(await r.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPortfolio();
  }, []);

  const openNew = () => { setForm({ title:"", category:"", desc:"", accent:"#5c4ef8", tags:"", visible:true }); setImgFile(null); setEditing(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ title:item.title, category:item.category, desc:item.desc, accent:item.accent, tags:item.tags?.join(", ")||"", visible:item.visible });
    setImgFile(null); setEditing(item._id); setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("data", JSON.stringify({ ...form, tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean) }));
    if (imgFile) fd.append("image", imgFile);
    const url = editing ? `${API}/portfolio/${editing}` : `${API}/portfolio`;
    const method = editing ? "PUT" : "POST";
    try {
      const r = await fetch(url, { method, body: fd });
      const item = await r.json();
      if (editing) setItems(it => it.map(x => x._id === editing ? item : x));
      else setItems(it => [item, ...it]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this portfolio item?")) return;
    await fetch(`${API}/portfolio/${id}`, { method: "DELETE" });
    setItems(it => it.filter(x => x._id !== id));
  };

  const inpStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e5e5", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", background: "#fafafa" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0e0e0e" }}>Portfolio <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>({items.length} projects)</span></h2>
        <button onClick={openNew} style={{ background: "#5c4ef8", color: "#fff", border: "none", borderRadius: 12, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Add Project</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "#f8f7ff", border: "1.5px solid #e0dcff", borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0e0e0e" }}>{editing ? "Edit Project" : "New Project"}</h3>
          <div className="admin-form-grid">
            {[["title","Title *"],["category","Category *"],["desc","Description"],["tags","Tags (comma-separated)"]].map(([k,l]) => (
              <div key={k} style={{ gridColumn: k === "desc" || k === "tags" ? "1/-1" : "auto" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5, display: "block" }}>{l}</label>
                {k === "desc" ? <textarea style={{ ...inpStyle, minHeight: 72, resize: "vertical" }} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} /> : <input style={inpStyle} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} />}
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5, display: "block" }}>Accent Colour</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="color" value={form.accent} onChange={e => setForm(f=>({...f,accent:e.target.value}))} style={{ width: 44, height: 36, border: "none", borderRadius: 8, cursor: "pointer" }} />
                <span style={{ fontSize: 13, color: "#555" }}>{form.accent}</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5, display: "block" }}>Image</label>
              <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])} style={{ fontSize: 13 }} />
              {imgFile && <span style={{ fontSize: 12, color: "#5c4ef8" }}>{imgFile.name}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="vis" checked={form.visible} onChange={e => setForm(f=>({...f,visible:e.target.checked}))} style={{ accentColor: "#5c4ef8", width: 16, height: 16 }} />
              <label htmlFor="vis" style={{ fontSize: 14, color: "#333", cursor: "pointer" }}>Visible on site</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={save} disabled={saving} style={{ background: "#5c4ef8", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: saving?"not-allowed":"pointer", opacity: saving?0.7:1, fontFamily:"inherit" }}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create"}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", color: "#555", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily:"inherit" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
        {items.map(item => (
          <div key={item._id} style={{ background: "#fff", borderRadius: 16, border: `2px solid ${item.visible ? "#eee" : "#ffdede"}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: 140, objectFit: "cover" }} /> : <div style={{ height: 140, background: `${item.accent}22`, display:"flex",alignItems:"center",justifyContent:"center",fontSize:32 }}>🖼️</div>}
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.category}</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0e0e0e", marginTop: 2 }}>{item.title}</div>
                </div>
                {!item.visible && <span style={{ fontSize: 11, background: "#fef2f2", color: "#dc2626", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Hidden</span>}
              </div>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 12, lineHeight: 1.5 }}>{item.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                {item.tags?.map(t => <span key={t} style={{ background: "#f3f4f6", borderRadius: 100, padding: "2px 10px", fontSize: 11, color: "#555" }}>{t}</span>)}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(item)} style={{ flex: 1, background: "#f0eeff", color: "#5c4ef8", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily:"inherit" }}>✏️ Edit</button>
                <button onClick={() => remove(item._id)} style={{ flex: 1, background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily:"inherit" }}>🗑 Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now show the current Firebase signed-in user; full user list requires firebase-admin on backend
    const unsub = onAuthStateChanged(auth, u => {
      if (u) setUsers([{ name: u.displayName, email: u.email, photo: u.photoURL, uid: u.uid, role: "Admin" }]);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0e0e0e", marginBottom: 24 }}>Logged-in Users</h2>
      {loading ? <div style={{ color: "#aaa", textAlign: "center", padding: 40 }}>Loading…</div> :
        users.length === 0 ? <div style={{ color: "#aaa", textAlign: "center", padding: 40 }}>No users found.</div> :
        users.map(u => (
          <div key={u.uid} style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            {u.photo ? <img src={u.photo} alt="" style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #e0dcff" }} /> : <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e0dcff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0e0e0e" }}>{u.name}</div>
              <div style={{ fontSize: 13, color: "#888" }}>{u.email}</div>
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>UID: {u.uid}</div>
            </div>
            <span style={{ background: "#e0dcff", color: "#5c4ef8", padding: "4px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700 }}>{u.role}</span>
          </div>
        ))
      }
    </div>
  );
}

/* ─── Settings Tab ─── */
function SettingsTab() {
  const [settings, setSettings] = useState({ testimonialsTitle: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [pricingForm, setPricingForm] = useState({ name: "", priceMin: "", priceMax: "" });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/settings`);
      const data = await r.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to fetch settings." });
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const r = await fetch(`${API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (!r.ok) throw new Error("Failed to save settings");
      const data = await r.json();
      setSettings(data);
      setStatus({ type: "success", message: "Settings saved successfully!" });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to save settings." });
    }
    setSaving(false);
  };

  const savePricing = async () => {
    if (!pricingForm.name || !pricingForm.priceMin || !pricingForm.priceMax) {
      setStatus({ type: "error", message: "Please fill all pricing fields." });
      return;
    }
    setSaving(true);
    try {
      const key = `pricing_${pricingForm.name.toLowerCase().replace(/\s+/g, "_")}`;
      const payload = {
        [key]: JSON.stringify({
          name: pricingForm.name,
          priceMin: pricingForm.priceMin,
          priceMax: pricingForm.priceMax,
        })
      };
      const r = await fetch(`${API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error("Failed to save pricing");
      const updatedSettings = { ...settings, [key]: payload[key] };
      setSettings(updatedSettings);
      setStatus({ type: "success", message: `${pricingForm.name} pricing saved!` });
      setPricingForm({ name: "", priceMin: "", priceMax: "" });
      setShowPricingForm(false);
      setTimeout(() => setStatus(null), 3000);
    }
    setSaving(false);
  };

  const inpStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e5e5", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", background: "#fafafa" };

  // Parse existing pricing from settings
  const pricingPlans = [
    { name: "Starter", key: "pricing_starter", min: "$75", max: "$80" },
    { name: "Growth", key: "pricing_growth", min: "$100", max: "$120" },
    { name: "Premium", key: "pricing_premium", min: "$150", max: "$170" },
  ];

  return (
    <div style={{ maxWidth: 800 }}>
      {/* General Settings */}
      <div className="admin-settings-card" style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0e0e0e", marginBottom: 24 }}>Platform Settings</h2>
        {loading ? (
          <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>Loading settings…</div>
        ) : (
          <form onSubmit={saveSettings}>
            {status && (
              <div style={{
                padding: "12px 16px",
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 20,
                background: status.type === "success" ? "#e8f5f0" : "#fef2f2",
                color: status.type === "success" ? "#276749" : "#991b1b",
                border: `1.5px solid ${status.type === "success" ? "#a3e635" : "#fee2e2"}`
              }}>
                {status.type === "success" ? "✅ " : "❌ "}
                {status.message}
              </div>
            )}
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8, display: "block" }}>
                Testimonials Header Title
              </label>
              <input
                style={inpStyle}
                type="text"
                value={settings.testimonialsTitle || ""}
                onChange={e => setSettings(s => ({ ...s, testimonialsTitle: e.target.value }))}
                placeholder="e.g. Trusted by hundreds of businesses"
                required
              />
              <span style={{ fontSize: 12, color: "#888", marginTop: 6, display: "block" }}>
                This title will be displayed in the testimonials/reviews section on the landing page.
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: "#5c4ef8",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                fontFamily: "inherit",
                transition: "opacity 0.2s"
              }}
            >
              {saving ? "Saving…" : "Save General Settings"}
            </button>
          </form>
        )}
      </div>

      {/* Pricing Management */}
      <div className="admin-pricing-card" style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0e0e0e" }}>Pricing Plans</h2>
          <button onClick={() => setShowPricingForm(!showPricingForm)} style={{
            background: "#5c4ef8", color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
          }}>+ Add/Edit Plan</button>
        </div>

        {showPricingForm && (
          <div style={{ background: "#f8f7ff", border: "1.5px solid #e0dcff", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0e0e0e" }}>Add or Update Pricing Plan</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block" }}>Plan Name *</label>
                <input style={inpStyle} type="text" placeholder="e.g. Starter, Growth, Premium"
                  value={pricingForm.name} onChange={e => setPricingForm(p => ({...p, name: e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block" }}>Minimum Price *</label>
                <input style={inpStyle} type="text" placeholder="e.g. $75"
                  value={pricingForm.priceMin} onChange={e => setPricingForm(p => ({...p, priceMin: e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block" }}>Maximum Price *</label>
                <input style={inpStyle} type="text" placeholder="e.g. $80"
                  value={pricingForm.priceMax} onChange={e => setPricingForm(p => ({...p, priceMax: e.target.value}))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={savePricing} disabled={saving} style={{
                background: "#5c4ef8", color: "#fff", border: "none", borderRadius: 10,
                padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1, fontFamily: "inherit"
              }}>
                {saving ? "Saving…" : "Save Pricing"}
              </button>
              <button onClick={() => setShowPricingForm(false)} style={{
                background: "#f3f4f6", color: "#555", border: "none", borderRadius: 10,
                padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: "inherit"
              }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
          {pricingPlans.map((plan) => {
            const savedPrice = settings[plan.key];
            const displayMin = savedPrice ? JSON.parse(savedPrice).priceMin : plan.min;
            const displayMax = savedPrice ? JSON.parse(savedPrice).priceMax : plan.max;
            return (
              <div key={plan.key} style={{
                background: "#f9f9fc", border: "1.5px solid #e5e5ea", borderRadius: 12,
                padding: "20px", textAlign: "center"
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0e0e0e", marginBottom: 12 }}>{plan.name}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#5c4ef8", marginBottom: 8 }}>
                  {displayMin} - {displayMax}
                </div>
                <button onClick={() => {
                  setPricingForm({ name: plan.name, priceMin: displayMin, priceMax: displayMax });
                  setShowPricingForm(true);
                }} style={{
                  background: "#f0eeff", color: "#5c4ef8", border: "none", borderRadius: 8,
                  padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                }}>✏️ Edit</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Reviews Tab ─── */
function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/feedback/all`);
      setReviews(await r.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
  }, []);

  const deleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const r = await fetch(`${API}/feedback/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to delete review");
      setReviews(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete review.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0e0e0e" }}>Client Reviews <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>({reviews.length})</span></h2>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>No reviews found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {reviews.map(r => (
            <div key={r._id} style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #eee",
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0e0e0e" }}>{r.name || "Anonymous Client"}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>{r.email || "No email provided"}</div>
                  </div>
                  <div style={{ color: "#f59e0b", fontSize: 16, fontWeight: 700 }}>
                    {"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 16, fontStyle: "italic" }}>
                  "{r.message}"
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f9f9f9", paddingTop: 14 }}>
                <span style={{ fontSize: 12, color: "#bbb" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => deleteReview(r._id)}
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.2s"
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Comments Tab ─── */
function CommentsTab() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/contact`);
      setComments(await r.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments();
  }, []);

  const deleteComment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      const r = await fetch(`${API}/contact/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to delete message");
      setComments(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete message.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0e0e0e" }}>
          Contact Messages <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>({comments.length})</span>
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Loading messages…</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>No messages found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {comments.map(c => (
            <div key={c._id} style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #eee",
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0e0e0e" }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: "#888", wordBreak: "break-all", overflowWrap: "anywhere" }}>
                      <a href={`mailto:${c.email}`} style={{ color: "#5c4ef8", textDecoration: "none" }}>{c.email}</a>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-wrap" }}>
                  {c.message}
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f9f9f9", paddingTop: 14 }}>
                <span style={{ fontSize: 12, color: "#bbb" }}>{new Date(c.createdAt).toLocaleString()}</span>
                <button
                  onClick={() => deleteComment(c._id)}
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.2s"
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



/* ─── Main Admin Panel ─── */
export default function Admin() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ color: "#888" }}>Loading…</div>
    </div>
  );

  // Not logged in
  if (!user) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0eeff,#e8f0ff)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "48px 40px", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.1)", maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0e0e0e", marginBottom: 8 }}>Admin Panel</h1>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>Sign in with your admin Google account to continue.</p>
        <button onClick={signInWithGoogle} style={{ width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifycontent: "center", gap: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );

  // Not admin
  if (!ADMIN_EMAILS.includes(user.email)) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>🚫</div>
      <h2 style={{ fontSize: 20, color: "#0e0e0e" }}>Access Denied</h2>
      <p style={{ color: "#888", fontSize: 14 }}>Your account ({user.email}) is not an admin.</p>
      <button onClick={logOut} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>Sign Out</button>
    </div>
  );

  const tabs = [
    { key: "orders", label: "📋 Orders" },
    { key: "portfolio", label: "🖼️ Portfolio" },
    { key: "reviews", label: "💬 Reviews" },
    { key: "comments", label: "✉️ Comments" },
    { key: "users", label: "👥 Users" },
    { key: "settings", label: "⚙️ Settings" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7fb", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        /* Topbar Wrapper */
        .admin-topbar {
          background: #1a1a1a;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-sizing: border-box;
        }

        /* Brand logo + user details row on mobile */
        .admin-topbar-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-right: 32px;
        }

        /* Tabs container style */
        .admin-tabs-container {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        /* Tab button wrapping */
        .admin-tabs-container button {
          white-space: nowrap;
        }

        /* User profile details layout */
        .admin-user-details-desktop {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-user-details-mobile {
          display: none;
        }

        /* Admin Grid for forms */
        .admin-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        /* Responsive Rules */
        @media (max-width: 900px) {
          .admin-topbar {
            height: auto;
            flex-direction: column;
            padding: 12px 16px;
            align-items: stretch;
            gap: 12px;
          }
          .admin-topbar-brand-row {
            width: 100%;
            margin-right: 0;
          }
          .admin-tabs-container {
            overflow-x: auto;
            padding-bottom: 4px;
            margin: 0;
            -webkit-overflow-scrolling: touch;
          }
          .admin-tabs-container::-webkit-scrollbar {
            height: 4px;
          }
          .admin-tabs-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 2px;
          }
          .admin-user-details-desktop {
            display: none;
          }
          .admin-user-details-mobile {
            display: flex;
            align-items: center;
            gap: 10px;
          }
        }

        @media (max-width: 640px) {
          .admin-form-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-settings-card {
            padding: 20px !important;
          }
        }
      `}</style>

      {/* Topbar */}
      <div className="admin-topbar">
        <div className="admin-topbar-brand-row">
          <a href="/" style={{ color: "#d4f74b", fontWeight: 700, fontSize: 18, textDecoration: "none", letterSpacing: "-0.5px" }}>⚙ Annek Admin</a>
          <div className="admin-user-details-mobile">
            {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} />}
            <button onClick={logOut} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Log Out</button>
          </div>
        </div>

        <div className="admin-tabs-container">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: tab === t.key ? "rgba(255,255,255,0.12)" : "transparent",
              color: tab === t.key ? "#fff" : "rgba(255,255,255,0.5)",
              border: "none", borderRadius: 8, padding: "8px 18px",
              fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>

        <div className="admin-user-details-desktop">
          {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} />}
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{user.displayName?.split(" ")[0]}</span>
          <button onClick={logOut} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Log Out</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {tab === "orders" && <OrdersTab />}
        {tab === "portfolio" && <PortfolioTab />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "comments" && <CommentsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}
