/* Admin › Portfolio — projects shown on /portfolio and their own pages /portfolio/<slug>.
   Photos and videos upload straight from the browser to Cloudinary (signed by the API). */
import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "../utils/adminApi";
import { C, inp } from "./helpers";
import { Btn, Card, Notice } from "./ui";
import { Counter, ImagesField, Toggle, UploadStatus, VideoField } from "./mediaFields";
import { EDITOR_CSS, HTTPS, hint, label, useMediaUploads } from "./mediaUpload";
import { WorkCard } from "../site/sections";
import { PROJECT_TYPES } from "../seo/pages";
import { slugify } from "../site/data";
import { cld } from "../utils/media";

const BASE = "/admin/portfolio";
const SITE = "https://annek.tech";
const MAX_IMAGES = 10;
const pageUrl = (slug) => `${SITE}/portfolio/${slug}`;
const coverOf = (d) => (d.images && d.images[0]) || d.imageUrl || "";

/* ── Small fields ──────────────────────────────────────────── */

function TagInput({ id, value, onChange, max = 20 }) {
  const [text, setText] = useState("");
  const add = (raw) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange([...new Set([...value, ...parts])].slice(0, max));
    setText("");
  };
  return (
    <div style={{ ...inp, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: 8 }}>
      {value.map((t) => (
        <span key={t} style={{ background: C.accentSoft, color: C.accent, borderRadius: 999, padding: "3px 6px 3px 10px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {t}
          <button type="button" className="sol-mini" style={{ background: "transparent", padding: "0 4px" }} aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>✕</button>
        </span>
      ))}
      <input id={id} value={text} placeholder={value.length ? "" : "React, Node.js, MongoDB"} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); }
          if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => add(text)}
        style={{ border: 0, outline: 0, background: "transparent", flex: "1 1 120px", fontSize: 14, fontFamily: "inherit", minWidth: 80 }} />
    </div>
  );
}

/** Debounced "is this link free?" check. */
function useSlugCheck(slug, id) {
  const [state, setState] = useState({ slug: "", free: true });
  useEffect(() => {
    if (!slug) return undefined;
    const t = setTimeout(() => {
      adminFetch(`${BASE}/slug-check?slug=${encodeURIComponent(slug)}${id ? `&id=${id}` : ""}`)
        .then((r) => setState(r)).catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [slug, id]);
  return state.slug === slug ? state.free : true;
}

/* ── Editor ────────────────────────────────────────────────── */

function ProjectEditor({ doc, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    title: doc?.title || "",
    category: doc?.category || "",
    type: doc?.type || "",
    slug: doc?.slug || "",
    summary: doc?.summary || doc?.desc || "",
    description: doc?.description || "",
    images: doc?.images?.length ? [...doc.images] : (doc?.imageUrl ? [doc.imageUrl] : []),
    video: doc?.video || "",
    liveUrl: doc?.liveUrl || "",
    techStack: doc?.techStack ? [...doc.techStack] : [],
    client: doc?.client || "",
    year: doc?.year ? String(doc.year) : "",
    accent: doc?.accent || "#F26A1B",
    published: doc ? doc.visible !== false : false,
  }));
  // New projects: the link follows the name until the admin edits it.
  const slugTouched = useRef(Boolean(doc));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const media = useMediaUploads(BASE);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: typeof v === "function" ? v(f[k]) : v }));
  const setTitle = (v) => setForm((f) => ({ ...f, title: v, slug: slugTouched.current ? f.slug : slugify(v) }));
  const slug = form.slug || slugify(form.title);
  const slugFree = useSlugCheck(form.title || form.slug ? slug : "", doc?._id);

  const cancel = () => { media.finish([]); onCancel(); };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError("Name is required.");
    if (!form.category.trim()) return setError("Category label is required.");
    if (form.summary.length > 155) return setError("Summary must be at most 155 characters.");
    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) return setError("The link may only use a to z, 0 to 9 and single hyphens.");
    for (const [k, v] of [["Live project link", form.liveUrl], ["Video link", form.video]]) {
      if (v && !HTTPS.test(v.trim())) return setError(`${k} must start with https://`);
    }
    if (form.year && !/^\d{4}$/.test(form.year)) return setError("Year must look like 2025.");
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(), category: form.category.trim(), type: form.type, slug: form.slug.trim(),
        summary: form.summary.trim(), description: form.description.trim(), images: form.images,
        video: form.video.trim(), liveUrl: form.liveUrl.trim(), techStack: form.techStack,
        client: form.client.trim(), year: form.year ? Number(form.year) : "", accent: form.accent, visible: form.published,
      };
      const saved = doc
        ? await adminFetch(`${BASE}/${doc._id}`, { method: "PATCH", body })
        : await adminFetch(BASE, { method: "POST", body });
      media.finish([...(saved.images || []), saved.imageUrl, saved.video]);
      onSaved(doc ? "Project updated." : "Project created.", saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const preview = { _id: "preview", slug, title: form.title || "Project name", type: form.type, category: form.category, summary: form.summary, imageUrl: form.images[0] || "" };

  return (
    <form onSubmit={submit} style={{ background: "#FFF8F3", border: "1.5px solid #FDE3D0", borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: C.text }}>{doc ? `Edit "${doc.title}"` : "New project"}</h3>
      {error && <Notice notice={{ type: "error", message: error }} />}
      <div className="sol-editor">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><label htmlFor="pf-title" style={label}>Name *</label><Counter value={form.title} max={120} /></div>
            <input id="pf-title" style={inp} value={form.title} maxLength={140} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="pf-slug" style={label}>Page link</label>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <span style={{ fontSize: 13, color: C.muted, padding: "0 6px 0 2px", whiteSpace: "nowrap" }}>annek.tech/portfolio/</span>
              <input id="pf-slug" style={inp} value={form.slug} placeholder={slugify(form.title)} maxLength={80}
                onChange={(e) => { slugTouched.current = true; set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
                onBlur={() => { if (form.slug) set("slug", slugify(form.slug)); }} />
            </div>
            <span style={{ ...hint, color: slugFree ? C.muted : C.danger }} aria-live="polite">
              {slugFree ? <>Final URL: <b>{pageUrl(slug)}</b>{doc && doc.slug && slug !== doc.slug ? ". The old link keeps working and redirects here." : ""}</> : `annek.tech/portfolio/${slug} is already used by another project. Choose another link.`}
            </span>
          </div>

          <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="pf-type" style={label}>Type (shown on the project page)</label>
              <select id="pf-type" style={inp} value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="">Not set</option>
                {Object.entries(PROJECT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pf-cat" style={label}>Category label *</label>
              <input id="pf-cat" style={inp} value={form.category} maxLength={60} placeholder="Education site" onChange={(e) => set("category", e.target.value)} required />
            </div>
            <div>
              <label htmlFor="pf-client" style={label}>Client (optional)</label>
              <input id="pf-client" style={inp} value={form.client} maxLength={120} onChange={(e) => set("client", e.target.value)} />
            </div>
            <div>
              <label htmlFor="pf-year" style={label}>Year (optional)</label>
              <input id="pf-year" style={inp} inputMode="numeric" value={form.year} maxLength={4} placeholder="2025" onChange={(e) => set("year", e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><label htmlFor="pf-summary" style={label}>Summary (card text and Google description)</label><Counter value={form.summary} max={155} /></div>
            <textarea id="pf-summary" rows={2} style={{ ...inp, resize: "vertical" }} value={form.summary} maxLength={175} onChange={(e) => set("summary", e.target.value)} />
          </div>
          <div>
            <label htmlFor="pf-desc" style={label}>Description (project page: the problem, what was built, the result)</label>
            <textarea id="pf-desc" rows={7} style={{ ...inp, resize: "vertical" }} value={form.description} maxLength={5000} onChange={(e) => set("description", e.target.value)} />
            <span style={hint}>Leave a blank line between paragraphs.</span>
          </div>
          <div>
            <label htmlFor="pf-tech" style={label}>Tech stack</label>
            <TagInput id="pf-tech" value={form.techStack} onChange={(v) => set("techStack", v)} />
            <span style={hint}>Press Enter or comma after each one.</span>
          </div>

          <ImagesField images={form.images} onChange={(v) => set("images", v)} max={MAX_IMAGES} media={media} onError={setError} what="project" />
          <VideoField value={form.video} onChange={(v) => set("video", v)} media={media} />
          <UploadStatus media={media} />

          <div>
            <label htmlFor="pf-live" style={label}>Live project link (optional)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input id="pf-live" type="url" style={inp} placeholder="https://client-site.example" value={form.liveUrl} onChange={(e) => set("liveUrl", e.target.value)} />
              <Btn kind="soft" disabled={!HTTPS.test(form.liveUrl.trim())} onClick={() => window.open(form.liveUrl.trim(), "_blank", "noopener")}>Test link</Btn>
            </div>
            <span style={hint}>Shows a "Visit live project" button that opens in a new tab. https links only.</span>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <Toggle checked={form.published} onChange={(v) => set("published", v)} label="Published (visible on the website)" />
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#333" }}>
              Card colour <input type="color" value={form.accent} onChange={(e) => set("accent", e.target.value)} style={{ width: 36, height: 28, border: "none", background: "none", cursor: "pointer" }} />
            </label>
          </div>
        </div>

        <div>
          <span style={label}>Card preview</span>
          <div style={{ maxWidth: 320, pointerEvents: "none" }} aria-hidden="true" inert>
            <WorkCard w={preview} eager tabIndex={-1} />
          </div>
          {!form.published && <span style={hint}>Draft: not visible on the website until published.</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Btn type="submit" disabled={saving || media.busy || !slugFree}>{saving ? "Saving…" : media.busy ? "Uploading…" : "Save"}</Btn>
        <Btn kind="ghost" onClick={cancel} disabled={saving}>Cancel</Btn>
      </div>
    </form>
  );
}

/* ── List ──────────────────────────────────────────────────── */

export default function PortfolioTab() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, doc = edit
  const [notice, setNotice] = useState(null);
  const [dragId, setDragId] = useState(null);

  const flash = (type, message) => { setNotice({ type, message }); if (type === "success") setTimeout(() => setNotice(null), 2500); };

  const load = useCallback(async () => {
    try { setItems(await adminFetch(BASE)); }
    catch (err) { setItems([]); flash("error", err.message); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const saved = async (message) => { setEditing(undefined); await load(); flash("success", message); };

  const togglePublished = async (it, visible) => {
    setItems((list) => list.map((x) => (x._id === it._id ? { ...x, visible } : x)));
    try { await adminFetch(`${BASE}/${it._id}`, { method: "PATCH", body: { visible } }); flash("success", visible ? "Published." : "Unpublished."); }
    catch (err) { flash("error", err.message); load(); }
  };

  const remove = async (it) => {
    if (!window.confirm(`Delete "${it.title}"? Its photos and video are deleted too. This cannot be undone.`)) return;
    try { await adminFetch(`${BASE}/${it._id}`, { method: "DELETE" }); await saved("Deleted, including its files."); }
    catch (err) { flash("error", err.message); }
  };

  const copy = async (slug) => {
    try { await navigator.clipboard.writeText(pageUrl(slug)); flash("success", "Link copied."); }
    catch { window.prompt("Copy this link:", pageUrl(slug)); }
  };

  const persistOrder = async (list) => {
    setItems(list);
    try { setItems(await adminFetch(`${BASE}/reorder`, { method: "POST", body: { ids: list.map((x) => x._id) } })); }
    catch (err) { flash("error", err.message); load(); }
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
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Portfolio {items && <span style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}>({items.length} projects)</span>}</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Projects on <a href="/portfolio" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>/portfolio</a>, each with its own page. Only published projects are visible. New pages appear in Google's sitemap after the next deploy.
          </p>
        </div>
        {editing === undefined && <Btn onClick={() => setEditing(null)}>+ Add project</Btn>}
      </div>

      <Notice notice={notice} />
      {editing !== undefined && <ProjectEditor key={editing?._id || "new"} doc={editing} onSaved={saved} onCancel={() => setEditing(undefined)} />}

      {items === null ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Loading projects…</div>
      ) : items.length === 0 ? (
        editing === undefined && <p style={{ color: "#aaa", textAlign: "center", padding: 30 }}>No projects yet.</p>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it, i) => {
            const cover = coverOf(it);
            return (
              <li key={it._id} draggable onDragStart={() => setDragId(it._id)} onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(it._id)} style={{ opacity: dragId === it._id ? 0.5 : 1 }}>
                <Card hidden={it.visible === false} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span title="Drag to reorder" aria-hidden="true" style={{ cursor: "grab", color: "#bbb", fontSize: 18, userSelect: "none" }}>⋮⋮</span>
                  {cover
                    ? <img src={cld(cover, 160)} alt="" loading="lazy" style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    : <div style={{ width: 72, height: 54, borderRadius: 8, background: C.accentSoft, flexShrink: 0 }} />}
                  <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[PROJECT_TYPES[it.type], it.category].filter(Boolean).join(" · ")}{it.liveUrl ? " · live link" : ""}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ color: C.muted }}>annek.tech/portfolio/</span><b>{it.slug}</b>
                      {!it.slugStored && <span style={{ color: C.muted }}> (saved on next edit)</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <Btn kind="ghost" onClick={() => copy(it.slug)}>Copy link</Btn>
                    <Btn kind="ghost" disabled={it.visible === false} title={it.visible === false ? "Publish it to open its page" : undefined}
                      onClick={() => window.open(`/portfolio/${it.slug}`, "_blank", "noopener")}>Open page</Btn>
                  </div>
                  <Toggle checked={it.visible !== false} onChange={(v) => togglePublished(it, v)} label="Published" />
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn kind="ghost" aria-label={`Move ${it.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</Btn>
                    <Btn kind="ghost" aria-label={`Move ${it.title} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</Btn>
                    <Btn kind="soft" onClick={() => { setEditing(it); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</Btn>
                    <Btn kind="danger" onClick={() => remove(it)}>Delete</Btn>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
