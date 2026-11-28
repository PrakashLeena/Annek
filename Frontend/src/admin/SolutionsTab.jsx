/* Admin › Solutions — pre-designed solutions shown on /solutions/:category.
   Photos and videos upload straight from the browser to Cloudinary with a signature
   from the API (Vercel functions cannot take large request bodies). */
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "../utils/adminApi";
import { C, inp } from "./helpers";
import { Btn, Card, Notice } from "./ui";
import SolutionCard from "../site/SolutionCard.jsx";
import { CATEGORY_INFO, cld } from "../utils/media";
import { Counter, ImagesField, Toggle, UploadStatus, VideoField } from "./mediaFields";
import { EDITOR_CSS, HTTPS, hint, label, useMediaUploads } from "./mediaUpload";

const TABS = Object.values(CATEGORY_INFO);
const MAX_IMAGES = 8;
const BASE = "/admin/solutions";

/* ── Editor ────────────────────────────────────────────────── */

function SolutionEditor({ doc, category, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    title: doc?.title || "",
    purpose: doc?.purpose || "",
    description: doc?.description || "",
    images: doc?.images ? [...doc.images] : [],
    video: doc?.video || "",
    liveUrl: doc?.liveUrl || "",
    published: doc?.published ?? false,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const media = useMediaUploads(BASE);
  const isWeb = category === "web";
  const set = (k, v) => setForm((f) => ({ ...f, [k]: typeof v === "function" ? v(f[k]) : v }));

  const cancel = () => { media.finish([]); onCancel(); };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError("Title is required.");
    if (form.title.length > 120) return setError("Title must be at most 120 characters.");
    if (form.purpose.length > 160) return setError("Purpose must be at most 160 characters.");
    for (const [k, v] of [["Video URL", form.video], ["Live link", form.liveUrl]]) {
      if (v && !HTTPS.test(v.trim())) return setError(`${k} must start with https://`);
    }
    setSaving(true);
    try {
      const body = { ...form, title: form.title.trim(), purpose: form.purpose.trim(), video: form.video.trim(), liveUrl: form.liveUrl.trim(), category };
      const saved = doc
        ? await adminFetch(`/admin/solutions/${doc._id}`, { method: "PATCH", body })
        : await adminFetch("/admin/solutions", { method: "POST", body });
      // Files uploaded in this session but removed before saving are not used anywhere.
      media.finish([...(saved.images || []), saved.video]);
      onSaved(doc ? "Solution updated." : "Solution created.");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ background: "#FFF8F3", border: "1.5px solid #FDE3D0", borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: C.text }}>
        {doc ? `Edit "${doc.title}"` : `New ${CATEGORY_INFO[category].short} solution`}
      </h3>
      {error && <Notice notice={{ type: "error", message: error }} />}
      <div className="sol-editor">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><label htmlFor="sol-title" style={label}>Title *</label><Counter value={form.title} max={120} /></div>
            <input id="sol-title" style={inp} value={form.title} maxLength={140} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><label htmlFor="sol-purpose" style={label}>Purpose (shown on the card)</label><Counter value={form.purpose} max={160} /></div>
            <textarea id="sol-purpose" rows={2} style={{ ...inp, resize: "vertical" }} value={form.purpose} maxLength={180} onChange={(e) => set("purpose", e.target.value)} />
          </div>
          <div>
            <label htmlFor="sol-desc" style={label}>Description (shown in the detail view)</label>
            <textarea id="sol-desc" rows={6} style={{ ...inp, resize: "vertical" }} value={form.description} maxLength={5000} onChange={(e) => set("description", e.target.value)} />
          </div>

          <ImagesField images={form.images} onChange={(v) => set("images", v)} max={MAX_IMAGES} media={media} onError={setError} what="solution" />
          <VideoField value={form.video} onChange={(v) => set("video", v)} media={media} />
          <UploadStatus media={media} />

          <div>
            <label htmlFor="sol-live" style={label}>Live demo link{isWeb ? "" : " (optional)"}</label>
            <input id="sol-live" type="url" style={inp} placeholder="https://demo.example.com" value={form.liveUrl} onChange={(e) => set("liveUrl", e.target.value)} />
            <span style={hint}>{isWeb ? "Shows a Live demo button that opens in a new tab." : "Only web solutions show a Live demo button, so this link is not displayed here."}</span>
          </div>

          <Toggle checked={form.published} onChange={(v) => set("published", v)} label="Published (visible on the website)" />
        </div>

        <div>
          <span style={label}>Card preview</span>
          <div className="sol-card-scope" style={{ maxWidth: 360 }} aria-hidden="true">
            <SolutionCard item={form} preview onOpen={(e) => e.preventDefault()} />
          </div>
          {!form.published && <span style={hint}>Draft: not visible on the website until published.</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Btn type="submit" disabled={saving || media.busy}>{saving ? "Saving…" : media.busy ? "Uploading…" : "Save"}</Btn>
        <Btn kind="ghost" onClick={cancel} disabled={saving}>Cancel</Btn>
      </div>
    </form>
  );
}

/* ── List ──────────────────────────────────────────────────── */

export default function SolutionsTab() {
  const [category, setCategory] = useState("mobile");
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, doc = edit
  const [notice, setNotice] = useState(null);
  const [dragId, setDragId] = useState(null);

  const flash = (type, message) => { setNotice({ type, message }); if (type === "success") setTimeout(() => setNotice(null), 2500); };

  const load = useCallback(async (cat) => {
    try { setItems(await adminFetch(`/admin/solutions?category=${cat}`)); }
    catch (err) { setItems([]); flash("error", err.message); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(null); setEditing(undefined);
    load(category);
  }, [category, load]);

  const saved = async (message) => { setEditing(undefined); await load(category); flash("success", message); };

  const togglePublished = async (it, published) => {
    setItems((list) => list.map((x) => (x._id === it._id ? { ...x, published } : x)));
    try { await adminFetch(`/admin/solutions/${it._id}`, { method: "PATCH", body: { published } }); flash("success", published ? "Published." : "Unpublished."); }
    catch (err) { flash("error", err.message); load(category); }
  };

  const remove = async (it) => {
    if (!window.confirm(`Delete "${it.title}"? Its photos and video are deleted too. This cannot be undone.`)) return;
    try { await adminFetch(`/admin/solutions/${it._id}`, { method: "DELETE" }); await saved("Deleted, including its files."); }
    catch (err) { flash("error", err.message); }
  };

  const persistOrder = async (list) => {
    setItems(list);
    try { setItems(await adminFetch("/admin/solutions/reorder", { method: "POST", body: { category, ids: list.map((x) => x._id) } })); }
    catch (err) { flash("error", err.message); load(category); }
  };
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const list = [...items];
    [list[i], list[j]] = [list[j], list[i]];
    persistOrder(list);
  };
  const dropOn = (targetId) => {
    if (!dragId || dragId === targetId) return;
    const list = [...items];
    const from = list.findIndex((x) => x._id === dragId);
    const to = list.findIndex((x) => x._id === targetId);
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setDragId(null);
    persistOrder(list);
  };

  return (
    <div>
      <style>{EDITOR_CSS}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Solutions {items && <span style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}>({items.length})</span>}</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Pre designed solutions shown on <a href={`/solutions/${category}`} target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>/solutions/{category}</a>. Only published items are visible.
          </p>
        </div>
        {editing === undefined && <Btn onClick={() => setEditing(null)}>+ Add solution</Btn>}
      </div>

      <div role="tablist" aria-label="Solution category" style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.slug} type="button" role="tab" aria-selected={category === t.slug} className={`sol-pill ${category === t.slug ? "on" : ""}`} onClick={() => setCategory(t.slug)}>{t.label}</button>
        ))}
      </div>

      <Notice notice={notice} />
      {editing !== undefined && (
        <SolutionEditor key={editing?._id || `new-${category}`} doc={editing} category={category} onSaved={saved} onCancel={() => setEditing(undefined)} />
      )}

      {items === null ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Loading solutions…</div>
      ) : items.length === 0 ? (
        editing === undefined && <p style={{ color: "#aaa", textAlign: "center", padding: 30 }}>No {CATEGORY_INFO[category].short.toLowerCase()} solutions yet.</p>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it, i) => (
            <li key={it._id} draggable onDragStart={() => setDragId(it._id)} onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(it._id)}
              style={{ opacity: dragId === it._id ? 0.5 : 1 }}>
              <Card hidden={!it.published} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span title="Drag to reorder" aria-hidden="true" style={{ cursor: "grab", color: "#bbb", fontSize: 18, userSelect: "none" }}>⋮⋮</span>
                {it.images?.[0]
                  ? <img src={cld(it.images[0], 160)} alt="" loading="lazy" style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  : <div style={{ width: 72, height: 54, borderRadius: 8, background: C.accentSoft, flexShrink: 0 }} />}
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                  <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {it.images?.length || 0} images{it.video ? " · video" : ""}{it.category === "web" && it.liveUrl ? " · live demo" : ""}
                  </div>
                </div>
                <Toggle checked={!!it.published} onChange={(v) => togglePublished(it, v)} label="Published" />
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn kind="ghost" aria-label={`Move ${it.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</Btn>
                  <Btn kind="ghost" aria-label={`Move ${it.title} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</Btn>
                  <Btn kind="soft" onClick={() => { setEditing(it); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</Btn>
                  <Btn kind="danger" onClick={() => remove(it)}>Delete</Btn>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
