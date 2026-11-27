/* "Customize this for your business" — one per /solutions/:category page.
   Posts to /api/inquiries, which emails info@annek.tech with reply-to set to the customer. */
import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL || "/api";
const FALLBACK = "info@annek.tech";
const NEW = "Something new";
const BUDGETS = ["Under $500", "$500 to $1,000", "$1,000 to $3,000", "$3,000 or more", "Not sure yet"];
const TIMELINES = ["As soon as possible", "Within a month", "1 to 3 months", "Flexible"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY = { name: "", email: "", phone: "", company: "", message: "", budget: "", timeline: "", website: "" };

export default function InquiryForm({ category, label, solutions, preset }) {
  const [form, setForm] = useState(EMPTY);
  const [solution, setSolution] = useState(NEW);
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");
  const msgRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // "Customize this" in the detail view preselects that solution.
  useEffect(() => {
    if (!preset) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSolution(preset.title);
    setState((s) => (s === "sent" ? "idle" : s));
    const t = setTimeout(() => msgRef.current?.focus({ preventScroll: true }), 600);
    return () => clearTimeout(t);
  }, [preset]);

  const options = [...new Set([...(solutions || []).map((s) => s.title), ...(preset?.title ? [preset.title] : [])])];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return setError("Please fill in your name, email and how you want it customized."), setState("error");
    if (!EMAIL.test(form.email.trim())) return setError("Please enter a valid email address."), setState("error");
    setState("sending"); setError("");
    try {
      const res = await fetch(`${API}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category, solution }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "We could not send your request.");
      setState("sent");
      setForm(EMPTY);
    } catch (err) {
      setError(err.message && err.message !== "Failed to fetch" ? err.message : "We could not reach the server.");
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="inq-done card" role="status">
        <b>Thanks, your request is on its way.</b>
        <span>We will reply within 24 hours. You can also email us at <a href={`mailto:${FALLBACK}`}>{FALLBACK}</a>.</span>
        <button type="button" className="link-btn" onClick={() => setState("idle")}>Send another request</button>
      </div>
    );
  }

  return (
    <form className="inq card" onSubmit={submit} noValidate aria-describedby={error ? "inq-error" : undefined}>
      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div className="inq-hp" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label>
      </div>
      <div className="form-row">
        <label className="field">Name<input className="input" name="name" autoComplete="name" required value={form.name} onChange={set("name")} /></label>
        <label className="field">Email<input className="input" name="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} /></label>
      </div>
      <div className="form-row">
        <label className="field"><span>Phone <small>(optional)</small></span><input className="input" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} /></label>
        <label className="field"><span>Company <small>(optional)</small></span><input className="input" name="company" autoComplete="organization" value={form.company} onChange={set("company")} /></label>
      </div>
      <label className="field">Which solution?
        <select className="input" name="solution" value={solution} onChange={(e) => setSolution(e.target.value)}>
          {options.map((t) => <option key={t} value={t}>{t}</option>)}
          <option value={NEW}>{NEW}</option>
        </select>
      </label>
      <label className="field">How do you want it customized?
        <textarea ref={msgRef} className="input" name="message" rows={5} required maxLength={3000} value={form.message} onChange={set("message")}
          placeholder={`Your brand, features, languages, integrations… for your ${label.toLowerCase()}.`} />
      </label>
      <div className="form-row">
        <label className="field"><span>Budget range <small>(optional)</small></span>
          <select className="input" name="budget" value={form.budget} onChange={set("budget")}>
            <option value="">Choose…</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </label>
        <label className="field"><span>Timeline <small>(optional)</small></span>
          <select className="input" name="timeline" value={form.timeline} onChange={set("timeline")}>
            <option value="">Choose…</option>{TIMELINES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
      </div>
      {state === "error" && (
        <p id="inq-error" className="inq-err" role="alert">
          {error.replace(` Please email us at ${FALLBACK}.`, "")} You can also email us at <a href={`mailto:${FALLBACK}`}>{FALLBACK}</a>.
        </p>
      )}
      <button type="submit" className="btn btn-orange btn-lg" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send request"}</button>
    </form>
  );
}
