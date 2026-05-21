import { useState, useEffect, useRef } from "react";
import logoImg from "./images/logo.png";
import businessImg from "./images/bussines.jpg";
import ecommerceImg from "./images/ecommerce.jpg";
import portfolioImg from "./images/portfolio.png";
import bookingImg from "./images/booking.jpg";
import { auth, signInWithGoogle, logOut, onAuthStateChanged } from "./firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

/* ─── Intersection Observer Hook ─── */
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const FadeUp = ({ children, delay = 0, className = "" }) => {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
};

/* ─── Nav Data ─── */
const serviceDropdownItems = [
  { label: "Portfolio Sites", icon: "🎨" },
  { label: "E-Commerce", icon: "🛒" },
  { label: "Online Store", icon: "🏪" },
  { label: "Booking Site", icon: "📅" },
  { label: "Education Websites", icon: "🎓" },
  { label: "Associations", icon: "🤝" },
  { label: "Clubs Sites", icon: "⭐" },
];

const navLinks = [
  { label: "Services", href: "#services", hasDropdown: true },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Pricing", href: "#pricing" },
  { label: "About Us", href: "#about" },
  { label: "Contact Us", href: "#contact" },
];

/* ─── Site Data ─── */
const features = [
  { icon: "✦", title: "Requirement-Based Order", desc: "Submit your website requirements and get a fully custom-built site tailored to your brand and goals.", bg: "#eef0ff" },
  { icon: "◈", title: "Expert Designers & Devs", desc: "Our team of skilled professionals brings your vision to life with pixel-perfect precision.", bg: "#e8f5f0" },
  { icon: "⬡", title: "100+ Premium Templates", desc: "Choose from a wide range of professionally crafted templates as your starting point.", bg: "#fff3e8" },
  { icon: "◎", title: "SEO & Performance Ready", desc: "Every site we deliver is optimised for search engines and blazing-fast load times.", bg: "#f0eeff" },
];



const testimonials = [
  { quote: "Annek built our studio website exactly as we imagined it. The process was seamless from requirement to delivery.", name: "Mirella Chen", role: "Ceramic Studio Owner", initials: "MC", color: "#ff6b35", rating: 5 },
  { quote: "We doubled our online bookings within a month. The integrated booking features are incredibly powerful.", name: "James Okafor", role: "Pilates & Yoga Studio", initials: "JO", color: "#5c6ef8", rating: 5 },
  { quote: "Finally a service that doesn't feel limiting. I described my vision and Annek made it a reality.", name: "Sara Mancal", role: "Hair Studio Founder", initials: "SM", color: "#2a9d8f", rating: 5 },
];

const faqs = [
  "How do I place a website order with Annek?",
  "Can I use my own domain name?",
  "How long does it take to build my website?",
  "What types of websites does Annek build?",
  "Does my website include hosting and maintenance?",
];

const faqAnswers = [
  "Simply fill out our order form, describe your requirements in detail — industry, design preferences, features needed — and our team will get back to you within 24 hours with a quote and timeline.",
  "Absolutely. We can connect your existing domain or help you register a new one as part of the order process. Domain setup is included in all our packages.",
  "Most standard websites are delivered within 72 hours. More complex projects such as e-commerce stores or custom web apps may take 5–10 business days. You'll receive a clear timeline with your quote.",
  "We build all types: business websites, portfolios, e-commerce stores, landing pages, booking sites, blogs, and custom web applications. Just describe what you need!",
  "Yes. All websites are hosted on fast, secure servers. We also offer ongoing maintenance plans to keep your site updated, secure, and performing at its best.",
];

const plans = [
  {
    name: "Starter", price: "$499", period: "one-time",
    tagline: "Perfect for small businesses getting online.", highlight: false,
    features: ["Up to 5 pages", "Mobile-responsive design", "Contact form", "Basic SEO setup", "1 round of revisions", "7-day delivery"],
  },
  {
    name: "Growth", price: "$1,199", period: "one-time",
    tagline: "For businesses that need more power.", highlight: true, badge: "Most Popular",
    features: ["Up to 15 pages", "Custom design (no templates)", "Blog or CMS integration", "Advanced SEO + sitemap", "Google Analytics setup", "3 rounds of revisions", "5-day delivery", "1 month free support"],
  },
  {
    name: "Premium", price: "$2,999", period: "one-time",
    tagline: "Full-featured sites with custom functionality.", highlight: false,
    features: ["Unlimited pages", "E-commerce / bookings", "Payment gateway integration", "Custom animations & UI", "Performance optimisation", "Unlimited revisions", "Priority 72-hr delivery", "3 months free support"],
  },
];

const categoryImageMap = {
  "Booking Site": bookingImg, "E-Commerce": ecommerceImg, "Portfolio": portfolioImg,
  "Business Site": businessImg, "Corporate": businessImg, "Restaurant": ecommerceImg,
  "Education": portfolioImg, "Club": portfolioImg,
};

/* ─── Order Form Data ─── */
const pageOptions = ["Home", "About", "Services", "Contact", "Gallery", "Blog", "FAQ"];
const featureOptions = [
  "Contact Form", "WhatsApp Chat", "Booking System", "Payment Gateway",
  "eCommerce", "User Login & Sign Up", "Blog", "Multi Language",
  "Admin Dashboard", "SEO Setup (appear in Google searches)", "Analytics",
];
const maintenanceOptions = ["Ongoing Support", "Monthly Updates", "Security Backups", "Content Changes"];

/* ─── Shared Styles ─── */
const lbl = { display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 };
const inp = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: "1.5px solid #e5e5e5", fontSize: 14, color: "#1a1a1a",
  outline: "none", fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s", background: "#fafafa", boxSizing: "border-box",
};

/* ─── Checkbox Pill ─── */
function CheckPill({ label, checked, onChange }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
      padding: "9px 16px", borderRadius: 12,
      border: checked ? "2px solid #5c4ef8" : "1.5px solid #e5e5e5",
      background: checked ? "#eef0ff" : "#fff",
      fontSize: 14, fontWeight: 500, transition: "all 0.2s", userSelect: "none",
    }}>
      <input type="checkbox" style={{ accentColor: "#5c4ef8", width: 15, height: 15 }}
        checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
      padding: "10px 14px", borderRadius: 10,
      border: checked ? "2px solid #5c4ef8" : "1.5px solid #e5e5e5",
      background: checked ? "#eef0ff" : "#fafafa",
      fontSize: 14, transition: "all 0.2s", userSelect: "none",
    }}>
      <input type="checkbox" style={{ accentColor: "#5c4ef8", width: 15, height: 15 }}
        checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function YesNoBtn({ yes, no, val, setVal }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
      {[{ lbl: yes || "Yes", v: true }, { lbl: no || "No", v: false }].map(({ lbl: l, v }) => (
        <button key={l} type="button" onClick={() => setVal(v)} style={{
          flex: 1, padding: "10px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500,
          cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
          border: val === v ? "2px solid #5c4ef8" : "1.5px solid #e5e5e5",
          background: val === v ? "#eef0ff" : "#fafafa",
          color: val === v ? "#5c4ef8" : "#555",
        }}>{l}</button>
      ))}
    </div>
  );
}

/* ─── Upload Box ─── */
function UploadBox({ label, id, accept, multiple, val, setter }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <label htmlFor={id} style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        border: "2px dashed #c8c8f8", borderRadius: 12, padding: "18px 20px",
        cursor: "pointer", background: "#fafafe", gap: 4, transition: "border-color 0.2s",
      }}>
        <input type="file" id={id} accept={accept} multiple={multiple} style={{ display: "none" }}
          onChange={e => setter(e.target.files)} />
        <span style={{ fontSize: 22 }}>📁</span>
        <span style={{ fontSize: 13, color: val && val.length ? "#5c4ef8" : "#999" }}>
          {val && val.length ? `${val.length} file(s) selected` : "Click to browse"}
        </span>
        <span style={{ fontSize: 11, color: "#ccc" }}>or drag & drop here</span>
      </label>
    </div>
  );
}

/* ─── Pricing Note Banner ─── */
function PricingNote() {
  return (
    <div style={{
      background: "#fffbea", borderRadius: 12, padding: "12px 16px",
      fontSize: 13, color: "#92620a", border: "1px solid #ffe9a0",
      display: "flex", alignItems: "flex-start", gap: 8,
    }}>
      <span>💰</span>
      <div><strong>Pricing note:</strong> Selections here may affect your final quote. We'll include a full breakdown when we respond.</div>
    </div>
  );
}

/* ─── Feedback Widget ─── */
function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [fb, setFb] = useState({ name: "", email: "", message: "" });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!fb.message || !rating) { setError("Please add a rating and message."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fb.name, email: fb.email, rating, message: fb.message }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* Floating Button */}
      <button onClick={() => setOpen(o => !o)} title="Give feedback" style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 998,
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg, #5c4ef8, #7c3aed)",
        border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(92,78,248,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, transition: "transform 0.2s, box-shadow 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Feedback Panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 997,
          width: 320, background: "#fff", borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: "1px solid #eee",
          padding: "24px 24px 20px",
          animation: "dropIn 0.2s ease",
        }}>
          {!done ? (
            <>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0e0e0e" }}>Share your feedback</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#999" }}>We'd love to hear what you think!</p>

              {/* Stars */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                    style={{ fontSize: 26, cursor: "pointer", color: s <= (hover || rating) ? "#f59e0b" : "#ddd", transition: "color 0.15s" }}>
                    ★
                  </span>
                ))}
              </div>

              {/* Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input style={{ ...inp, fontSize: 13 }} value={fb.name}
                  onChange={e => setFb(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your name (optional)" />
                <input style={{ ...inp, fontSize: 13 }} type="email" value={fb.email}
                  onChange={e => setFb(f => ({ ...f, email: e.target.value }))}
                  placeholder="Email (optional)" />
                <textarea style={{ ...inp, fontSize: 13, minHeight: 80, resize: "none" }}
                  value={fb.message}
                  onChange={e => setFb(f => ({ ...f, message: e.target.value }))}
                  placeholder="Your feedback…" />
              </div>

              {error && <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 8 }}>{error}</p>}

              <button onClick={submit} disabled={loading} style={{
                marginTop: 14, width: "100%", padding: "11px",
                background: "linear-gradient(135deg, #5c4ef8, #7c3aed)",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, fontFamily: "inherit", transition: "opacity 0.2s",
              }}>
                {loading ? "Sending…" : "Send Feedback ✦"}
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🙏</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0e0e0e" }}>Thank you!</h3>
              <p style={{ fontSize: 14, color: "#666", margin: 0 }}>Your feedback has been received.</p>
              <button onClick={() => { setDone(false); setFb({ name:"",email:"",message:"" }); setRating(0); setOpen(false); }}
                style={{ marginTop: 14, fontSize: 13, color: "#5c4ef8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ─── Order Modal ─── */
function OrderModal({ onClose }) {
  const TOTAL = 7;
  const [step, setStep] = useState(1);

  // Step 1
  const [contact, setContact] = useState({ name: "", email: "", company: "" });
  // Step 2
  const [pages, setPages] = useState([]);
  const [otherPages, setOtherPages] = useState("");
  // Step 3
  const [logoFiles, setLogoFiles] = useState(null);
  const [imgFiles, setImgFiles] = useState(null);
  const [vidFiles, setVidFiles] = useState(null);
  const [textContent, setTextContent] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  // Step 4
  const [colour, setColour] = useState("");
  const [designStyle, setDesignStyle] = useState([]);
  const [fonts, setFonts] = useState("");
  const [theme, setTheme] = useState([]);
  const [likedSites, setLikedSites] = useState("");
  // Step 5
  const [features5, setFeatures5] = useState([]);
  const [otherFeatures, setOtherFeatures] = useState("");
  // Step 6
  const [buyDomain, setBuyDomain] = useState(null);
  const [hasDomain, setHasDomain] = useState(null);
  const [needHelp, setNeedHelp] = useState(null);
  const [timeline, setTimeline] = useState("");
  // Step 7
  const [maintenance, setMaintenance] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const toggle = (arr, setArr, v) =>
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError("");
    try {
      const orderData = {
        name: contact.name, email: contact.email, company: contact.company,
        pages, otherPages,
        textContent, productDetails, socialLinks, contactInfo,
        colour, designStyle, fonts, theme, likedSites,
        features: features5, otherFeatures,
        buyDomain, hasDomain, needHelp, timeline,
        maintenance,
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(orderData));
      if (logoFiles?.[0]) formData.append("logo", logoFiles[0]);
      if (imgFiles) Array.from(imgFiles).forEach(f => formData.append("images", f));
      if (vidFiles) Array.from(vidFiles).forEach(f => formData.append("videos", f));

      const res = await fetch(`${API}/orders`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Submission failed");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    "Contact Info", "Pages Needed", "Content Materials",
    "Design Preferences", "Features Required", "Domain & Hosting",
    "Maintenance & Support",
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(10,10,20,0.65)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 28, width: "100%", maxWidth: 640,
        maxHeight: "92vh", overflowY: "auto", padding: "40px 40px 36px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.22)", position: "relative",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 20, right: 20, background: "#f5f5f5",
          border: "none", borderRadius: "50%", width: 36, height: 36,
          fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", color: "#555", lineHeight: 1,
        }}>×</button>

        {!submitted ? (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#5c4ef8", fontWeight: 700, marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Website Order Form
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0e0e0e", letterSpacing: "-0.3px" }}>
                {stepTitles[step - 1]}
              </h2>
              <p style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>Step {step} of {TOTAL}</p>
            </div>

            {/* Progress */}
            <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
              {Array.from({ length: TOTAL }, (_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 4,
                  background: step > i ? "#5c4ef8" : "#eee",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>

            {/* ── STEP 1: Contact ── */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={lbl}>Full Name *</label>
                    <input style={inp} value={contact.name}
                      onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                      placeholder="Your name" />
                  </div>
                  <div>
                    <label style={lbl}>Email *</label>
                    <input style={inp} type="email" value={contact.email}
                      onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                      placeholder="you@email.com" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Company / Brand Name</label>
                  <input style={inp} value={contact.company}
                    onChange={e => setContact(c => ({ ...c, company: e.target.value }))}
                    placeholder="Your company (optional)" />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button className="btn-dark" style={{ padding: "12px 28px" }}
                    onClick={() => { if (contact.name && contact.email) setStep(2); }}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Pages Needed ── */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={lbl}>Select the pages you need:</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                    {pageOptions.map(p => (
                      <CheckPill key={p} label={p}
                        checked={pages.includes(p)}
                        onChange={() => toggle(pages, setPages, p)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Other (specify)</label>
                  <input style={inp} value={otherPages} onChange={e => setOtherPages(e.target.value)}
                    placeholder="e.g. Team, Events, Partners, Testimonials..." />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <button className="btn-outline" style={{ padding: "12px 24px" }} onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-dark" style={{ padding: "12px 28px" }} onClick={() => setStep(3)}>Next →</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Content Materials ── */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "#f0f0ff", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#5c4ef8", border: "1px solid #ddd8ff" }}>
                  📎 Upload your existing materials. You can skip anything you don't have yet.
                </div>
                <UploadBox label="Logo" id="up-logo" accept="image/*,.svg" val={logoFiles} setter={setLogoFiles} />
                <UploadBox label="Images / Photos" id="up-img" accept="image/*" multiple val={imgFiles} setter={setImgFiles} />
                <UploadBox label="Videos" id="up-vid" accept="video/*" multiple val={vidFiles} setter={setVidFiles} />
                {[
                  { label: "Text / Content", val: textContent, set: setTextContent, ph: "Any text, taglines, headings, descriptions you'd like on the site..." },
                  { label: "Product Details", val: productDetails, set: setProductDetails, ph: "Product names, descriptions, prices (for e-commerce)..." },
                  { label: "Social Media Links", val: socialLinks, set: setSocialLinks, ph: "Instagram, Facebook, LinkedIn, TikTok, YouTube URLs..." },
                  { label: "Contact Info", val: contactInfo, set: setContactInfo, ph: "Phone number, address, email, business hours..." },
                ].map(({ label, val, set, ph }) => (
                  <div key={label}>
                    <label style={lbl}>{label}</label>
                    <textarea style={{ ...inp, minHeight: 72, resize: "vertical" }}
                      value={val} onChange={e => set(e.target.value)} placeholder={ph} />
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <button className="btn-outline" style={{ padding: "12px 24px" }} onClick={() => setStep(2)}>← Back</button>
                  <button className="btn-dark" style={{ padding: "12px 28px" }} onClick={() => setStep(4)}>Next →</button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Design Preferences ── */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={lbl}>Preferred Colour(s)</label>
                  <input style={inp} value={colour} onChange={e => setColour(e.target.value)}
                    placeholder="e.g. Navy blue & gold, pastel tones, monochrome black & white..." />
                </div>
                <div>
                  <label style={lbl}>Design Style</label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                    {["Modern", "Simple / Minimal"].map(s => (
                      <CheckPill key={s} label={s}
                        checked={designStyle.includes(s)}
                        onChange={() => toggle(designStyle, setDesignStyle, s)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Fonts / Typography Styles</label>
                  <input style={inp} value={fonts} onChange={e => setFonts(e.target.value)}
                    placeholder="e.g. Clean sans-serif, elegant serif, bold display font..." />
                </div>
                <div>
                  <label style={lbl}>Theme Preference</label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                    {["🌙 Dark Theme", "☀️ Light Theme"].map(t => (
                      <CheckPill key={t} label={t}
                        checked={theme.includes(t)}
                        onChange={() => toggle(theme, setTheme, t)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Websites whose design you like / want to draw inspiration from</label>
                  <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }}
                    value={likedSites} onChange={e => setLikedSites(e.target.value)}
                    placeholder="Paste links or describe designs you love (e.g. apple.com, airbnb.com)..." />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <button className="btn-outline" style={{ padding: "12px 24px" }} onClick={() => setStep(3)}>← Back</button>
                  <button className="btn-dark" style={{ padding: "12px 28px" }} onClick={() => setStep(5)}>Next →</button>
                </div>
              </div>
            )}

            {/* ── STEP 5: Features Required ── */}
            {step === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <PricingNote />
                <div>
                  <label style={lbl}>Select the features you need:</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {featureOptions.map(f => (
                      <CheckRow key={f} label={f}
                        checked={features5.includes(f)}
                        onChange={() => toggle(features5, setFeatures5, f)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Other features</label>
                  <input style={inp} value={otherFeatures} onChange={e => setOtherFeatures(e.target.value)}
                    placeholder="Any other specific features or integrations you need..." />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <button className="btn-outline" style={{ padding: "12px 24px" }} onClick={() => setStep(4)}>← Back</button>
                  <button className="btn-dark" style={{ padding: "12px 28px" }} onClick={() => setStep(6)}>Next →</button>
                </div>
              </div>
            )}

            {/* ── STEP 6: Domain & Hosting ── */}
            {step === 6 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={lbl}>Do you want to purchase a domain or choose the free version?</label>
                  <YesNoBtn yes="Purchase Domain" no="Free Version" val={buyDomain} setVal={setBuyDomain} />
                </div>
                <div>
                  <label style={lbl}>Do you already have a domain?</label>
                  <YesNoBtn yes="Yes, I have one" no="No, I don't" val={hasDomain} setVal={setHasDomain} />
                </div>
                <div>
                  <label style={lbl}>Do you need help buying a domain?</label>
                  <YesNoBtn yes="Yes, please help" no="No, I'm fine" val={needHelp} setVal={setNeedHelp} />
                </div>
                <div>
                  <label style={lbl}>Timeline</label>
                  <input style={inp} value={timeline} onChange={e => setTimeline(e.target.value)}
                    placeholder="e.g. ASAP, within 2 weeks, by end of month, no rush..." />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <button className="btn-outline" style={{ padding: "12px 24px" }} onClick={() => setStep(5)}>← Back</button>
                  <button className="btn-dark" style={{ padding: "12px 28px" }} onClick={() => setStep(7)}>Next →</button>
                </div>
              </div>
            )}

            {/* ── STEP 7: Maintenance & Support ── */}
            {step === 7 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <PricingNote />
                <div>
                  <label style={lbl}>Select maintenance & support options:</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {maintenanceOptions.map(opt => (
                      <CheckRow key={opt} label={opt}
                        checked={maintenance.includes(opt)}
                        onChange={() => toggle(maintenance, setMaintenance, opt)} />
                    ))}
                  </div>
                </div>
                {submitError && (
                  <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#c0392b" }}>
                    ⚠️ {submitError}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <button className="btn-outline" style={{ padding: "12px 24px" }} onClick={() => setStep(6)}>← Back</button>
                  <button className="btn-lime" style={{ padding: "12px 32px", fontSize: 15, opacity: loading ? 0.7 : 1 }}
                    onClick={handleSubmit} disabled={loading}>
                    {loading ? "Submitting…" : "Submit Order ✦"}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 24, fontWeight: 600, color: "#0e0e0e", marginBottom: 12 }}>Order Received!</h3>
            <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 28px" }}>
              Thank you, <strong>{contact.name}</strong>! We've received your website order and will be in touch at{" "}
              <strong>{contact.email}</strong> within 24 hours with a detailed quote and timeline.
            </p>
            <button className="btn-dark" onClick={onClose} style={{ padding: "12px 32px" }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Contact Form Component ─── */
function ContactForm({ openOrder }) {
  const [cf, setCf] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!cf.name || !cf.email || !cf.message) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cf),
      });
      if (response.ok) {
        setSent(true);
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#0e0e0e" }}>Message sent!</div>
      <div style={{ fontSize: 14, color: "#888", marginTop: 6 }}>We'll get back to you within 24 hours.</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={lbl}>Name</label>
          <input style={inp} value={cf.name} onChange={e => setCf(c => ({ ...c, name: e.target.value }))} placeholder="Your name" disabled={submitting} />
        </div>
        <div>
          <label style={lbl}>Email</label>
          <input style={inp} type="email" value={cf.email} onChange={e => setCf(c => ({ ...c, email: e.target.value }))} placeholder="you@email.com" disabled={submitting} />
        </div>
      </div>
      <div>
        <label style={lbl}>Message</label>
        <textarea style={{ ...inp, minHeight: 120, resize: "vertical" }}
          value={cf.message} onChange={e => setCf(c => ({ ...c, message: e.target.value }))}
          placeholder="How can we help you?" disabled={submitting} />
      </div>
      {error && <div style={{ color: "#dc2626", fontSize: 14 }}>{error}</div>}
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-dark" style={{ flex: 1, opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
          onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Sending..." : "Send Message"}
        </button>
        <button className="btn-outline" style={{ flex: 1 }} onClick={openOrder} disabled={submitting}>
          Place an Order
        </button>
      </div>
    </div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [portfolioProjects, setPortfolioProjects] = useState([]);
  const [liveStats, setLiveStats] = useState({ orderCount: null, avgRating: null });
  const [liveReviews, setLiveReviews] = useState([]);
  const [settings, setSettings] = useState({ testimonialsTitle: "Trusted by hundreds of businesses" });

  const displayStats = [
    {
      value: liveStats?.orderCount !== null && liveStats?.orderCount !== undefined
        ? liveStats.orderCount.toLocaleString()
        : "0",
      label: "Websites delivered"
    },
    {
      value: liveStats?.avgRating !== null && liveStats?.avgRating !== undefined
        ? (Number(liveStats.avgRating) * 20).toFixed(0) + "%"
        : "98%",
      label: "Client satisfaction"
    },
    {
      value: "24/7",
      label: "Support & revisions"
    }
  ];

  const displayReviews = [
    ...(liveReviews || []).map(r => ({
      quote: r.message,
      name: r.name || "Anonymous Client",
      role: "Verified Client",
      initials: (r.name || "Anonymous").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
      color: ["#ff6b35", "#5c6ef8", "#2a9d8f", "#e76f51", "#264653", "#e9c46a"][(r.name || "Anonymous").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 6],
      rating: r.rating || 5
    })),
    ...testimonials
  ].slice(0, 6);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    const unsubAuth = onAuthStateChanged(auth, setUser);
    fetch(`${API}/portfolio`)
      .then(r => r.json())
      .then(data => setPortfolioProjects(data.filter(p => p.visible)))
      .catch(() => {});
    fetch(`${API}/stats`)
      .then(r => r.json())
      .then(data => setLiveStats(data))
      .catch(() => {});
    fetch(`${API}/feedback`)
      .then(r => r.json())
      .then(data => setLiveReviews(data))
      .catch(() => {});
    fetch(`${API}/settings`)
      .then(r => r.json())
      .then(data => {
        if (data && data.testimonialsTitle) {
          setSettings(data);
        }
      })
      .catch(() => {});
    return () => { window.removeEventListener("scroll", onScroll); unsubAuth(); };
  }, []);

  const openOrder = () => { setShowOrder(true); setMobileMenuOpen(false); setServicesOpen(false); };

  const scrollTo = (href) => {
    setMobileMenuOpen(false); setServicesOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif", color: "#1a1a1a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #fff; }

        .nav-link {
          font-size: 16px; color: #333; text-decoration: none;
          cursor: pointer; display: flex; align-items: center; gap: 4px;
          padding: 7px 12px; border-radius: 8px;
          transition: background 0.2s; font-weight: 500;
          background: none; border: none; font-family: inherit;
        }
        .nav-link:hover { background: rgba(0,0,0,0.05); }

        .btn-dark {
          background: #1a1a1a; color: #fff; border: none;
          padding: 14px 28px; border-radius: 100px;
          font-size: 15px; font-weight: 500; cursor: pointer;
          transition: transform 0.2s, background 0.2s; font-family: inherit;
        }
        .btn-dark:hover { background: #333; transform: scale(1.02); }

        .btn-outline {
          background: transparent; color: #1a1a1a;
          border: 1.5px solid #1a1a1a; padding: 14px 28px;
          border-radius: 100px; font-size: 15px; font-weight: 500;
          cursor: pointer; transition: transform 0.2s, background 0.2s; font-family: inherit;
        }
        .btn-outline:hover { background: rgba(0,0,0,0.05); transform: scale(1.02); }

        .btn-lime {
          background: #d4f74b; color: #1a1a1a; border: none;
          padding: 16px 36px; border-radius: 100px;
          font-size: 16px; font-weight: 600; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s; font-family: inherit;
        }
        .btn-lime:hover { transform: scale(1.04); box-shadow: 0 8px 24px rgba(212,247,75,0.5); }

        .btn-white {
          background: #fff; color: #1a1a1a; border: none;
          padding: 14px 28px; border-radius: 100px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s; font-family: inherit;
        }
        .btn-white:hover { transform: scale(1.03); box-shadow: 0 8px 28px rgba(0,0,0,0.15); }

        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.1); }

        .faq-item { border-bottom: 1px solid #e5e5e5; cursor: pointer; transition: background 0.2s; }
        .faq-item:hover { background: rgba(0,0,0,0.02); }

        .ticker-track { display: flex; gap: 48px; animation: ticker 28s linear infinite; white-space: nowrap; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .reviews-marquee-container {
          overflow: hidden;
          position: relative;
          width: 100%;
          padding: 16px 0 24px;
        }
        .reviews-marquee-container::before,
        .reviews-marquee-container::after {
          background: linear-gradient(to right, #fff, transparent);
          content: "";
          height: 100%;
          position: absolute;
          width: 120px;
          z-index: 2;
          pointer-events: none;
          top: 0;
        }
        .reviews-marquee-container::before {
          left: 0;
        }
        .reviews-marquee-container::after {
          right: 0;
          transform: rotateZ(180deg);
        }
        .reviews-marquee-track {
          display: flex;
          gap: 24px;
          width: max-content;
          animation: marquee-scroll 50s linear infinite;
        }
        .reviews-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        input:focus, textarea:focus, select:focus {
          border-color: #5c4ef8 !important; outline: none;
          box-shadow: 0 0 0 3px rgba(92,78,248,0.1);
        }

        .portfolio-card {
          border-radius: 24px; overflow: hidden; cursor: pointer;
          transition: transform 0.35s ease, box-shadow 0.35s ease; position: relative;
        }
        .portfolio-card:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 24px 64px rgba(0,0,0,0.14); }
        .portfolio-card:hover .portfolio-overlay { opacity: 1; }
        .portfolio-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.3s; border-radius: 24px;
        }

        .pricing-card {
          border-radius: 28px; padding: 40px 36px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative; overflow: hidden;
        }
        .pricing-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.12); }
        .pricing-card.highlight { background: #1a1a1a; color: #fff; }
        .pricing-card.highlight:hover { box-shadow: 0 24px 60px rgba(0,0,0,0.3); }

        .services-dropdown {
          position: absolute; top: calc(100% + 8px); left: 0;
          background: #fff; border-radius: 18px;
          box-shadow: 0 20px 56px rgba(0,0,0,0.13); border: 1px solid #eee;
          padding: 8px; min-width: 230px; z-index: 200;
          animation: dropIn 0.18s ease;
        }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .dropdown-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; text-align: left; padding: 10px 14px;
          border-radius: 10px; border: none; background: transparent;
          cursor: pointer; font-size: 15px; color: #333;
          font-family: inherit; transition: background 0.15s;
        }
        .dropdown-item:hover { background: #f5f5ff; color: #5c4ef8; }

        .mobile-menu {
          display: none; position: fixed; inset: 0; top: 70px; z-index: 90;
          background: rgba(255,255,255,0.98); backdrop-filter: blur(12px);
          padding: 24px 24px 40px; flex-direction: column; gap: 4;
          overflow-y: auto;
        }
        .mobile-menu.open { display: flex; }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .nav-links-desktop { display: none !important; }
          .hero-cards { flex-direction: column; align-items: center; }
          .portfolio-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .hamburger { display: flex !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── ORDER MODAL ── */}
      {showOrder && <OrderModal onClose={() => setShowOrder(false)} />}

      {/* ── MOBILE MENU ── */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#aaa", padding: "8px 12px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Services</div>
          {serviceDropdownItems.map(({ label, icon }) => (
            <button key={label} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              background: "none", border: "none", padding: "10px 12px",
              fontSize: 16, color: "#333", cursor: "pointer", fontFamily: "inherit",
              borderRadius: 10, textAlign: "left",
            }} onClick={() => { setMobileMenuOpen(false); openOrder(); }}>
              <span style={{ fontSize: 18 }}>{icon}</span> {label}
            </button>
          ))}
        </div>
        <div style={{ height: 1, background: "#eee", margin: "4px 0 8px" }} />
        {navLinks.filter(l => !l.hasDropdown).map(l => (
          <button key={l.label} className="nav-link"
            style={{ fontSize: 18, padding: "13px 12px", justifyContent: "flex-start" }}
            onClick={() => scrollTo(l.href)}>
            {l.label}
          </button>
        ))}
        <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />
        <button className="btn-dark" style={{ width: "100%", marginTop: 8 }} onClick={openOrder}>
          Order Now
        </button>
      </div>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(14px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
        transition: "all 0.3s", padding: "0 32px",
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", height: 70, gap: 4 }}>
          {/* Logo */}
          <div style={{ marginRight: 20, cursor: "pointer", display: "flex", alignItems: "center" }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img src={logoImg} alt="Annek" style={{ height: 42, width: "auto", objectFit: "contain" }} />
          </div>

          {/* Desktop Links */}
          <div className="nav-links-desktop" style={{ display: "flex", gap: 2, flex: 1, alignItems: "center" }}>
            {/* Services with Dropdown */}
            <div style={{ position: "relative" }}
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}>
              <button className="nav-link" onClick={() => scrollTo("#services")}>
                Services <span style={{ fontSize: 11, opacity: 0.45 }}>▾</span>
              </button>
              {servicesOpen && (
                <div className="services-dropdown">
                  {serviceDropdownItems.map(({ label, icon }) => (
                    <button key={label} className="dropdown-item" onClick={openOrder}>
                      <span style={{ fontSize: 17 }}>{icon}</span> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Other links */}
            {navLinks.filter(l => !l.hasDropdown).map(l => (
              <button key={l.label} className="nav-link" onClick={() => scrollTo(l.href)}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginLeft: "auto" }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {ADMIN_EMAILS.includes(user.email) && (
                  <a href="/admin" style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "#1a1a1a", color: "#d4f74b",
                    padding: "7px 16px", borderRadius: 100,
                    fontSize: 13, fontWeight: 700, textDecoration: "none",
                    border: "1.5px solid #333", transition: "background 0.2s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#333"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1a1a1a"}
                  >
                    ⚙ Admin Panel
                  </a>
                )}
                {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #5c4ef8" }} />}
                <span style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>{user.displayName?.split(" ")[0]}</span>
                <button className="nav-link" style={{ fontWeight: 500, fontSize: 14 }} onClick={logOut}>Log Out</button>
              </div>
            ) : (
              <button className="nav-link" style={{ fontWeight: 500 }} onClick={signInWithGoogle}>Log In</button>
            )}
            <button className="btn-dark" style={{ padding: "10px 24px", fontSize: 15 }} onClick={openOrder}>
              Order Now
            </button>
            {/* Hamburger */}
            <button className="hamburger" style={{
              display: "none", flexDirection: "column", gap: 5,
              background: "none", border: "none", cursor: "pointer", padding: 6,
            }} onClick={() => setMobileMenuOpen(o => !o)}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 22, height: 2, background: "#1a1a1a", borderRadius: 2, display: "block",
                  transform: mobileMenuOpen
                    ? i === 0 ? "rotate(45deg) translate(5px, 5px)"
                    : i === 2 ? "rotate(-45deg) translate(5px, -5px)" : "scaleX(0)"
                    : "none",
                  transition: "transform 0.3s, opacity 0.3s",
                  opacity: mobileMenuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="services" style={{
        background: "linear-gradient(160deg, #f0eeff 0%, #e8f0ff 40%, #f5f0ff 100%)",
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        paddingTop: 100, paddingBottom: 60, paddingLeft: 24, paddingRight: 24,
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(120,100,255,0.13) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 400, height: 400, background: "radial-gradient(circle, rgba(100,180,255,0.1) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.75)", border: "1px solid rgba(120,100,255,0.25)",
            borderRadius: 100, padding: "6px 18px", marginBottom: 32,
            fontSize: 13, color: "#5c4ef8", fontWeight: 600,
          }}>
            <span>✦</span> Custom websites built to your exact requirements
          </div>
        </div>

        <h1 style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(44px, 7vw, 88px)",
          fontWeight: 300, lineHeight: 1.06, letterSpacing: "-3px", maxWidth: 880,
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(32px)",
          transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s", color: "#0e0e0e",
        }}>
          Your website,{" "}<em style={{ fontStyle: "normal", fontWeight: 300 }}>built for you</em>
        </h1>

        <p style={{
          marginTop: 28, fontSize: 17, color: "#555", maxWidth: 540, lineHeight: 1.7,
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.8s ease 0.35s, transform 0.8s ease 0.35s",
        }}>
          Tell us your vision, requirements, and budget — Annek's expert team will design and
          deliver a stunning, high-performance website crafted just for you.
        </p>

        <div style={{
          marginTop: 40, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center",
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s",
        }}>
          <button className="btn-dark" style={{ fontSize: 16, padding: "16px 36px" }} onClick={openOrder}>
            Order Your Website
          </button>
          <button className="btn-outline" style={{ fontSize: 16, padding: "16px 36px" }} onClick={() => scrollTo("#portfolio")}>
            View Portfolio
          </button>
        </div>

        {/* Hero Cards */}
        <div className="hero-cards" style={{
          marginTop: 64, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(40px)",
          transition: "opacity 1s ease 0.7s, transform 1s ease 0.7s",
        }}>
          {[
            { label: "Business Site", img: businessImg, desc: "Corporate" },
            { label: "Portfolio", img: portfolioImg, desc: "Showcase" },
            { label: "E-Commerce", img: ecommerceImg, desc: "Online Store" },
            { label: "Booking Site", img: bookingImg, desc: "Appointments" },
          ].map((c, i) => (
            <div key={i} className="card-hover" style={{
              borderRadius: 20, width: 162, height: 150,
              position: "relative", overflow: "hidden", cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.5)", background: "#f0f0f0",
            }} onClick={openOrder}>
              <img src={c.img} alt={c.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
              <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.9)", borderRadius: 100, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#333" }}>{c.desc}</div>
              <div style={{ position: "absolute", bottom: 12, left: 12, fontSize: 12, fontWeight: 600, color: "#fff" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ background: "#1a1a1a", padding: "14px 0", overflow: "hidden" }}>
        <div className="ticker-track">
          {[...Array(2)].map((_, ri) => (
            <div key={ri} style={{ display: "flex", gap: 48 }}>
              {["Portfolio Sites", "E-Commerce", "Booking Sites", "Education Websites", "Online Stores", "Business Sites", "Club Websites", "Associations", "SEO Optimised", "72hr Delivery"].map((t, i) => (
                <span key={i} style={{ color: "#fff", fontSize: 14, fontWeight: 400, opacity: 0.8, letterSpacing: "0.05em" }}>
                  {t} <span style={{ color: "#d4f74b", margin: "0 12px" }}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div className="stats-grid" style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {displayStats.map((s, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 48, fontWeight: 300, letterSpacing: "-2px", color: "#0e0e0e" }}>{s.value}</div>
                <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>{s.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: "#f0eeff", borderRadius: "32px 32px 0 0", padding: "80px 24px", margin: "0 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <FadeUp>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(36px, 4vw, 58px)", fontWeight: 300, letterSpacing: "-2px", lineHeight: 1.1, color: "#0e0e0e" }}>
                Ordering your site is <em style={{ fontStyle: "italic" }}>simple & fast</em>
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p style={{ fontSize: 17, color: "#555", lineHeight: 1.65, marginBottom: 28 }}>
                Describe your requirements once. Our experts handle design, development, and delivery — so you can focus on your business.
              </p>
              <button className="btn-dark" onClick={openOrder}>Place Your Order</button>
            </FadeUp>
          </div>
          <div className="steps-grid" style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { step: "01", title: "Submit Requirements", desc: "Fill our simple order form with your business details, design preferences, and features needed.", icon: "📋" },
              { step: "02", title: "We Design & Build", desc: "Our team crafts your website with care, keeping you updated throughout the process.", icon: "⚙️" },
              { step: "03", title: "Review & Launch", desc: "Approve your site, request any revisions, and go live — all within your agreed timeline.", icon: "🚀" },
            ].map((s, i) => (
              <FadeUp key={i} delay={i * 0.15}>
                <div className="card-hover" style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)", borderRadius: 20, padding: "32px 28px", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#5c4ef8", letterSpacing: "0.1em", marginBottom: 8 }}>STEP {s.step}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e0e0e", marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 300, letterSpacing: "-2px", color: "#0e0e0e" }}>
                Everything you get with <em style={{ fontStyle: "italic" }}>every order</em>
              </h2>
            </div>
          </FadeUp>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {features.map((f, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="card-hover" style={{ background: f.bg, borderRadius: 24, padding: "40px 36px", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, color: "#0e0e0e" }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: "#666", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTFOLIO ── */}
      <section id="portfolio" style={{ padding: "80px 24px", background: "#fafafa" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 52, flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: "#5c4ef8", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>✦ Our Work</div>
                <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 300, letterSpacing: "-2px", color: "#0e0e0e", lineHeight: 1.1 }}>
                  Sites we've <em style={{ fontStyle: "italic" }}>built & shipped</em>
                </h2>
              </div>
              <button className="btn-outline" onClick={openOrder}>Start Your Project →</button>
            </div>
          </FadeUp>
          <div className="portfolio-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {portfolioProjects.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#bbb", padding: 40, fontSize: 15 }}>Loading portfolio…</div>
            ) : portfolioProjects.map((p, i) => (
              <FadeUp key={p._id || i} delay={i * 0.08}>
                <div className="portfolio-card" style={{ background: "#f0f0f0", position: "relative" }} onClick={openOrder}>
                  <div style={{ width: "100%", height: 200, overflow: "hidden", borderRadius: "24px 24px 0 0" }}>
                    <img src={p.imageUrl || categoryImageMap[p.category] || businessImg} alt={p.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                      onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
                      onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                  </div>
                  <div className="portfolio-overlay" style={{ borderRadius: "24px 24px 0 0", height: 200, bottom: "auto" }}>
                    <div style={{ background: "#fff", borderRadius: 100, padding: "10px 24px", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Order Similar ✦</div>
                  </div>
                  <div style={{ padding: "24px 28px 28px", background: "#fff", borderRadius: "0 0 24px 24px" }}>
                    <div style={{ display: "inline-block", background: "#f4f4f4", borderRadius: 100, padding: "4px 14px", fontSize: 11, fontWeight: 700, color: p.accent || "#5c4ef8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.category}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e0e0e", marginBottom: 8 }}>{p.title}</h3>
                    <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 16 }}>{p.desc}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(p.tags || []).map(tag => (
                        <span key={tag} style={{ background: "#f0f0f0", borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#555" }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section style={{ background: "#e8f5f0", borderRadius: 32, margin: "0 16px", padding: "80px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <FadeUp>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 300, letterSpacing: "-2px", lineHeight: 1.1, color: "#0e0e0e" }}>
                Solutions built for <em>every business</em>
              </h2>
            </FadeUp>
            <div>
              {[
                { title: "Grow with built-in SEO", desc: "Every Annek website ships with structured data, fast load times, and on-page SEO optimisation.", color: "#c8f0e0" },
                { title: "Sell products online", desc: "We integrate secure payment gateways, product catalogues, and cart systems tailored to your store.", color: "#ffd6c8" },
                { title: "Accept bookings 24/7", desc: "Automated appointment scheduling and calendar management built directly into your site.", color: "#e0d6ff" },
              ].map((item, i) => (
                <FadeUp key={i} delay={i * 0.15}>
                  <div style={{ background: item.color, borderRadius: 16, padding: "20px 24px", marginBottom: 12, cursor: "pointer", transition: "transform 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateX(6px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: "#0e0e0e", marginBottom: 4 }}>{item.title}</h4>
                    <p style={{ fontSize: 13, color: "#555" }}>{item.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 13, color: "#5c4ef8", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>✦ Transparent Pricing</div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(36px, 4vw, 58px)", fontWeight: 300, letterSpacing: "-2px", color: "#0e0e0e", marginBottom: 16 }}>
                Simple, <em style={{ fontStyle: "italic" }}>honest pricing</em>
              </h2>
              <p style={{ fontSize: 16, color: "#777", maxWidth: 500, margin: "0 auto" }}>No hidden fees. No subscriptions. Pay once, own it forever.</p>
            </div>
          </FadeUp>
          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
            {plans.map((plan, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className={`pricing-card ${plan.highlight ? "highlight" : ""}`}
                  style={{ background: plan.highlight ? "#1a1a1a" : "#f7f7f7", border: plan.highlight ? "none" : "1.5px solid #eee" }}>
                  {plan.badge && (
                    <div style={{ display: "inline-block", background: "#d4f74b", borderRadius: 100, padding: "5px 16px", fontSize: 11, fontWeight: 700, color: "#1a1a1a", marginBottom: 20, letterSpacing: "0.04em" }}>{plan.badge}</div>
                  )}
                  <div style={{ marginBottom: plan.badge ? 0 : 20 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: plan.highlight ? "#fff" : "#0e0e0e", marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ fontSize: 11, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#999", marginBottom: 24, lineHeight: 1.5 }}>{plan.tagline}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 32 }}>
                    <span style={{ fontSize: 48, fontWeight: 300, letterSpacing: "-2px", color: plan.highlight ? "#fff" : "#0e0e0e", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#aaa" }}>{plan.period}</span>
                  </div>
                  <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,0.1)" : "#e8e8e8", marginBottom: 28 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
                    {plan.features.map((f, fi) => (
                      <div key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ fontSize: 13, color: plan.highlight ? "#d4f74b" : "#5c4ef8", flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.8)" : "#555", lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button className={plan.highlight ? "btn-lime" : "btn-dark"} style={{ width: "100%", padding: "14px", fontSize: 15 }} onClick={openOrder}>
                    Get Started →
                  </button>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.3}>
            <div style={{ marginTop: 40, textAlign: "center", background: "#f0eeff", borderRadius: 20, padding: "24px 32px" }}>
              <span style={{ fontSize: 15, color: "#555" }}>
                Need something custom?{" "}
                <button className="nav-link" style={{ display: "inline", color: "#5c4ef8", fontWeight: 600, padding: "0 4px" }} onClick={openOrder}>
                  Tell us your requirements
                </button>{" "}
                and we'll send you a tailored quote within 24 hours.
              </span>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "80px 0", background: "#fff", overflow: "hidden" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <FadeUp>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(32px, 3.5vw, 50px)", fontWeight: 300, letterSpacing: "-1.5px", textAlign: "center", marginBottom: 52, color: "#0e0e0e" }}>
              {(() => {
                const rawTitle = settings.testimonialsTitle || "Trusted by hundreds of businesses";
                const realCount = liveStats?.orderCount !== null && liveStats?.orderCount !== undefined
                  ? liveStats.orderCount
                  : 0;
                if (rawTitle.includes("{count}")) {
                  return rawTitle.replace("{count}", realCount.toLocaleString());
                }
                return rawTitle
                  .replace("500+", realCount.toLocaleString())
                  .replace("hundreds", realCount.toLocaleString());
              })()}
            </h2>
          </FadeUp>
        </div>
        <div className="reviews-marquee-container">
          <div className="reviews-marquee-track">
            {(() => {
              let marqueeReviews = [...displayReviews];
              while (marqueeReviews.length > 0 && marqueeReviews.length < 12) {
                marqueeReviews = [...marqueeReviews, ...displayReviews];
              }
              const finalMarquee = [...marqueeReviews, ...marqueeReviews];
              return finalMarquee.map((t, i) => (
                <div key={i} className="card-hover" style={{
                  background: "#fafafa", border: "1px solid #eee", borderRadius: 24,
                  padding: "32px 28px", display: "flex", flexDirection: "column",
                  justifyContent: "space-between", height: 220, width: 350, boxSizing: "border-box",
                  flexShrink: 0
                }}>
                  <div>
                    {t.rating && (
                      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                        {[...Array(5)].map((_, starIdx) => (
                          <span key={starIdx} style={{ color: starIdx < t.rating ? "#f59e0b" : "#ddd", fontSize: 16 }}>★</span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: "#333", marginBottom: 20, fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      "{t.quote}"
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                      {t.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0e0e0e" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: "#fff", padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeUp>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(32px, 3.5vw, 50px)", fontWeight: 300, letterSpacing: "-1.5px", marginBottom: 44, color: "#0e0e0e" }}>
              Frequently asked questions
            </h2>
          </FadeUp>
          {faqs.map((q, i) => (
            <FadeUp key={i} delay={i * 0.07}>
              <div className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: "24px 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 17, fontWeight: 400, color: "#0e0e0e", paddingRight: 16 }}>{q}</span>
                  <span style={{ fontSize: 22, color: "#666", flexShrink: 0, transform: openFaq === i ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.3s", display: "inline-block", lineHeight: 1 }}>+</span>
                </div>
                {openFaq === i && (
                  <p style={{ marginTop: 16, fontSize: 15, color: "#666", lineHeight: 1.7, maxWidth: 680 }}>{faqAnswers[i]}</p>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── ABOUT US ── */}
      <section id="about" style={{ background: "#f9f9fb", padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <FadeUp>
              <div>
                <div style={{ fontSize: 13, color: "#5c4ef8", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>About Us</div>
                <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 300, letterSpacing: "-1.5px", color: "#0e0e0e", marginBottom: 24 }}>
                  We build websites that <em style={{ fontStyle: "italic" }}>work for you</em>
                </h2>
                <p style={{ fontSize: 16, color: "#555", lineHeight: 1.8, marginBottom: 20 }}>
                  Annek is a website-ordering platform where businesses and individuals commission fully custom-built websites — without the hassle of hiring freelancers or navigating complex agency contracts.
                </p>
                <p style={{ fontSize: 16, color: "#555", lineHeight: 1.8, marginBottom: 32 }}>
                  Founded with a simple mission — make professional web design accessible to everyone — our team of expert designers and developers has delivered over 1,200 websites across 40+ industries worldwide.
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[
                    { val: "1,200+", lab: "Sites Delivered", bg: "#eef0ff", col: "#5c4ef8" },
                    { val: "40+", lab: "Industries Served", bg: "#e8f5f0", col: "#2a9d8f" },
                    { val: "98%", lab: "Client Satisfaction", bg: "#fff3e8", col: "#f57f17" },
                  ].map(({ val, lab, bg, col }) => (
                    <div key={lab} style={{ background: bg, borderRadius: 16, padding: "16px 24px", textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-1px", color: col }}>{val}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{lab}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { icon: "🎯", title: "Our Mission", desc: "To make professional web design accessible to every business — regardless of size or technical know-how." },
                  { icon: "💡", title: "Our Approach", desc: "We listen first. Every site we build starts with a thorough understanding of your goals, your audience, and your brand." },
                  { icon: "🚀", title: "Our Promise", desc: "Fast delivery, unlimited revisions, and ongoing support. We're not done until you're thrilled with the result." },
                ].map((v, i) => (
                  <div key={i} className="card-hover" style={{ background: "#fff", borderRadius: 20, padding: "24px 28px", border: "1px solid #eee", display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{v.icon}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#0e0e0e", marginBottom: 6 }}>{v.title}</div>
                      <div style={{ fontSize: 14, color: "#777", lineHeight: 1.65 }}>{v.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── CONTACT US ── */}
      <section id="contact" style={{ background: "#fff", padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 13, color: "#5c4ef8", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Contact Us</div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 300, letterSpacing: "-1.5px" }}>
                Get in touch
              </h2>
              <p style={{ fontSize: 16, color: "#888", marginTop: 16, maxWidth: 440, margin: "16px auto 0" }}>
                Have questions? We'd love to hear from you. Send us a message and we'll respond within 24 hours.
              </p>
            </div>
          </FadeUp>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56 }}>
            <FadeUp>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {[
                  {
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5c4ef8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    ),
                    label: "Email",
                    value: "annek.websitebuild.official@gmail.com",
                    sub: "We reply within 24 hours",
                    href: "mailto:annek.websitebuild.official@gmail.com"
                  },
                  {
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#5c4ef8">
                        <path d="M12.031 0C5.393 0 .012 5.382.012 12.018c0 2.12.553 4.183 1.602 5.992L0 24l6.135-1.61c1.748.953 3.714 1.458 5.89 1.458 6.637 0 12.018-5.383 12.018-12.02C24.043 5.382 18.667 0 12.031 0zm0 22.006c-1.8 0-3.56-.48-5.112-1.392l-.367-.218-3.799.995.995-3.69-.239-.379a9.986 9.986 0 0 1-1.529-5.3c0-5.503 4.48-9.983 9.99-9.983 2.668 0 5.176 1.04 7.059 2.925a9.92 9.92 0 0 1 2.924 7.064c.005 5.508-4.475 9.98-9.97 9.98zm5.289-7.212c-.29-.145-1.716-.848-1.983-.945-.266-.097-.46-.145-.653.145-.193.29-.747.945-.916 1.138-.169.193-.338.217-.628.072-.29-.145-1.226-.452-2.336-1.442-.864-.77-1.448-1.72-1.617-2.01-.169-.29-.018-.447.127-.591.13-.13.29-.338.435-.507.145-.169.193-.29.29-.483.097-.193.048-.362-.024-.507-.072-.145-.653-1.573-.895-2.153-.235-.565-.473-.488-.65-.497-.168-.008-.362-.008-.555-.008-.193 0-.507.072-.773.362-.266.29-.723 1.014-.723 2.472s1.05 2.872 1.196 3.065c.145.193 2.062 3.148 4.996 4.413.698.302 1.243.482 1.668.617.702.222 1.341.19 1.846.115.56-.084 1.716-.7 1.958-1.376.242-.676.242-1.255.169-1.376-.073-.12-.266-.193-.556-.338z" />
                      </svg>
                    ),
                    label: "WhatsApp",
                    value: "+94701269689",
                    sub: "Mon–Fri, 9am – 6pm",
                    href: "https://wa.me/94701269689"
                  },
                  {
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5c4ef8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    ),
                    label: "Website",
                    value: "www.annek.tech",
                    sub: "Browse our full portfolio",
                    href: "https://www.annek.tech"
                  },
                  {
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5c4ef8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    ),
                    label: "Location",
                    value: "Global Remote Team",
                    sub: "Serving clients worldwide"
                  }
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "#eef0ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {c.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#bbb", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{c.label}</div>
                      <div style={{ marginBottom: 2 }}>
                        {c.href ? (
                          <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                            style={{ fontSize: 16, fontWeight: 600, color: "#0e0e0e", textDecoration: "none", transition: "color 0.2s", display: "inline-block" }}
                            onMouseEnter={e => e.target.style.color = "#5c4ef8"}
                            onMouseLeave={e => e.target.style.color = "#0e0e0e"}>
                            {c.value}
                          </a>
                        ) : (
                          <span style={{ fontSize: 16, fontWeight: 600, color: "#0e0e0e" }}>{c.value}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#999" }}>{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
            <FadeUp delay={0.15}>
              <ContactForm openOrder={openOrder} />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#1a5c44", padding: "100px 24px", marginTop: 0, textAlign: "center" }}>
        <FadeUp>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, fontWeight: 600 }}>
            Ready to get started?
          </p>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(36px, 4.5vw, 64px)", fontWeight: 300, letterSpacing: "-2px", color: "#fff", marginBottom: 16 }}>
            Order your website today
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
            Unlimited revisions · Expert support
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-lime" style={{ fontSize: 17, padding: "18px 48px" }} onClick={openOrder}>
              Start Your Order ✦
            </button>
            <button className="btn-white" style={{ fontSize: 16 }} onClick={() => scrollTo("#pricing")}>
              View Pricing
            </button>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#111", padding: "56px 32px 40px", color: "#888" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <img src={logoImg} alt="Annek" style={{ height: 36, width: "auto", objectFit: "contain", marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, maxWidth: 240 }}>
                Custom websites built to order. Tell us your vision and we'll bring it to life.
              </p>
            </div>
            {[
              { title: "Services", links: ["Portfolio Sites", "E-Commerce", "Booking Sites", "Education Websites", "Clubs & Associations"] },
              { title: "Company", links: ["About Us", "How It Works", "Portfolio", "Pricing"] },
              { title: "Support", links: ["Contact Us", "FAQ", "Privacy Policy", "Terms"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <a key={l} style={{ fontSize: 13, color: "#666", textDecoration: "none", cursor: "pointer", transition: "color 0.2s" }}
                      onMouseEnter={e => e.target.style.color = "#fff"}
                      onMouseLeave={e => e.target.style.color = "#666"}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: "#222", marginBottom: 28 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13 }}>© 2026 Annek. All rights reserved.</div>
            <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
              {["Privacy", "Terms", "Contact"].map(l => (
                <a key={l} style={{ color: "#555", textDecoration: "none", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "#fff"}
                  onMouseLeave={e => e.target.style.color = "#555"}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── ADMIN SHORTCUT (only for admin) ── */}
      {user && ADMIN_EMAILS.includes(user.email) && (
        <a href="/admin" title="Go to Admin Panel" style={{
          position: "fixed", bottom: 28, left: 28, zIndex: 998,
          background: "#1a1a1a", color: "#d4f74b",
          padding: "10px 18px", borderRadius: 100,
          fontSize: 13, fontWeight: 700, textDecoration: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", gap: 6,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)"; }}
        >
          ⚙ Admin Panel
        </a>
      )}

      {/* ── WHATSAPP BUTTON ── */}
      <a href="https://wa.me/94701269689" target="_blank" rel="noopener noreferrer"
        title="Chat on WhatsApp"
        style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 998,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #25d366, #128c7e)",
          boxShadow: "0 8px 24px rgba(37,211,102,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {/* WhatsApp SVG icon */}
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.504L4 29l7.697-1.807A12.94 12.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="#fff"/>
          <path d="M22.003 19.44c-.32-.16-1.89-.932-2.183-1.04-.293-.107-.507-.16-.72.16-.214.32-.828 1.04-1.015 1.254-.187.213-.373.24-.694.08-.32-.16-1.352-.499-2.574-1.588-.952-.85-1.594-1.899-1.781-2.22-.187-.32-.02-.493.14-.652.144-.143.32-.373.48-.56.16-.186.213-.32.32-.533.107-.214.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.26-.624-.524-.54-.72-.55l-.614-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.666s1.147 3.093 1.307 3.307c.16.213 2.254 3.44 5.46 4.826.764.33 1.36.527 1.824.674.766.244 1.464.21 2.016.127.615-.092 1.89-.773 2.156-1.52.267-.746.267-1.386.187-1.52-.08-.133-.293-.213-.614-.373z" fill="#25d366"/>
        </svg>
      </a>

      {/* ── FEEDBACK WIDGET ── */}
      <FeedbackWidget />
    </div>
  );
}
