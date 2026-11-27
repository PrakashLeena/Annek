/* Non-component helpers shared by the admin editors. */

export const C = {
  accent: "#B8460B",
  accentSoft: "#FFF1E8",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  border: "#eee",
  text: "#0e0e0e",
  muted: "#888",
};

export const inp = {
  width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e5e5",
  fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", background: "#fafafa",
};

/** Turns a stored document into form state (lists → newline text, refs → id strings). */
export function toForm(fields, doc = {}) {
  const out = {};
  for (const f of fields) {
    const v = f.key.split(".").reduce((o, k) => (o == null ? o : o[k]), doc);
    if (f.type === "list") out[f.key] = Array.isArray(v) ? v.join("\n") : "";
    else if (f.type === "checkbox") out[f.key] = v === undefined ? f.default ?? false : !!v;
    else if (f.type === "number") out[f.key] = v ?? f.default ?? 0;
    else if (f.type === "image") out[f.key] = null; // File to upload
    else out[f.key] = v == null ? f.default ?? "" : String(v);
  }
  return out;
}

/** Turns form state into an API payload (supports dotted keys like links.web). */
export function fromForm(fields, form) {
  const out = {};
  for (const f of fields) {
    if (f.type === "image") continue;
    let v = form[f.key];
    if (f.type === "list") v = String(v || "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (f.type === "number") v = v === "" ? 0 : Number(v);
    const parts = f.key.split(".");
    let o = out;
    parts.slice(0, -1).forEach((p) => { o[p] = o[p] || {}; o = o[p]; });
    o[parts[parts.length - 1]] = v;
  }
  return out;
}

export function money(n, currency = "USD") {
  const v = Number(n) || 0;
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: v % 1 ? 2 : 0 }).format(v); }
  catch { return `${currency} ${v}`; }
}

/** Builds a request body: multipart when an image is attached, JSON otherwise. */
export function payload(data, file) {
  if (!file) return data;
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  fd.append("image", file);
  return fd;
}
