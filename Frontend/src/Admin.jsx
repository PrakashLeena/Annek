import { useState, useEffect, lazy, Suspense } from "react";
import { auth, signInWithGoogle, logOut, onAuthStateChanged } from "./firebase";
import { adminFetch } from "./utils/adminApi";
import logoImg from "./images/annek-logo.webp";

const CatalogTab = lazy(() => import("./admin/CatalogTab.jsx"));
const ProductsTab = lazy(() => import("./admin/ProductsTab.jsx"));
const SolutionsTab = lazy(() => import("./admin/SolutionsTab.jsx"));
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
      {String(status || "").replace(/-/g, " ")}
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
      setOrders(await adminFetch("/orders"));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const updateStatus = async (id, status) => {
    try { await adminFetch(`/orders/${id}`, { method: "PATCH", body: { status } }); }
    catch (err) { alert(err.message); return; }
    setOrders(o => o.map(x => x._id === id ? { ...x, status } : x));
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try { await adminFetch(`/orders/${id}`, { method: "DELETE" }); }
    catch (err) { alert(err.message); return; }
    setOrders(o => o.filter(x => x._id !== id));
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const Field = ({ label, value }) => value ? (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#B8460B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>{value}</div>
    </div>
  ) : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#16130F" }}>Customer Orders <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>({orders.length})</span></h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", "pending", "in-review", "in-progress", "completed", "cancelled"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: filter === f ? "#16130F" : "#f3f4f6", color: filter === f ? "#fff" : "#555", border: "none", transition: "all 0.2s",
            }}>{f === "all" ? "All" : f.replace(/-/g, " ")}</button>
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
                <div style={{ fontSize: 15, fontWeight: 700, color: "#16130F" }}>{order.name}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{order.email} {order.company ? `· ${order.company}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Badge status={order.status} />
                <select value={order.status} onClick={e => e.stopPropagation()}
                  onChange={e => updateStatus(order._id, e.target.value)}
                  style={{ fontSize: 13, padding: "4px 10px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fafafa", cursor: "pointer", fontFamily: "inherit" }}>
                  {["pending","in-review","in-progress","completed","cancelled"].map(s => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
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
                <Field label="Selected Package / Product" value={order.selectedPackage} />
                <Field label="Phone / WhatsApp" value={order.phone} />
                <Field label="Runs On" value={order.platforms?.join(", ")} />
                <Field label="Project Description" value={order.description} />
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
                {order.logoUrl && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#B8460B", textTransform: "uppercase", marginBottom: 6 }}>Logo</div><a href={order.logoUrl} target="_blank" rel="noreferrer" style={{ color: "#B8460B", fontSize: 13 }}>View Logo ↗</a></div>}
                {order.imageUrls?.length > 0 && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#B8460B", textTransform: "uppercase", marginBottom: 6 }}>Images</div>{order.imageUrls.map((u,i) => <a key={i} href={u} target="_blank" rel="noreferrer" style={{ display: "block", color: "#B8460B", fontSize: 13 }}>Image {i+1} ↗</a>)}</div>}
                {order.videoUrls?.length > 0 && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#B8460B", textTransform: "uppercase", marginBottom: 6 }}>Videos</div>{order.videoUrls.map((u,i) => <a key={i} href={u} target="_blank" rel="noreferrer" style={{ display: "block", color: "#B8460B", fontSize: 13 }}>Video {i+1} ↗</a>)}</div>}
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
  const [form, setForm] = useState({ title: "", category: "", desc: "", accent: "#F26A1B", tags: "", visible: true });
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPortfolio = async () => {
    try {
      setItems(await adminFetch("/portfolio"));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPortfolio();
  }, []);

  const openNew = () => { setForm({ title:"", category:"", desc:"", accent:"#F26A1B", tags:"", visible:true }); setImgFile(null); setEditing(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ title:item.title, category:item.category, desc:item.desc, accent:item.accent, tags:item.tags?.join(", ")||"", visible:item.visible });
    setImgFile(null); setEditing(item._id); setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("data", JSON.stringify({ ...form, tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean) }));
    if (imgFile) fd.append("image", imgFile);
    const url = editing ? `/portfolio/${editing}` : "/portfolio";
    const method = editing ? "PUT" : "POST";
    try {
      const item = await adminFetch(url, { method, body: fd });
      if (editing) setItems(it => it.map(x => x._id === editing ? item : x));
      else setItems(it => [item, ...it]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this portfolio item?")) return;
    try { await adminFetch(`/portfolio/${id}`, { method: "DELETE" }); }
    catch (err) { alert(err.message); return; }
    setItems(it => it.filter(x => x._id !== id));
  };

  const inpStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e5e5", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", background: "#fafafa" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#16130F" }}>Portfolio <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>({items.length} projects)</span></h2>
        <button onClick={openNew} style={{ background: "#16130F", color: "#fff", border: "none", borderRadius: 12, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Add Project</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "#FFF8F3", border: "1.5px solid #FDE3D0", borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#16130F" }}>{editing ? "Edit Project" : "New Project"}</h3>
          <div className="admin-form-grid">
            {[["title","Title *"],["category","Category *"],["desc","Description"],["tags","Tags (comma separated)"]].map(([k,l]) => (
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
              {imgFile && <span style={{ fontSize: 12, color: "#B8460B" }}>{imgFile.name}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="vis" checked={form.visible} onChange={e => setForm(f=>({...f,visible:e.target.checked}))} style={{ accentColor: "#F26A1B", width: 16, height: 16 }} />
              <label htmlFor="vis" style={{ fontSize: 14, color: "#333", cursor: "pointer" }}>Visible on site</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={save} disabled={saving} style={{ background: "#16130F", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: saving?"not-allowed":"pointer", opacity: saving?0.7:1, fontFamily:"inherit" }}>
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
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#16130F", marginTop: 2 }}>{item.title}</div>
                </div>
                {!item.visible && <span style={{ fontSize: 11, background: "#fef2f2", color: "#dc2626", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Hidden</span>}
              </div>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 12, lineHeight: 1.5 }}>{item.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                {item.tags?.map(t => <span key={t} style={{ background: "#f3f4f6", borderRadius: 100, padding: "2px 10px", fontSize: 11, color: "#555" }}>{t}</span>)}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(item)} style={{ flex: 1, background: "#FFF1E8", color: "#B8460B", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily:"inherit" }}>✏️ Edit</button>
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
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#16130F", marginBottom: 24 }}>Logged in Users</h2>
      {loading ? <div style={{ color: "#aaa", textAlign: "center", padding: 40 }}>Loading…</div> :
        users.length === 0 ? <div style={{ color: "#aaa", textAlign: "center", padding: 40 }}>No users found.</div> :
        users.map(u => (
          <div key={u.uid} style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            {u.photo ? <img src={u.photo} alt="" style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #FDE3D0" }} /> : <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FDE3D0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#16130F" }}>{u.name}</div>
              <div style={{ fontSize: 13, color: "#888" }}>{u.email}</div>
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>UID: {u.uid}</div>
            </div>
            <span style={{ background: "#FDE3D0", color: "#B8460B", padding: "4px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700 }}>{u.role}</span>
          </div>
        ))
      }
    </div>
  );
}

/* ─── Settings Tab ─── */
const COMPANY_FIELDS = [
  ["companyName", "Company name", "Annek"],
  ["founderName", "Founder / owner name", "Your name"],
  ["companyTagline", "Tagline", "Digital solutions for apps, web & software"],
  ["contactEmail", "Contact email", "info@annek.tech"],
  ["contactPhone", "Phone", "+94 70 126 9689"],
  ["whatsappNumber", "WhatsApp number (digits only)", "94701269689"],
  ["address", "Address", "Vankalai, Sri Lanka"],
  ["serviceArea", "Service area", "Sri Lanka & worldwide"],
  ["aboutText", "About text", "A short paragraph about you and Annek", true],
];
const SEO_FIELDS = [
  ["seoTitle", "Home page title", "Annek | Web, Mobile App & Software Development in Sri Lanka"],
  ["seoDescription", "Meta description", "Web applications, mobile apps and custom software with monthly maintenance packages…", 3],
  ["seoKeywords", "Target keywords", "web development sri lanka, mobile application development sri lanka, software development sri lanka", 3],
];

function SettingsTab() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      setSettings(await adminFetch("/settings"));
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
      setSettings(await adminFetch("/settings", { method: "POST", body: settings }));
      setStatus({ type: "success", message: "Settings saved successfully!" });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Failed to save settings." });
    }
    setSaving(false);
  };

  const inpStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e5e5", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", background: "#fafafa" };

  return (
    <div className="admin-settings-card" style={{ maxWidth: 760, background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#16130F", marginBottom: 24 }}>Platform Settings</h2>
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
          
          {/* Company & personal details */}
          <div style={{ borderTop: "1.5px solid #f0f0f0", paddingTop: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#16130F", marginBottom: 4 }}>🏢 Company &amp; Personal Details</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Shown in the footer, contact section and Google business data. Leave blank to keep the current text.</div>
            <div className="admin-form-grid">
              {COMPANY_FIELDS.map(([key, label, placeholder, wide]) => (
                <div key={key} style={{ gridColumn: wide ? "1/-1" : "auto" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block" }}>{label}</label>
                  {wide
                    ? <textarea style={{ ...inpStyle, minHeight: 70, resize: "vertical" }} value={settings[key] || ""} placeholder={placeholder} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} />
                    : <input style={inpStyle} type="text" value={settings[key] || ""} placeholder={placeholder} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} />}
                </div>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div style={{ borderTop: "1.5px solid #f0f0f0", paddingTop: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#16130F", marginBottom: 4 }}>🔎 SEO</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Page title, description and target keywords (comma separated). Applied to the home page when it loads.</div>
            {SEO_FIELDS.map(([key, label, placeholder, rows]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block" }}>{label}</label>
                {rows
                  ? <textarea rows={rows} style={{ ...inpStyle, resize: "vertical" }} value={settings[key] || ""} placeholder={placeholder} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} />
                  : <input style={inpStyle} type="text" value={settings[key] || ""} placeholder={placeholder} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} />}
              </div>
            ))}
          </div>

          {/* Pricing Section */}
          <div style={{ borderTop: "1.5px solid #f0f0f0", paddingTop: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#16130F", marginBottom: 4 }}>💰 Pricing Plans</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
              Edit the price shown on each plan card. Use any format e.g. <strong>$75</strong>, <strong>$75 to $90</strong>, <strong>£60</strong>, <strong>₹5,000</strong>.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block" }}>Starter Plan Price</label>
                <input
                  style={inpStyle}
                  type="text"
                  value={settings.starterPrice || ""}
                  onChange={e => setSettings(s => ({ ...s, starterPrice: e.target.value }))}
                  placeholder="$75 - $80"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block" }}>Growth Plan Price</label>
                <input
                  style={inpStyle}
                  type="text"
                  value={settings.growthPrice || ""}
                  onChange={e => setSettings(s => ({ ...s, growthPrice: e.target.value }))}
                  placeholder="$100 - $120"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, display: "block" }}>Premium Plan Price</label>
                <input
                  style={inpStyle}
                  type="text"
                  value={settings.premiumPrice || ""}
                  onChange={e => setSettings(s => ({ ...s, premiumPrice: e.target.value }))}
                  placeholder="$150 - $170"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              background: "#16130F",
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
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      )}
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
      setReviews(await adminFetch("/feedback/all"));
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
      await adminFetch(`/feedback/${id}`, { method: "DELETE" });
      setReviews(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete review.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#16130F" }}>Client Reviews <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>({reviews.length})</span></h2>
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
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#16130F" }}>{r.name || "Anonymous Client"}</div>
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
      setComments(await adminFetch("/contact"));
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
      await adminFetch(`/contact/${id}`, { method: "DELETE" });
      setComments(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete message.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#16130F" }}>
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
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#16130F" }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: "#888", wordBreak: "break-all", overflowWrap: "anywhere" }}>
                      <a href={`mailto:${c.email}`} style={{ color: "#B8460B", textDecoration: "none" }}>{c.email}</a>
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

  const center = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F6F4", fontFamily: "Inter, system-ui, sans-serif", color: "#16130F", padding: 20 };

  if (authLoading) return <div style={center}><span style={{ color: "#8A847B" }}>Loading…</span></div>;

  // Not logged in
  if (!user) return (
    <div style={center}>
      <div style={{ background: "#fff", border: "1px solid #EEECE8", borderRadius: 24, padding: "44px 36px", textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 24px 60px rgba(22,19,15,.08)" }}>
        <img src={logoImg} alt="Annek" style={{ height: 40, width: "auto", margin: "0 auto 24px" }} />
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 600, marginBottom: 8 }}>Admin panel</h1>
        <p style={{ fontSize: 14, color: "#5B554D", marginBottom: 28 }}>Sign in with your admin Google account.</p>
        <button type="button" onClick={signInWithGoogle} style={{ width: "100%", background: "#16130F", color: "#fff", border: "none", borderRadius: 999, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </button>
        <a href="/" style={{ display: "inline-block", marginTop: 18, fontSize: 14, color: "#B8460B" }}>← Back to website</a>
      </div>
    </div>
  );

  // Not admin
  if (!ADMIN_EMAILS.map(e => e.toLowerCase()).includes((user.email || "").toLowerCase())) return (
    <div style={{ ...center, flexDirection: "column", gap: 14, textAlign: "center" }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24 }}>Access denied</h1>
      <p style={{ color: "#5B554D", fontSize: 14 }}>{user.email} is not an admin account.</p>
      <button type="button" onClick={logOut} style={{ background: "#16130F", color: "#fff", border: "none", borderRadius: 999, padding: "11px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>Sign out</button>
    </div>
  );

  const groups = [
    ["Sales", [["orders", "Orders"], ["comments", "Messages"], ["reviews", "Reviews"]]],
    ["Catalog", [["solutions", "Solutions"], ["services", "Services & packages"], ["products", "Own products"], ["portfolio", "Portfolio"]]],
    ["Site", [["settings", "Company & SEO"], ["users", "Account"]]],
  ];

  return (
    <div className="adm">
      <style>{ADMIN_CSS}</style>
      <aside className="adm-side">
        <a href="/" className="adm-logo" title="View website"><img src={logoImg} alt="Annek" /></a>
        <nav className="adm-nav" aria-label="Admin">
          {groups.map(([group, items]) => (
            <div key={group} className="adm-group">
              <div className="adm-group-label">{group}</div>
              {items.map(([key, label]) => (
                <button key={key} type="button" className={tab === key ? "on" : ""} aria-current={tab === key ? "page" : undefined} onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-user">
          {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <span className="adm-avatar">{(user.displayName || "A")[0]}</span>}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName || "Admin"}</div>
            <button type="button" onClick={logOut} className="adm-link">Log out</button>
          </div>
        </div>
      </aside>

      <main className="adm-main">
        {tab === "orders" && <OrdersTab />}
        <Suspense fallback={<div style={{ textAlign: "center", color: "#8A847B", padding: 40 }}>Loading…</div>}>
          {tab === "services" && <CatalogTab />}
          {tab === "products" && <ProductsTab />}
          {tab === "solutions" && <SolutionsTab />}
        </Suspense>
        {tab === "portfolio" && <PortfolioTab />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "comments" && <CommentsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

const ADMIN_CSS = `
.adm { min-height: 100vh; display: flex; background: #F7F6F4; font-family: Inter, system-ui, sans-serif; color: #16130F; }
.adm *, .adm *::before, .adm *::after { box-sizing: border-box; }
.adm h2 { font-family: 'Space Grotesk', Inter, sans-serif; letter-spacing: -.3px; }
.adm-side { width: 250px; flex-shrink: 0; background: #fff; border-right: 1px solid #EEECE8; padding: 22px 14px; display: flex; flex-direction: column; gap: 8px; position: sticky; top: 0; height: 100vh; }
.adm-logo { display: block; padding: 0 10px 18px; }
.adm-logo img { height: 30px; width: auto; }
.adm-nav { display: flex; flex-direction: column; gap: 14px; flex: 1; overflow-y: auto; }
.adm-group { display: flex; flex-direction: column; gap: 2px; }
.adm-group-label { font-size: 11px; font-weight: 600; color: #8A847B; letter-spacing: .08em; text-transform: uppercase; padding: 0 12px 6px; }
.adm-nav button { text-align: left; background: none; border: 0; border-radius: 10px; padding: 10px 12px; font: 500 14px Inter, sans-serif; color: #16130F; cursor: pointer; }
.adm-nav button:hover { background: #F4F2EF; }
.adm-nav button.on { background: #FFF1E8; color: #B8460B; font-weight: 600; }
.adm-user { display: flex; align-items: center; gap: 10px; padding: 12px; border-top: 1px solid #EEECE8; font-size: 13px; }
.adm-user img, .adm-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; }
.adm-avatar { background: #16130F; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.adm-link { background: none; border: 0; padding: 0; color: #B8460B; font: 500 13px Inter, sans-serif; cursor: pointer; }
.adm-main { flex: 1; min-width: 0; padding: 32px 40px; max-width: 1280px; }
.admin-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 900px) {
  .adm { flex-direction: column; }
  .adm-side { width: 100%; height: auto; position: sticky; top: 0; z-index: 10; flex-direction: row; align-items: center; padding: 10px 14px; gap: 12px; border-right: 0; border-bottom: 1px solid #EEECE8; }
  .adm-logo { padding: 0; }
  .adm-logo img { height: 26px; }
  .adm-nav { flex-direction: row; overflow-x: auto; gap: 4px; }
  .adm-group { flex-direction: row; gap: 4px; }
  .adm-group-label { display: none; }
  .adm-nav button { white-space: nowrap; padding: 8px 12px; }
  .adm-user { display: none; }
  .adm-main { padding: 20px 16px; }
}
@media (max-width: 640px) {
  .admin-form-grid { grid-template-columns: 1fr; }
  .admin-settings-card { padding: 20px !important; }
}
`;
