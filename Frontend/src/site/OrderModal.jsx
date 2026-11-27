/* Order form — 6 steps. Posts multipart to /api/orders (same fields the admin panel reads). */
import { useEffect, useRef, useState } from "react";
import logoImg from "../images/annek-logo.webp";
import { IconClose, IconUpload, IconCheck } from "./icons";

const API = import.meta.env.VITE_API_URL || "/api";

const STEPS = ["Your details", "Your project", "Content & files", "Design style", "Domain & timeline", "Maintenance & review"];
const TITLES = [
  "Let's start with you",
  "Tell us about your project",
  "Share what you already have",
  "How should it look?",
  "Domain and timeline",
  "Ongoing care & review",
];
const PLATFORMS = ["Android", "iPhone", "Web browser", "Windows PC", "Not sure yet"];
const SCREENS = ["Home", "About", "Services / Products", "Gallery", "Blog", "FAQ", "Contact", "Login / Account"];
const FEATURES = [
  "Online payments", "Admin dashboard", "User login & sign up", "Booking system", "Push notifications",
  "WhatsApp chat", "Multilingual", "Blog / news", "Product catalogue", "SEO (Google search)", "Analytics", "Contact form",
];
const STYLES = ["Modern", "Minimal", "Bold", "Elegant", "Playful"];
const THEMES = ["Light", "Dark", "Both"];
const TIMELINES = ["As soon as possible", "Within 2 weeks", "Within a month", "Flexible"];
const MAINTENANCE = ["Hosting & uptime", "Security updates", "Backups", "Content changes", "Feature updates", "Priority support"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useToggleList() {
  const [list, setList] = useState([]);
  const toggle = (v) => setList((l) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]));
  return [list, toggle];
}

function Choices({ options, value, onToggle, single = false, label }) {
  return (
    <div role="group" aria-label={label} className="choices">
      {options.map((o) => (
        <button key={o} type="button" className="choice" aria-pressed={single ? value === o : value.includes(o)} onClick={() => onToggle(o)}>{o}</button>
      ))}
    </div>
  );
}

function Checks({ options, value, onToggle }) {
  return (
    <div className="opt-grid">
      {options.map((o) => (
        <label key={o} className="opt"><input type="checkbox" checked={value.includes(o)} onChange={() => onToggle(o)} />{o}</label>
      ))}
    </div>
  );
}

function YesNo({ label, yes, no, value, onChange }) {
  return (
    <div>
      <div className="group-label">{label}</div>
      <div className="choices">
        <button type="button" className="choice" aria-pressed={value === true} onClick={() => onChange(true)}>{yes}</button>
        <button type="button" className="choice" aria-pressed={value === false} onClick={() => onChange(false)}>{no}</button>
      </div>
    </div>
  );
}

function Upload({ id, label, accept, multiple, files, onChange }) {
  const count = files ? files.length : 0;
  return (
    <label htmlFor={id} className="upload">
      <input id={id} type="file" accept={accept} multiple={multiple} onChange={(e) => onChange(e.target.files)} />
      <IconUpload />
      <span>{count ? `${label}: ${count} file${count > 1 ? "s" : ""} selected` : `${label}: click to choose`}</span>
    </label>
  );
}

export default function OrderModal({ preset = "", onClose }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const bodyRef = useRef(null);
  const closeRef = useRef(null);

  const [who, setWho] = useState({ name: "", email: "", phone: "", company: "" });
  const [platforms, togglePlatform] = useToggleList();
  const [pages, togglePage] = useToggleList();
  const [features, toggleFeature] = useToggleList();
  const [description, setDescription] = useState("");
  const [otherFeatures, setOtherFeatures] = useState("");
  const [logo, setLogo] = useState(null);
  const [images, setImages] = useState(null);
  const [videos, setVideos] = useState(null);
  const [text, setText] = useState({ textContent: "", productDetails: "", socialLinks: "", contactInfo: "" });
  const [colour, setColour] = useState("");
  const [designStyle, toggleStyle] = useToggleList();
  const [theme, setTheme] = useState("");
  const [fonts, setFonts] = useState("");
  const [likedSites, setLikedSites] = useState("");
  const [buyDomain, setBuyDomain] = useState(null);
  const [hasDomain, setHasDomain] = useState(null);
  const [needHelp, setNeedHelp] = useState(null);
  const [timeline, setTimeline] = useState("");
  const [maintenance, toggleMaintenance] = useToggleList();

  // Esc closes; lock page scroll; focus the dialog.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  useEffect(() => { bodyRef.current?.scrollTo(0, 0); }, [step]);

  const next = () => {
    if (step === 0) {
      if (!who.name.trim()) return setError("Please enter your name.");
      if (!EMAIL_RE.test(who.email.trim())) return setError("Please enter a valid email address.");
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    setSending(true); setError("");
    try {
      const data = {
        name: who.name.trim(), email: who.email.trim(), phone: who.phone.trim(), company: who.company.trim(),
        selectedPackage: preset, platforms, pages, description, features, otherFeatures,
        ...text, colour, designStyle, theme: theme ? [theme] : [], fonts, likedSites,
        buyDomain, hasDomain, needHelp, timeline, maintenance,
      };
      const fd = new FormData();
      fd.append("data", JSON.stringify(data));
      if (logo?.[0]) fd.append("logo", logo[0]);
      if (images) Array.from(images).forEach((f) => fd.append("images", f));
      if (videos) Array.from(videos).forEach((f) => fd.append("videos", f));
      const res = await fetch(`${API}/orders`, { method: "POST", body: fd });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Submission failed. Please try again.");
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const summary = [
    ["Name", who.name], ["Email", who.email], ["Phone", who.phone], ["Package", preset],
    ["Runs on", platforms.join(", ")], ["Features", features.join(", ")], ["Style", designStyle.join(", ")],
    ["Timeline", timeline], ["Maintenance", maintenance.join(", ")],
  ].filter(([, v]) => v);

  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
        <aside className="modal-side">
          <img src={logoImg} alt="Annek" width="65" height="30" />
          {preset && <div className="picked"><small>Selected</small><b>{preset}</b></div>}
          <ol className="step-list">
            {STEPS.map((s, i) => (
              <li key={s} className={done || i < step ? "done" : i === step ? "now" : ""} aria-current={i === step ? "step" : undefined}>
                <span className="num">{done || i < step ? "✓" : i + 1}</span>{s}
              </li>
            ))}
          </ol>
          <p className="modal-help">Questions? <a href="https://wa.me/94701269689" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></p>
        </aside>

        <div className="modal-main">
          <button ref={closeRef} type="button" className="modal-x" aria-label="Close order form" onClick={onClose}><IconClose size={18} /></button>

          {done ? (
            <div className="done-box">
              <span style={{ color: "var(--orange)" }}><IconCheck size={56} /></span>
              <h2 id="order-title">Order received</h2>
              <p>Thank you, <strong>{who.name}</strong>. We'll reply to <strong>{who.email}</strong> within 24 hours with a quote and timeline.</p>
              <button type="button" className="btn btn-ink" onClick={onClose}>Close</button>
            </div>
          ) : (
            <>
              <div className="modal-head">
                <small>Step {step + 1} of {STEPS.length}</small>
                <h2 id="order-title">{TITLES[step]}</h2>
                <div className="progress" aria-hidden="true"><div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
              </div>

              <div className="modal-body" ref={bodyRef}>
                {preset && <div className="picked picked-m"><small>Selected</small><b>{preset}</b></div>}
                {step === 0 && (
                  <>
                    <div className="form-row">
                      <label className="field">Full name *<input className="input" autoComplete="name" value={who.name} onChange={(e) => setWho((w) => ({ ...w, name: e.target.value }))} /></label>
                      <label className="field">Email *<input className="input" type="email" autoComplete="email" value={who.email} onChange={(e) => setWho((w) => ({ ...w, email: e.target.value }))} /></label>
                    </div>
                    <div className="form-row">
                      <label className="field">Phone / WhatsApp<input className="input" type="tel" autoComplete="tel" value={who.phone} onChange={(e) => setWho((w) => ({ ...w, phone: e.target.value }))} /></label>
                      <label className="field">Business / brand name<input className="input" autoComplete="organization" value={who.company} onChange={(e) => setWho((w) => ({ ...w, company: e.target.value }))} /></label>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div><div className="group-label">Where should it run?</div><Choices label="Platforms" options={PLATFORMS} value={platforms} onToggle={togglePlatform} /></div>
                    <label className="field">Describe your project<small>What does your business do, and what should the app or website help with?</small>
                      <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
                    <div><div className="group-label">Features you need</div><Checks options={FEATURES} value={features} onToggle={toggleFeature} /></div>
                    <label className="field">Other features<input className="input" value={otherFeatures} onChange={(e) => setOtherFeatures(e.target.value)} /></label>
                    <div><div className="group-label">Pages / screens</div><Choices label="Pages" options={SCREENS} value={pages} onToggle={togglePage} /></div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <p className="lead" style={{ fontSize: 15 }}>Upload anything you already have. You can skip this and send it later.</p>
                    <Upload id="up-logo" label="Logo" accept="image/*,.svg" files={logo} onChange={setLogo} />
                    <Upload id="up-img" label="Photos" accept="image/*" multiple files={images} onChange={setImages} />
                    <Upload id="up-vid" label="Videos" accept="video/*" multiple files={videos} onChange={setVideos} />
                    {[
                      ["textContent", "Text content", "Taglines, about text, service descriptions…"],
                      ["productDetails", "Products / services", "Names, descriptions and prices"],
                      ["socialLinks", "Social media links", "Facebook, Instagram, TikTok, YouTube…"],
                      ["contactInfo", "Contact details to show", "Phone, address, opening hours…"],
                    ].map(([k, l, ph]) => (
                      <label key={k} className="field">{l}<textarea className="input" rows={2} placeholder={ph} value={text[k]} onChange={(e) => setText((t) => ({ ...t, [k]: e.target.value }))} /></label>
                    ))}
                  </>
                )}

                {step === 3 && (
                  <>
                    <div><div className="group-label">Style</div><Choices label="Style" options={STYLES} value={designStyle} onToggle={toggleStyle} /></div>
                    <div><div className="group-label">Theme</div><Choices label="Theme" single options={THEMES} value={theme} onToggle={(t) => setTheme((cur) => (cur === t ? "" : t))} /></div>
                    <label className="field">Colours<input className="input" placeholder="e.g. navy and gold, your logo colours" value={colour} onChange={(e) => setColour(e.target.value)} /></label>
                    <label className="field">Fonts<input className="input" placeholder="e.g. clean and simple, elegant serif" value={fonts} onChange={(e) => setFonts(e.target.value)} /></label>
                    <label className="field">Apps or websites you like<textarea className="input" rows={2} placeholder="Links or names" value={likedSites} onChange={(e) => setLikedSites(e.target.value)} /></label>
                  </>
                )}

                {step === 4 && (
                  <>
                    <YesNo label="Do you already have a domain name?" yes="Yes, I have one" no="No" value={hasDomain} onChange={setHasDomain} />
                    <YesNo label="Domain choice" yes="Buy a custom domain" no="Use a free address" value={buyDomain} onChange={setBuyDomain} />
                    <YesNo label="Need help setting up the domain?" yes="Yes, please" no="No, I'm fine" value={needHelp} onChange={setNeedHelp} />
                    <div><div className="group-label">Timeline</div><Choices label="Timeline" single options={TIMELINES} value={timeline} onToggle={(t) => setTimeline((cur) => (cur === t ? "" : t))} /></div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <div><div className="group-label">Monthly maintenance: what should we take care of?</div><Checks options={MAINTENANCE} value={maintenance} onToggle={toggleMaintenance} /></div>
                    <div><div className="group-label">Review</div>
                      <dl className="summary">{summary.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                    </div>
                  </>
                )}
                {error && <p className="err" role="alert" style={{ color: "#B42318" }}>{error}</p>}
              </div>

              <div className="modal-foot">
                {step > 0 ? <button type="button" className="link-btn" style={{ color: "var(--muted)" }} onClick={back}>← Back</button> : <span />}
                {step < STEPS.length - 1
                  ? <button type="button" className="btn btn-ink" onClick={next}>Continue →</button>
                  : <button type="button" className="btn btn-orange" onClick={submit} disabled={sending}>{sending ? "Sending…" : "Submit order"}</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
