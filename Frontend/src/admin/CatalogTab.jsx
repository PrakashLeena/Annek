/* Admin › Services & Packages
   Main categories + subcategories, showcase templates, built-in packages, maintenance plans. */
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../utils/adminApi";
import { Btn, Card, EntityForm, HiddenBadge, Notice } from "./ui";
import { C, money, payload } from "./helpers";

const SECTIONS = [
  ["categories", "Categories"],
  ["templates", "Showcase templates"],
  ["packages", "Built in packages"],
  ["maintenance", "Maintenance plans"],
];

export default function CatalogTab() {
  const [data, setData] = useState(null);
  const [section, setSection] = useState("categories");
  const [editing, setEditing] = useState(null); // { resource, doc|null, preset }
  const [notice, setNotice] = useState(null);
  const [filterCat, setFilterCat] = useState("");

  const load = async () => {
    try { setData(await adminFetch("/catalog/admin")); }
    catch (err) { setNotice({ type: "error", message: err.message }); setData({ categories: [], templates: [], packages: [], maintenancePlans: [] }); }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const flash = (message, type = "success") => { setNotice({ type, message }); if (type === "success") setTimeout(() => setNotice(null), 2500); };

  const cats = data?.categories || [];
  const mains = cats.filter((c) => !c.parent);
  const subsOf = (id) => cats.filter((c) => String(c.parent) === String(id));
  const catName = (id) => {
    const c = cats.find((x) => String(x._id) === String(id));
    if (!c) return "None";
    const p = c.parent && cats.find((x) => String(x._id) === String(c.parent));
    return p ? `${p.name} › ${c.name}` : c.name;
  };
  const catOptions = useMemo(() => {
    const opts = [["", "Choose…"]];
    for (const m of mains) {
      opts.push([m._id, m.name]);
      for (const s of subsOf(m._id)) opts.push([s._id, `   ↳ ${s.name}`]);
    }
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats]);
  const planOptions = [["", "None"], ...(data?.maintenancePlans || []).map((p) => [p._id, `${p.name} (${money(p.monthlyFee, p.currency)}/mo)`])];

  const FIELDS = {
    categories: [
      { key: "name", label: "Name", required: true, placeholder: "Mobile Applications" },
      { key: "parent", label: "Parent (leave empty for a main category)", type: "select", options: [["", "Main category"], ...mains.filter((m) => String(m._id) !== String(editing?.doc?._id)).map((m) => [m._id, m.name])] },
      { key: "icon", label: "Icon (emoji)", placeholder: "📱" },
      { key: "order", label: "Sort order", type: "number" },
      { key: "description", label: "Description", type: "textarea", rows: 2 },
      { key: "visible", label: "Visible on site", type: "checkbox", default: true },
    ],
    templates: [
      { key: "title", label: "Template name", required: true, placeholder: "Grocery delivery app" },
      { key: "category", label: "Category", type: "select", options: catOptions },
      { key: "demoUrl", label: "Live demo URL", type: "url", placeholder: "https://…" },
      { key: "order", label: "Sort order", type: "number" },
      { key: "description", label: "Description", type: "textarea", rows: 3 },
      { key: "features", label: "Features (one per line)", type: "list", rows: 4 },
      { key: "tags", label: "Tags (one per line)", type: "list", rows: 2 },
      { key: "image", label: "Preview image", type: "image", hint: "PNG/JPG/WebP up to 4 MB" },
      { key: "visible", label: "Visible on site", type: "checkbox", default: true },
    ],
    packages: [
      { key: "name", label: "Package name", required: true, placeholder: "Ecommerce Starter" },
      { key: "category", label: "Category", type: "select", options: catOptions },
      { key: "setupPrice", label: "One time setup price", type: "number" },
      { key: "monthlyFee", label: "Monthly maintenance fee", type: "number" },
      { key: "currency", label: "Currency", type: "select", default: "USD", options: [["USD", "USD $"], ["LKR", "LKR Rs"], ["EUR", "EUR €"], ["GBP", "GBP £"]] },
      { key: "deliveryTime", label: "Delivery time", placeholder: "7 to 10 days" },
      { key: "maintenancePlan", label: "Included maintenance plan", type: "select", options: planOptions },
      { key: "order", label: "Sort order", type: "number" },
      { key: "description", label: "Description", type: "textarea", rows: 2 },
      { key: "features", label: "What's included (one per line)", type: "list", rows: 5 },
      { key: "highlighted", label: "Highlight as most popular", type: "checkbox" },
      { key: "visible", label: "Visible on site", type: "checkbox", default: true },
    ],
    maintenance: [
      { key: "name", label: "Plan name", required: true, placeholder: "Standard care" },
      { key: "monthlyFee", label: "Monthly fee", type: "number" },
      { key: "currency", label: "Currency", type: "select", default: "USD", options: [["USD", "USD $"], ["LKR", "LKR Rs"], ["EUR", "EUR €"], ["GBP", "GBP £"]] },
      { key: "order", label: "Sort order", type: "number" },
      { key: "description", label: "Description", type: "textarea", rows: 2 },
      { key: "features", label: "Covers (one per line)", type: "list", rows: 4 },
      { key: "visible", label: "Visible on site", type: "checkbox", default: true },
    ],
  };

  const save = async (resource, doc, body, file) => {
    const path = doc ? `/catalog/${resource}/${doc._id}` : `/catalog/${resource}`;
    await adminFetch(path, { method: doc ? "PUT" : "POST", body: payload(body, file) });
    setEditing(null);
    await load();
    flash(doc ? "Saved." : "Created.");
  };

  const remove = async (resource, doc, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await adminFetch(`/catalog/${resource}/${doc._id}`, { method: "DELETE" }); await load(); flash("Deleted."); }
    catch (err) { flash(err.message, "error"); }
  };

  const seed = async () => {
    try { setData(await adminFetch("/catalog/admin/seed", { method: "POST" })); flash("Starter categories added. Edit them as you like."); }
    catch (err) { flash(err.message, "error"); }
  };

  if (!data) return <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Loading catalog…</div>;

  const openNew = (resource, preset = {}) => setEditing({ resource, doc: null, preset });
  const editor = editing && (
    <EntityForm
      key={`${editing.resource}-${editing.doc?._id || "new"}`}
      title={`${editing.doc ? "Edit" : "New"} ${SECTIONS.find(([k]) => k === editing.resource)[1].replace(/s$/, "").toLowerCase()}`}
      fields={FIELDS[editing.resource]}
      initial={editing.doc || editing.preset}
      onCancel={() => setEditing(null)}
      onSave={(body, file) => save(editing.resource, editing.doc, body, file)}
    />
  );

  const counts = { categories: cats.length, templates: data.templates.length, packages: data.packages.length, maintenance: data.maintenancePlans.length };
  const inCat = (list) => (filterCat ? list.filter((x) => String(x.category) === filterCat || subsOf(filterCat).some((s) => String(s._id) === String(x.category))) : list);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Client Services &amp; Packages</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Mobile apps, web apps and custom software, sold as built in packages with a monthly maintenance fee.</p>
        </div>
        {cats.length === 0 && <Btn onClick={seed}>✨ Add starter categories from the plan</Btn>}
      </div>

      <Notice notice={notice} />

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {SECTIONS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => { setSection(k); setEditing(null); }} style={{
            padding: "7px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "none",
            background: section === k ? C.accent : "#f3f4f6", color: section === k ? "#fff" : "#555",
          }}>{l} <span style={{ opacity: 0.7 }}>({counts[k]})</span></button>
        ))}
      </div>

      {editor}

      {section === "categories" && (
        <div>
          <Btn onClick={() => openNew("categories", { visible: true })} style={{ marginBottom: 16 }}>+ Main category</Btn>
          {mains.length === 0 && <p style={{ color: "#aaa" }}>No categories yet.</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {mains.map((m) => (
              <Card key={m._id} hidden={!m.visible}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{m.icon} {m.name} {!m.visible && <HiddenBadge />}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn kind="soft" onClick={() => setEditing({ resource: "categories", doc: m })}>Edit</Btn>
                    <Btn kind="danger" onClick={() => remove("categories", m, m.name)}>Delete</Btn>
                  </div>
                </div>
                {m.description && <p style={{ fontSize: 13, color: "#666", margin: "8px 0" }}>{m.description}</p>}
                <div style={{ borderTop: "1px solid #f3f3f3", marginTop: 10, paddingTop: 10 }}>
                  {subsOf(m._id).map((s) => (
                    <div key={s._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: 14 }}>
                      <span>↳ {s.name} {!s.visible && <HiddenBadge />}</span>
                      <span style={{ display: "flex", gap: 6 }}>
                        <button type="button" onClick={() => setEditing({ resource: "categories", doc: s })} style={linkBtn}>Edit</button>
                        <button type="button" onClick={() => remove("categories", s, s.name)} style={{ ...linkBtn, color: C.danger }}>Delete</button>
                      </span>
                    </div>
                  ))}
                  <button type="button" onClick={() => openNew("categories", { parent: m._id, visible: true })} style={{ ...linkBtn, marginTop: 6 }}>+ Add subcategory</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(section === "templates" || section === "packages") && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <Btn onClick={() => openNew(section, { category: filterCat, visible: true })} disabled={cats.length === 0}>
            + {section === "templates" ? "Template" : "Package"}
          </Btn>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e5e5e5", fontFamily: "inherit", fontSize: 13 }}>
            <option value="">All categories</option>
            {catOptions.slice(1).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {cats.length === 0 && <span style={{ fontSize: 13, color: C.muted }}>Add categories first.</span>}
        </div>
      )}

      {section === "templates" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {inCat(data.templates).map((t) => (
            <Card key={t._id} hidden={!t.visible} style={{ padding: 0, overflow: "hidden" }}>
              {t.imageUrl
                ? <img src={t.imageUrl} alt="" loading="lazy" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                : <div style={{ height: 130, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>🧩</div>}
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase" }}>{catName(t.category)}</div>
                <div style={{ fontSize: 15, fontWeight: 700, margin: "2px 0 6px" }}>{t.title} {!t.visible && <HiddenBadge />}</div>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>{t.description}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn kind="soft" style={{ flex: 1 }} onClick={() => setEditing({ resource: "templates", doc: t })}>Edit</Btn>
                  <Btn kind="danger" style={{ flex: 1 }} onClick={() => remove("templates", t, t.title)}>Delete</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {section === "packages" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {inCat(data.packages).map((p) => (
            <Card key={p._id} hidden={!p.visible} style={p.highlighted ? { borderColor: C.accent } : undefined}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase" }}>{catName(p.category)}</div>
              <div style={{ fontSize: 16, fontWeight: 700, margin: "2px 0" }}>{p.name} {p.highlighted && "⭐"} {!p.visible && <HiddenBadge />}</div>
              <div style={{ fontSize: 14, margin: "6px 0 10px" }}>
                <strong>{money(p.setupPrice, p.currency)}</strong> setup · <strong>{money(p.monthlyFee, p.currency)}</strong>/mo
              </div>
              <ul style={{ fontSize: 13, color: "#555", paddingLeft: 18, marginBottom: 10 }}>
                {p.features?.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
              </ul>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn kind="soft" style={{ flex: 1 }} onClick={() => setEditing({ resource: "packages", doc: p })}>Edit</Btn>
                <Btn kind="danger" style={{ flex: 1 }} onClick={() => remove("packages", p, p.name)}>Delete</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {section === "maintenance" && (
        <div>
          <Btn onClick={() => openNew("maintenance", { visible: true })} style={{ marginBottom: 16 }}>+ Maintenance plan</Btn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {data.maintenancePlans.map((m) => (
              <Card key={m._id} hidden={!m.visible}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{m.name} {!m.visible && <HiddenBadge />}</div>
                <div style={{ fontSize: 14, margin: "4px 0 8px" }}><strong>{money(m.monthlyFee, m.currency)}</strong>/month</div>
                <ul style={{ fontSize: 13, color: "#555", paddingLeft: 18, marginBottom: 10 }}>
                  {m.features?.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn kind="soft" style={{ flex: 1 }} onClick={() => setEditing({ resource: "maintenance", doc: m })}>Edit</Btn>
                  <Btn kind="danger" style={{ flex: 1 }} onClick={() => remove("maintenance", m, m.name)}>Delete</Btn>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const linkBtn = { background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" };
