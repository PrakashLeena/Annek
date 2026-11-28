/* Image list, video and upload progress fields plus small controls, shared by
   Admin › Solutions and Admin › Portfolio. Uploading itself: mediaUpload.js. */
import { useState } from "react";
import { C, inp } from "./helpers";
import { cld, videoEmbed } from "../utils/media";
import { IMAGE_TYPES, VIDEO_TYPES, hint, label } from "./mediaUpload";

/* ── Fields ────────────────────────────────────────────────── */

/** Ordered image list: the first is the cover. */
export function ImagesField({ images, onChange, max, media, onError, what = "item" }) {
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (files) => {
    onError(media.addImages(files, max - images.length, (url) => onChange((cur) => (cur.length >= max ? cur : [...cur, url]))));
  };
  return (
    <div>
      <span style={label}>Images ({images.length}/{max}). The first one is the cover.</span>
      {images.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {images.map((src, i) => (
            <li key={src} style={{ background: "#fff", border: `1.5px solid ${i === 0 ? C.accent : C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <img src={cld(src, 300)} alt={`Image ${i + 1}`} style={{ width: "100%", height: 86, objectFit: "cover", display: "block" }} />
              <div style={{ display: "flex", gap: 2, padding: 4, flexWrap: "wrap", alignItems: "center" }}>
                {i === 0
                  ? <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, padding: "0 4px" }}>Cover</span>
                  : <button type="button" className="sol-mini" onClick={() => onChange([images[i], ...images.filter((_, k) => k !== i)])}>Set cover</button>}
                <span style={{ flex: 1 }} />
                <button type="button" className="sol-mini" aria-label={`Move image ${i + 1} left`} disabled={i === 0} onClick={() => move(i, -1)}>◀</button>
                <button type="button" className="sol-mini" aria-label={`Move image ${i + 1} right`} disabled={i === images.length - 1} onClick={() => move(i, 1)}>▶</button>
                <button type="button" className="sol-mini danger" aria-label={`Remove image ${i + 1}`} onClick={() => onChange(images.filter((_, k) => k !== i))}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {images.length < max && (
        <input type="file" accept={IMAGE_TYPES.join(",")} multiple aria-label="Add images" style={{ fontSize: 13 }}
          onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      )}
      <span style={hint}>JPG, PNG or WebP. Resized to 1920px and compressed before upload, max 5 MB each. Up to {max} per {what}.</span>
    </div>
  );
}

/** Uploaded video file or a YouTube / Vimeo link. */
export function VideoField({ value, onChange, media }) {
  const [mode, setMode] = useState(() => (value && !value.includes("res.cloudinary.com") ? "url" : "upload"));
  const embed = videoEmbed(value);
  return (
    <div>
      <span style={label}>Video (optional)</span>
      <div role="radiogroup" aria-label="Video source" style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[["upload", "Upload a file"], ["url", "Paste a link"]].map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={mode === k} className={`sol-pill ${mode === k ? "on" : ""}`} onClick={() => setMode(k)}>{l}</button>
        ))}
      </div>
      {mode === "upload" ? (
        <>
          {value && !embed && <video src={value} controls preload="metadata" style={{ width: "100%", maxHeight: 220, borderRadius: 10, background: "#000", marginBottom: 6 }} />}
          <input type="file" accept={VIDEO_TYPES.join(",")} aria-label="Upload video" style={{ fontSize: 13 }} onChange={(e) => { media.addVideo(e.target.files[0], onChange); e.target.value = ""; }} />
          <span style={hint}>MP4 or WebM, up to 100 MB.</span>
        </>
      ) : (
        <>
          <input type="url" style={inp} placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Video link" />
          <span style={hint}>{value && !embed ? "Not a YouTube or Vimeo link: it will play as a video file." : "YouTube and Vimeo links are embedded."}</span>
        </>
      )}
      {value && <button type="button" className="sol-mini danger" style={{ marginTop: 6 }} onClick={() => onChange("")}>Remove video</button>}
    </div>
  );
}

export function UploadStatus({ media }) {
  if (!media.uploads.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-live="polite">
      {media.uploads.map((u) => (
        <div key={u.id} style={{ fontSize: 12, color: u.error ? C.danger : "#444" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.error || `Uploading ${u.name}`}</span>
            {u.error ? <button type="button" className="sol-mini" onClick={() => media.dismiss(u.id)}>Dismiss</button> : <span>{Math.round(u.progress * 100)}%</span>}
          </div>
          {!u.error && <Progress value={u.progress} />}
        </div>
      ))}
    </div>
  );
}

/* ── Small controls ────────────────────────────────────────── */

export function Counter({ value, max }) {
  const n = value.length;
  return <span style={{ fontSize: 11, color: n > max ? C.danger : C.muted, fontWeight: 600 }} aria-live="polite">{n}/{max}</span>;
}

export function Toggle({ checked, onChange, label: text, disabled }) {
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
