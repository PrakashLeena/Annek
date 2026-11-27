/* Shared building blocks for the admin catalog/product editors. */
import { useState } from "react";
import { C, inp, toForm, fromForm } from "./helpers";

const label = { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5, display: "block" };

export function Btn({ kind = "primary", children, style, ...props }) {
  const kinds = {
    primary: { background: C.accent, color: "#fff" },
    soft: { background: C.accentSoft, color: C.accent },
    ghost: { background: "#f3f4f6", color: "#555" },
    danger: { background: C.dangerSoft, color: C.danger },
  };
  return (
    <button type="button" {...props} style={{
      border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600,
      cursor: props.disabled ? "not-allowed" : "pointer", opacity: props.disabled ? 0.6 : 1,
      fontFamily: "inherit", ...kinds[kind], ...style,
    }}>{children}</button>
  );
}

export function Notice({ notice }) {
  if (!notice) return null;
  const ok = notice.type === "success";
  return (
    <div role="status" style={{
      padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16,
      background: ok ? "#e8f5f0" : C.dangerSoft, color: ok ? "#276749" : "#991b1b",
    }}>{ok ? "✅ " : "❌ "}{notice.message}</div>
  );
}

export function Field({ f, value, onChange }) {
  const id = `fld-${f.key}`;
  const wide = f.wide || f.type === "textarea" || f.type === "list";
  let control;
  if (f.type === "textarea" || f.type === "list") {
    control = <textarea id={id} rows={f.rows || 3} style={{ ...inp, resize: "vertical" }} value={value} placeholder={f.placeholder}
      onChange={(e) => onChange(e.target.value)} />;
  } else if (f.type === "select") {
    control = (
      <select id={id} style={inp} value={value} onChange={(e) => onChange(e.target.value)}>
        {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    );
  } else if (f.type === "checkbox") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
        <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.accent }} />
        <label htmlFor={id} style={{ fontSize: 14, color: "#333", cursor: "pointer" }}>{f.label}</label>
      </div>
    );
  } else if (f.type === "image") {
    control = <input id={id} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" style={{ fontSize: 13 }}
      onChange={(e) => onChange(e.target.files[0] || null)} />;
  } else {
    control = <input id={id} type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"} min={f.type === "number" ? 0 : undefined}
      step={f.type === "number" ? "any" : undefined} style={inp} value={value} placeholder={f.placeholder} required={f.required}
      onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <div style={{ gridColumn: wide ? "1/-1" : "auto" }}>
      <label htmlFor={id} style={label}>{f.label}{f.required ? " *" : ""}</label>
      {control}
      {f.hint && <span style={{ fontSize: 11, color: C.muted, marginTop: 4, display: "block" }}>{f.hint}</span>}
    </div>
  );
}

/** Generic create/edit form. `onSave(payload, file)` must return a promise. */
export function EntityForm({ title, fields, initial, onSave, onCancel, children }) {
  const [form, setForm] = useState(() => toForm(fields, initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const imageField = fields.find((f) => f.type === "image");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await onSave(fromForm(fields, form), imageField ? form[imageField.key] : null);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ background: "#f8f7ff", border: "1.5px solid #e0dcff", borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: C.text }}>{title}</h3>
      {error && <Notice notice={{ type: "error", message: error }} />}
      <div className="admin-form-grid">
        {fields.map((f) => (
          <Field key={f.key} f={f} value={form[f.key]} onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))} />
        ))}
      </div>
      {children && children(form, setForm)}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
        <Btn kind="ghost" onClick={onCancel} disabled={saving}>Cancel</Btn>
      </div>
    </form>
  );
}

export function Card({ children, hidden, style }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: `1.5px solid ${hidden ? "#ffdede" : C.border}`,
      padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", ...style,
    }}>{children}</div>
  );
}

export function HiddenBadge() {
  return <span style={{ fontSize: 11, background: C.dangerSoft, color: C.danger, padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Hidden</span>;
}

