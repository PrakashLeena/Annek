/* Admin › Solutions — pre-designed solutions shown on /solutions/:category.
   Photos and videos upload straight from the browser to Cloudinary with a signature
   from the API (Vercel functions cannot take large request bodies). */
import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "../utils/adminApi";
import { C, inp } from "./helpers";
import { Btn, Card, Notice } from "./ui";
import SolutionCard from "../site/SolutionCard.jsx";
import { CATEGORY_INFO, cld, videoEmbed } from "../utils/media";

const TABS = Object.values(CATEGORY_INFO);
const MAX_IMAGES = 8;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_SOURCE_IMAGE_BYTES = 40 * 1024 * 1024; // before resizing
const HTTPS = /^https:\/\/[^\s<>"']+$/i;

const label = { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5, display: "block" };
const hint = { fontSize: 11, color: C.muted, marginTop: 4, display: "block" };
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

/* ── Uploading ─────────────────────────────────────────────── */

/** Resizes to max 1920px on the long side and re-encodes (WebP, JPEG fallback). */
async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${file.name}: could not read this image.`);
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const toBlob = (type, q) => new Promise((r) => canvas.toBlob(r, type, q));
  let blob = await toBlob("image/webp", 0.85);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.85);
  if (!blob) throw new Error(`${file.name}: could not compress this image.`);
  // Keep the original if it was already small enough and our version is not smaller.
  if (scale === 1 && file.size <= blob.size && file.size <= MAX_IMAGE_BYTES) return file;
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
}

/** Signed direct upload to Cloudinary with progress; resolves to the https URL. */
async function directUpload(file, kind, onProgress) {
  const sig = await adminFetch("/admin/solutions/upload-signature", { method: "POST", body: { kind } });
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);
  fd.append("allowed_formats", sig.allowedFormats);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sig.uploadUrl);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) resolve(data.secure_url);
      else reject(new Error(data?.error?.message || `Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(fd);
  });
}

const discard = (urls) => {
  if (urls.length) adminFetch("/admin/solutions/discard-uploads", { method: "POST", body: { urls } }).catch(() => {});
};

/* ── Small controls ────────────────────────────────────────── */

function Counter({ value, max }) {
  const n = value.length;
  return <span style={{ fontSize: 11, color: n > max ? C.danger : C.muted, fontWeight: 600 }} aria-live="polite">{n}/{max}</span>;
}

function Toggle({ checked, onChange, label: text, disabled }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: disabled ? "default" : "pointer", fontSize: 13, color: "#333" }}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.accent }} />
      {text}
    </label>
  );
}

function Progress({ value }) {
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} style={{ height: 6, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.round(value * 100)}%`, height: "100%", background: C.accent, transition: "width .2s" }} />
    </div>
  );
}

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
  const [videoMode, setVideoMode] = useState(() => (doc?.video && !doc.video.includes("res.cloudinary.com") ? "url" : "upload"));
  const [uploads, setUploads] = useState([]); // [{ id, name, progress, error }]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const sessionUploads = useRef([]); // URLs uploaded while this editor was open
  const isWeb = category === "web";
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const busy = uploads.some((u) => u.progress < 1 && !u.error);

  const track = (name) => {
    const id = Math.random().toString(36).slice(2);
    setUploads((u) => [...u, { id, name, progress: 0, error: null }]);
    return {
      progress: (p) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x))),
      fail: (msg) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: msg } : x))),
      done: () => setUploads((u) => u.filter((x) => x.id !== id)),
    };
  };

  const addImages = async (files) => {
    setError(null);
    const room = MAX_IMAGES - form.images.length;
    const list = [...files].slice(0, Math.max(0, room));
    if (files.length > room) setError(`Only ${MAX_IMAGES} images per solution. ${files.length - room} not added.`);
    await Promise.all(list.map(async (file) => {
      const t = track(file.name);
      try {
        if (!IMAGE_TYPES.includes(file.type)) throw new Error(`${file.name}: use JPG, PNG or WebP.`);
        if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new Error(`${file.name}: file is too large (${mb(file.size)}).`);
        const small = await shrinkImage(file);
        if (small.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: still ${mb(small.size)} after compressing (max 5 MB).`);
        const url = await directUpload(small, "image", t.progress);
        sessionUploads.current.push(url);
        setForm((f) => (f.images.length >= MAX_IMAGES ? f : { ...f, images: [...f.images, url] }));
        t.done();
      } catch (err) { t.fail(err.message); }
    }));
  };

  const addVideo = async (file) => {
    setError(null);
    if (!file) return;
    const t = track(file.name);
    try {
      if (!VIDEO_TYPES.includes(file.type)) throw new Error(`${file.name}: use MP4 or WebM.`);
      if (file.size > MAX_VIDEO_BYTES) throw new Error(`${file.name}: ${mb(file.size)} is over the 100 MB limit.`);
      const url = await directUpload(file, "video", t.progress);
      sessionUploads.current.push(url);
      set("video", url);
      t.done();
    } catch (err) { t.fail(err.message); }
  };

  const moveImage = (i, d) => setForm((f) => {
    const images = [...f.images];
    const j = i + d;
    if (j < 0 || j >= images.length) return f;
    [images[i], images[j]] = [images[j], images[i]];
    return { ...f, images };
  });
  const makeCover = (i) => setForm((f) => ({ ...f, images: [f.images[i], ...f.images.filter((_, k) => k !== i)] }));
  const removeImage = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, k) => k !== i) }));

  const cancel = () => { discard(sessionUploads.current); onCancel(); };

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
      const kept = new Set([...(saved.images || []), saved.video].filter(Boolean));
      discard(sessionUploads.current.filter((u) => !kept.has(u)));
      sessionUploads.current = [];
      onSaved(doc ? "Solution updated." : "Solution created.");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const embed = videoEmbed(form.video);

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

          {/* Images */}
          <div>
            <span style={label}>Images ({form.images.length}/{MAX_IMAGES}). The first one is the cover.</span>
            {form.images.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                {form.images.map((src, i) => (
                  <li key={src} style={{ background: "#fff", border: `1.5px solid ${i === 0 ? C.accent : C.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <img src={cld(src, 300)} alt={`Image ${i + 1}`} style={{ width: "100%", height: 86, objectFit: "cover", display: "block" }} />
                    <div style={{ display: "flex", gap: 2, padding: 4, flexWrap: "wrap", alignItems: "center" }}>
                      {i === 0
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, padding: "0 4px" }}>Cover</span>
                        : <button type="button" className="sol-mini" onClick={() => makeCover(i)}>Set cover</button>}
                      <span style={{ flex: 1 }} />
                      <button type="button" className="sol-mini" aria-label={`Move image ${i + 1} left`} disabled={i === 0} onClick={() => moveImage(i, -1)}>◀</button>
                      <button type="button" className="sol-mini" aria-label={`Move image ${i + 1} right`} disabled={i === form.images.length - 1} onClick={() => moveImage(i, 1)}>▶</button>
                      <button type="button" className="sol-mini danger" aria-label={`Remove image ${i + 1}`} onClick={() => removeImage(i)}>✕</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {form.images.length < MAX_IMAGES && (
              <input type="file" accept={IMAGE_TYPES.join(",")} multiple aria-label="Add images" style={{ fontSize: 13 }}
                onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
            )}
            <span style={hint}>JPG, PNG or WebP. Resized to 1920px and compressed before upload, max 5 MB each.</span>
          </div>

          {/* Video */}
          <div>
            <span style={label}>Video (optional)</span>
            <div role="radiogroup" aria-label="Video source" style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {[["upload", "Upload a file"], ["url", "Paste a link"]].map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={videoMode === k} className={`sol-pill ${videoMode === k ? "on" : ""}`} onClick={() => setVideoMode(k)}>{l}</button>
              ))}
            </div>
            {videoMode === "upload" ? (
              <>
                {form.video && !embed && <video src={form.video} controls preload="metadata" style={{ width: "100%", maxHeight: 220, borderRadius: 10, background: "#000", marginBottom: 6 }} />}
                <input type="file" accept={VIDEO_TYPES.join(",")} aria-label="Upload video" style={{ fontSize: 13 }} onChange={(e) => { addVideo(e.target.files[0]); e.target.value = ""; }} />
                <span style={hint}>MP4 or WebM, up to 100 MB.</span>
              </>
            ) : (
              <>
                <input type="url" style={inp} placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" value={form.video} onChange={(e) => set("video", e.target.value)} aria-label="Video link" />
                <span style={hint}>{form.video && !embed ? "Not a YouTube or Vimeo link: it will play as a video file." : "YouTube and Vimeo links are embedded."}</span>
              </>
            )}
            {form.video && <button type="button" className="sol-mini danger" style={{ marginTop: 6 }} onClick={() => set("video", "")}>Remove video</button>}
          </div>

          {uploads.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-live="polite">
              {uploads.map((u) => (
                <div key={u.id} style={{ fontSize: 12, color: u.error ? C.danger : "#444" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.error || `Uploading ${u.name}`}</span>
                    {u.error ? <button type="button" className="sol-mini" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>Dismiss</button> : <span>{Math.round(u.progress * 100)}%</span>}
                  </div>
                  {!u.error && <Progress value={u.progress} />}
                </div>
              ))}
            </div>
          )}

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
        <Btn type="submit" disabled={saving || busy}>{saving ? "Saving…" : busy ? "Uploading…" : "Save"}</Btn>
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

const EDITOR_CSS = `
.sol-editor { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; }
.sol-pill { border: 1.5px solid #e5e5e5; background: #fff; color: #444; border-radius: 999px; padding: 6px 14px; font: 600 13px inherit; font-family: inherit; cursor: pointer; }
.sol-pill.on { background: ${C.accentSoft}; border-color: ${C.accentSoft}; color: ${C.accent}; }
.sol-mini { border: 0; background: #f3f4f6; color: #444; border-radius: 6px; padding: 3px 7px; font: 600 11px inherit; font-family: inherit; cursor: pointer; }
.sol-mini:disabled { opacity: .4; cursor: default; }
.sol-mini.danger { background: ${C.dangerSoft}; color: ${C.danger}; }
@media (max-width: 900px) { .sol-editor { grid-template-columns: 1fr; } }
`;
