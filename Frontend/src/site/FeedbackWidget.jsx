import { useState } from "react";
import { IconChat, IconClose } from "./icons";

const API = import.meta.env.VITE_API_URL || "/api";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [rating, setRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!rating || !form.message.trim()) return setError("Please add a rating and a message.");
    setSending(true); setError("");
    try {
      const res = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => { setOpen(false); setDone(false); setForm({ name: "", email: "", message: "" }); setRating(0); };

  return (
    <>
      <button type="button" className="fab fab-fb" aria-label={open ? "Close feedback" : "Give feedback"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? <IconClose size={22} /> : <IconChat size={22} />}
      </button>
      {open && (
        <div className="fb-panel" role="dialog" aria-label="Feedback">
          {done ? (
            <>
              <h3>Thank you!</h3>
              <p className="lead" style={{ fontSize: 14 }}>Your feedback has been received.</p>
              <button type="button" className="btn btn-ink btn-sm" onClick={reset}>Close</button>
            </>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h3>Share your feedback</h3>
              <div role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={rating === s} aria-label={`${s} star${s > 1 ? "s" : ""}`}
                    className={`star-btn ${s <= rating ? "on" : ""}`} onClick={() => setRating(s)}>★</button>
                ))}
              </div>
              <label className="sr-only" htmlFor="fb-name">Name</label>
              <input id="fb-name" className="input" placeholder="Name (optional)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <label className="sr-only" htmlFor="fb-email">Email</label>
              <input id="fb-email" className="input" type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <label className="sr-only" htmlFor="fb-msg">Message</label>
              <textarea id="fb-msg" className="input" rows={3} placeholder="Your feedback…" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
              {error && <p role="alert" style={{ color: "#B42318", fontSize: 13 }}>{error}</p>}
              <button type="submit" className="btn btn-orange btn-sm" disabled={sending}>{sending ? "Sending…" : "Send feedback"}</button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
