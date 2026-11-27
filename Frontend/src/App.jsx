import { useEffect, useRef, useState, useCallback, lazy, Suspense } from "react";
import "./site/site.css";
import logoImg from "./images/annek-logo.webp";
import { auth, signInWithGoogle, logOut, onAuthStateChanged } from "./firebase";
import SEOMetaTags from "./components/SEOMetaTags";
import Solutions from "./site/Solutions";
import Products from "./site/Products";
import FeedbackWidget from "./site/FeedbackWidget";
import Marquee from "./site/Marquee";
import { IconMenu, IconClose, IconMail, IconPin, IconWhatsApp } from "./site/icons";
import { money } from "./utils/format";

const OrderModal = lazy(() => import("./site/OrderModal"));

const API = import.meta.env.VITE_API_URL || "/api";
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

const STRIP = ["Ecommerce Apps", "Marketing Apps", "Web Applications", "Portfolio Sites", "Institute Platforms", "Inventory & POS", "Custom Software", "Monthly Maintenance"];

const STEPS = [
  ["Choose a package", "Pick a ready made template or tell us what you need."],
  ["We customise it", "Your brand, content and features, built in."],
  ["Launch", "We publish it to the web, Play Store, App Store or your PCs."],
  ["Monthly care", "Hosting, updates, backups and changes, every month."],
];

const FAQS = [
  ["What does a monthly maintenance plan cover?", "Hosting, security updates, backups, small content changes and support. Each package lists exactly what is included, and you can add more care any time."],
  ["Can you customise a template for my business?", "Yes. Every template is a starting point. We add your brand, content, features and integrations so it fits how your business works."],
  ["How long does delivery take?", "Standard websites take a few business days. Apps, web applications and custom software usually take one to four weeks depending on features. You get a clear timeline with your quote."],
  ["Do you build Android and iPhone apps?", "Yes. We build mobile apps for Android and iPhone and help you publish them on the Play Store and App Store."],
  ["Can I use my own domain?", "Absolutely. We can connect a domain you already own or help you register a new one."],
  ["How do I place an order?", "Choose a package or press “Start a project”, answer a few questions, and we reply within 24 hours with a quote and timeline."],
];

const SECTION_PAGE = { solutions: "services", products: "services", work: "portfolio", pricing: "pricing", contact: "contact" };

/* Fades sections in as they scroll into view. Re-scans when new content renders. */
function useReveal(deps) {
  useEffect(() => {
    let io = null;
    const start = () => {
      const els = document.querySelectorAll(".reveal:not(.in)");
      if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px" });
      els.forEach((el) => io.observe(el));
    };
    // Don't play entrance animations hidden behind the preloader: wait for it to finish.
    if (document.getElementById("annek-preloader")) {
      window.addEventListener("annek:preloader-done", start, { once: true });
    } else {
      start();
    }
    return () => { window.removeEventListener("annek:preloader-done", start); if (io) io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return setError("Please fill in all fields.");
    setSending(true); setError("");
    try {
      const res = await fetch(`${API}/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Failed to send message.");
      setSent(true);
    } catch (err) {
      setError(err.message || "Could not reach the server. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) return <div className="ok-msg" role="status"><b>Message sent</b><span style={{ color: "#C9C3BA" }}>We'll get back to you within 24 hours.</span></div>;
  return (
    <form className="dark-form" onSubmit={submit} noValidate>
      <div className="form-row">
        <label>Name<input autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></label>
        <label>Email<input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></label>
      </div>
      <label>Message<textarea rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} /></label>
      {error && <p className="err" role="alert">{error}</p>}
      <button type="submit" className="btn btn-orange btn-lg" disabled={sending}>{sending ? "Sending…" : "Send message"}</button>
    </form>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [order, setOrder] = useState(null); // null = closed, string = selected package
  const [settings, setSettings] = useState({});
  const [catalog, setCatalog] = useState(null);
  const [products, setProducts] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const unsub = onAuthStateChanged(auth, setUser);
    const get = (path, set, ok = (d) => d) =>
      fetch(`${API}${path}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && ok(d)) set(d); }).catch(() => {});
    get("/settings", setSettings);
    get("/catalog", setCatalog);
    get("/products", setProducts, Array.isArray);
    get("/portfolio", (d) => setPortfolio(d.filter((p) => p.visible !== false)), Array.isArray);
    get("/feedback", setReviews, Array.isArray);
    get("/stats", setStats);
    return () => { window.removeEventListener("scroll", onScroll); unsub(); };
  }, []);

  // Which section is on screen → page-level SEO tags.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setPage(SECTION_PAGE[e.target.id] || "home"); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["top", "solutions", "products", "work", "pricing", "about", "contact"].forEach((id) => {
      const el = document.getElementById(id); if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [catalog, products, portfolio]);

  useReveal([catalog, products, portfolio, reviews]);

  // Arriving at /#section (e.g. "All services" on a showcase page): scroll there once it has rendered.
  const hashDone = useRef(false);
  useEffect(() => {
    if (hashDone.current) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const el = id && document.getElementById(id);
    if (!id) { hashDone.current = true; return; }
    if (el) { hashDone.current = true; el.scrollIntoView(); }
  }, [catalog, products, portfolio]);

  const openOrder = useCallback((preset) => { setMenuOpen(false); setOrder(typeof preset === "string" ? preset : ""); }, []);
  const closeOrder = useCallback(() => setOrder(null), []);
  const go = (id) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };

  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || "").toLowerCase());
  const company = {
    email: settings.contactEmail || "annek.websitebuild.official@gmail.com",
    whatsapp: (settings.whatsappNumber || "94701269689").replace(/[^0-9]/g, ""),
    phone: settings.contactPhone || "+94 70 126 9689",
    address: settings.address || "Vankalai, Sri Lanka",
    area: settings.serviceArea || "Sri Lanka · Serving worldwide",
    tagline: settings.companyTagline || "Web apps, mobile apps and custom software that we build, customise and maintain for your business.",
    about: settings.aboutText || "Annek is a digital studio from Sri Lanka. We build mobile applications, web applications and custom software from proven templates, customise them for each business, and keep them running with affordable monthly maintenance.",
  };

  const featured = catalog?.packages?.find((p) => p.highlighted) || catalog?.packages?.[0];
  const categories = ["All", ...new Set(portfolio.map((p) => p.category).filter(Boolean))];
  const shownWork = filter === "All" ? portfolio : portfolio.filter((p) => p.category === filter);
  const websitePlans = [
    { name: "Starter", price: settings.starterPrice || "$75 to $80", items: ["Up to 5 pages", "Mobile responsive design", "Contact form", "Basic SEO setup"] },
    { name: "Growth", price: settings.growthPrice || "$100 to $120", hot: true, items: ["Up to 15 pages", "Custom design", "Blog or CMS", "Advanced SEO + analytics"] },
    { name: "Premium", price: settings.premiumPrice || "$150 to $170", items: ["Unlimited pages", "Ecommerce / bookings", "Payment gateway", "Custom animations"] },
  ];
  const shownReviews = reviews.slice(0, 6);
  const reviewTitle = (settings.testimonialsTitle || "What our clients say").replace("{count}", String(stats.orderCount ?? ""));
  const statItems = [
    portfolio.length > 0 && [portfolio.length, "Projects showcased"],
    stats.avgRating && [`${stats.avgRating}/5`, stats.reviewCount ? `Rating from ${stats.reviewCount} reviews` : "Average client rating"],
    stats.industryCount > 0 && [stats.industryCount, "Industries served"],
  ].filter(Boolean);

  const navItems = [
    ["solutions", "Solutions"],
    products.length > 0 && ["products", "Products"],
    portfolio.length > 0 && ["work", "Portfolio"],
    ["pricing", "Pricing"],
    ["about", "About"],
    ["contact", "Contact"],
  ].filter(Boolean);

  return (
    <>
      <SEOMetaTags page={page} overrides={settings} />
      <a href="#main" className="sr-only">Skip to content</a>

      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap nav-inner">
          <button type="button" className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Annek, back to top">
            <img src={logoImg} alt="Annek" width="82" height="38" fetchPriority="high" />
          </button>
          <nav className="nav-links" aria-label="Main">
            {navItems.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a>)}
          </nav>
          <div className="nav-right">
            {user ? (
              <div className="nav-user hide-sm">
                {isAdmin && <a href="/admin" className="btn btn-soft btn-sm">Admin</a>}
                {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
                <button type="button" className="link-btn" style={{ color: "var(--ink)", fontWeight: 500 }} onClick={logOut}>Log out</button>
              </div>
            ) : (
              <button type="button" className="link-btn hide-sm" style={{ color: "var(--ink)", fontWeight: 500, padding: "10px 8px" }} onClick={signInWithGoogle}>Log in</button>
            )}
            <button type="button" className="btn btn-ink btn-sm" onClick={() => openOrder("")}>Start a project</button>
            <button type="button" className="nav-burger" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((o) => !o)}>
              {menuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
            {navItems.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a>)}
            {isAdmin && <a href="/admin">Admin panel</a>}
            {user ? <button type="button" onClick={logOut}>Log out</button> : <button type="button" onClick={signInWithGoogle}>Log in</button>}
          </nav>
        )}
      </header>

      <main id="main">
        {/* HERO */}
        <section id="top" className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="pill"><span className="dot" />{company.area}</span>
              <h1>Mobile Apps, Web Apps, and Software <span>Built and Looked After</span></h1>
              <p className="lead">Pick a ready made solution. We customise it to your business, launch it, and keep it secure and up to date with a monthly maintenance plan.</p>
              <div className="hero-ctas">
                <button type="button" className="btn btn-orange btn-lg" onClick={() => go("solutions")}>Explore solutions</button>
                <button type="button" className="btn btn-line btn-lg" onClick={() => openOrder("")}>Tell us what you need</button>
              </div>
              <ul className="hero-ticks"><li>Mobile apps</li><li>Web applications</li><li>Custom software</li><li>Monthly care</li></ul>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-card" style={{ background: "#050505" }}>
                <img src="/intro/annek-intro-poster.jpg" alt="" width="1280" height="720" style={{ objectFit: "contain" }} />
              </div>
              <div className="hero-float">
                {featured ? (
                  <>
                    <small>Featured package</small>
                    <strong>{featured.name}</strong>
                    <span>{money(featured.setupPrice, featured.currency)} setup + {money(featured.monthlyFee, featured.currency)}/mo</span>
                  </>
                ) : (
                  <>
                    <small>Every package</small>
                    <strong>Built for you</strong>
                    <span>Customised, launched and maintained by Annek.</span>
                  </>
                )}
              </div>
              <div className="hero-tag">Maintained monthly</div>
            </div>
          </div>
        </section>

        <div className="strip" aria-hidden="true">
          <div className="strip-track">{[...STRIP, ...STRIP].map((t, i) => <span key={i}>{t}</span>)}</div>
        </div>

        <Solutions catalog={catalog} onOrder={openOrder} />

        {/* HOW IT WORKS */}
        <section className="section tint" aria-labelledby="how-title">
          <div className="wrap">
            <h2 className="h2 reveal" id="how-title" style={{ marginBottom: 48 }}>How it works</h2>
            <ol className="steps">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="reveal"><span className="n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3>{t}</h3><p>{d}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <Products products={products} onOrder={openOrder} />

        {/* PORTFOLIO */}
        {portfolio.length > 0 && (
          <section id="work" className="section tint" aria-labelledby="work-title">
            <div className="wrap">
              <div className="head-row reveal">
                <div><div className="eyebrow">Portfolio</div><h2 className="h2" id="work-title">Recent work</h2></div>
                {categories.length > 2 && (
                  <div className="filters" role="group" aria-label="Filter projects">
                    {categories.map((c) => <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>)}
                  </div>
                )}
              </div>
            </div>
            <Marquee label="Portfolio projects" items={shownWork} keyOf={(w) => w._id} renderItem={(w) => (
              <article className="work">
                <div className="work-img">
                  {w.imageUrl ? <img src={w.imageUrl} alt={`${w.title} website`} loading="lazy" decoding="async" width="600" height="450" /> : <span aria-hidden="true">{w.title?.[0]}</span>}
                </div>
                <span className="cat">{w.category}</span>
                <h3>{w.title}</h3>
                {w.desc && <p>{w.desc}</p>}
              </article>
            )} />
          </section>
        )}

        {/* WEBSITE PRICING */}
        <section id="pricing" className="section" aria-labelledby="pricing-title">
          <div className="wrap pricing">
            <div className="pricing-intro reveal">
              <div className="eyebrow" style={{ marginBottom: 0 }}>Website builds</div>
              <h2 className="h2" id="pricing-title">Just need a website?</h2>
              <p className="lead">One time builds with no hidden fees. Add a monthly maintenance plan any time.</p>
            </div>
            <div className="grid-3" style={{ gap: 16 }}>
              {websitePlans.map((p) => (
                <div key={p.name} className={`card web-plan reveal ${p.hot ? "hot" : ""}`}>
                  <b>{p.name}</b>
                  <div className="price">{p.price}</div>
                  <small className="meta">one time</small>
                  <ul className="ticks">{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
                  <button type="button" className={`btn btn-block btn-sm ${p.hot ? "btn-orange" : "btn-line"}`} onClick={() => openOrder(`Website: ${p.name}`)}>Get started</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        {shownReviews.length > 0 && (
          <section className="section tint" aria-labelledby="reviews-title">
            <div className="wrap">
              <h2 className="h2 reveal" id="reviews-title" style={{ marginBottom: 40 }}>{reviewTitle}</h2>
            </div>
            <Marquee label="Client ratings" reverse items={shownReviews} keyOf={(r) => r._id} renderItem={(r) => (
              <figure className="card review" style={{ margin: 0 }}>
                <div className="stars" role="img" aria-label={`${r.rating || 5} out of 5 stars`}>{"★".repeat(r.rating || 5)}</div>
                <blockquote>“{r.message}”</blockquote>
                <footer>{r.name || "Verified client"}</footer>
              </figure>
            )} />
          </section>
        )}

        {/* ABOUT + FAQ */}
        <section id="about" className="section" aria-labelledby="about-title">
          <div className="wrap about">
            <div className="about-copy reveal">
              <div className="eyebrow" style={{ marginBottom: 0 }}>About Annek</div>
              <h2 className="h2" id="about-title">A digital studio from Sri Lanka, building for businesses everywhere.</h2>
              <p className="lead" style={{ whiteSpace: "pre-line" }}>{company.about}</p>
              {statItems.length > 0 && (
                <div className="stats">{statItems.map(([v, l]) => <div key={l} className="stat"><b>{v}</b><span>{l}</span></div>)}</div>
              )}
            </div>
            <div className="faq reveal">
              <h3 className="sub-h" style={{ marginTop: 0 }}>Frequently asked questions</h3>
              {FAQS.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="section" style={{ paddingTop: 0 }} aria-labelledby="contact-title">
          <div className="wrap">
            <div className="contact reveal">
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h2 className="h2" id="contact-title">Let's build <span>your</span> next app.</h2>
                <p style={{ color: "#C9C3BA", lineHeight: 1.6 }}>Tell us about your idea. We reply within 24 hours.</p>
                <div className="contact-lines">
                  <a href={`mailto:${company.email}`}><IconMail size={18} />{company.email}</a>
                  <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener noreferrer"><IconWhatsApp size={18} />WhatsApp {company.phone}</a>
                  <span><IconPin size={18} />{company.address}</span>
                </div>
                <button type="button" className="btn btn-orange" style={{ alignSelf: "flex-start", marginTop: 8 }} onClick={() => openOrder("")}>Start a project</button>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
            <img src={logoImg} alt="Annek" width="73" height="34" loading="lazy" />
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{company.tagline}</p>
          </div>
          <nav aria-label="Footer">
            {navItems.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)}>{label}</button>)}
          </nav>
          <small>© {new Date().getFullYear()} Annek</small>
        </div>
      </footer>

      {isAdmin && <a href="/admin" className="fab-admin">Admin panel</a>}
      <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener noreferrer" className="fab fab-wa" aria-label="Chat on WhatsApp"><IconWhatsApp /></a>
      <FeedbackWidget />

      {order !== null && (
        <Suspense fallback={null}>
          <OrderModal preset={order} onClose={closeOrder} />
        </Suspense>
      )}
    </>
  );
}
