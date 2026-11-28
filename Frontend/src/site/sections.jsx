/* Page sections. Most come in a short form (home page) and a full form (their own page). */
import { useState } from "react";
import { Link } from "react-router-dom";
import Marquee from "./Marquee";
import GoogleRatingBadge from "./GoogleRatingBadge";
import { GoogleSummary, GoogleReviewCard, WriteReviewButton, Stars } from "./GoogleReviews";
import { IconMail, IconPin, IconWhatsApp, IconPhone, IconGlobe, IconCode } from "./icons";
import { parseGoogleRating } from "../utils/googleRating";
import { money } from "../utils/format";
import { useSiteData } from "./SiteData";
import { FAQS, SERVICES, STEPS, companyInfo, websitePlans } from "./content";

const API = import.meta.env.VITE_API_URL || "/api";
const ICONS = { mobile: IconPhone, web: IconGlobe, software: IconCode };

/* H1 + intro at the top of every inner page. */
export function PageHero({ page, children }) {
  return (
    <section className="section sol-hero page-hero">
      <div className="wrap">
        {page.eyebrow && <div className="eyebrow">{page.eyebrow}</div>}
        <h1 className="h2">{page.h1}</h1>
        {page.intro && <p className="lead">{page.intro}</p>}
        {children}
      </div>
    </section>
  );
}

/* "View full portfolio →" style link under a short home section. */
export function MoreLink({ to, children }) {
  return <p className="more-row"><Link to={to} className="btn btn-line btn-sm">{children} →</Link></p>;
}

/* Two or three related pages plus a call to action, at the bottom of inner pages. */
export function Related({ links, cta = true }) {
  const { openOrder } = useSiteData();
  return (
    <section className="section related" aria-labelledby="related-title">
      <div className="wrap related-inner">
        <h2 className="sub-h" id="related-title" style={{ marginTop: 0 }}>Keep exploring</h2>
        <nav className="related-links" aria-label="Related pages">
          {links.map(([to, label]) => <Link key={to} to={to} className="chip">{label}</Link>)}
        </nav>
        {cta && (
          <div className="related-cta">
            <button type="button" className="btn btn-orange" onClick={() => openOrder("")}>Start a project</button>
            <Link to="/contact" className="btn btn-line">Contact us</Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* The three core services as cards (home page). */
export function ServiceCards({ headingLevel = 3 }) {
  const { openOrder } = useSiteData();
  const H = `h${headingLevel}`;
  return (
    <div className="grid-3">
      {SERVICES.map(({ slug, title, text }) => {
        const Icon = ICONS[slug];
        return (
          <article key={slug} className="card service-card reveal">
            <span className="service-icon"><Icon size={24} /></span>
            <H>{title}</H>
            <p>{text}</p>
            <div className="service-actions">
              <Link to={`/solutions/${slug}`} className="btn btn-line">View solutions</Link>
              <button type="button" className="link-btn" onClick={() => openOrder(`Enquiry: ${title}`)}>Get a quote</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function HowItWorks({ id }) {
  return (
    <section id={id} className="section tint" aria-labelledby="how-title">
      <div className="wrap">
        <h2 className="h2 reveal" id="how-title" style={{ marginBottom: 48 }}>How it works</h2>
        <ol className="steps">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="reveal"><span className="n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3>{t}</h3><p>{d}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function WorkCard({ w, eager = false }) {
  return (
    <article className="work">
      <div className="work-img">
        {w.imageUrl
          ? <img src={w.imageUrl} alt={`${w.title}, ${w.category || "project"} built by Annek`} loading={eager ? undefined : "lazy"} decoding="async" width="600" height="450" />
          : <span aria-hidden="true">{w.title?.[0]}</span>}
      </div>
      {w.category && <span className="cat">{w.category}</span>}
      <h3>{w.title}</h3>
      {w.desc && <p>{w.desc}</p>}
    </article>
  );
}

function usePortfolioFilter(portfolio) {
  const [filter, setFilter] = useState("All");
  const categories = ["All", ...new Set(portfolio.map((p) => p.category).filter(Boolean))];
  const shown = filter === "All" ? portfolio : portfolio.filter((p) => p.category === filter);
  const chips = categories.length > 2 && (
    <div className="filters" role="group" aria-label="Filter projects">
      {categories.map((c) => <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>)}
    </div>
  );
  return [shown, chips];
}

/* Home: a moving row of projects. */
export function PortfolioTeaser() {
  const { portfolio } = useSiteData();
  if (!portfolio.length) return null;
  return (
    <section className="section tint" aria-labelledby="work-title">
      <div className="wrap">
        <div className="head-row reveal">
          <div><div className="eyebrow">Portfolio</div><h2 className="h2" id="work-title">Recent work</h2></div>
        </div>
      </div>
      <Marquee label="Portfolio projects" items={portfolio} keyOf={(w) => w._id} renderItem={(w) => <WorkCard w={w} />} />
      <div className="wrap"><MoreLink to="/portfolio">View full portfolio</MoreLink></div>
    </section>
  );
}

/* /portfolio: every project in a grid, with category filters. */
export function PortfolioGrid() {
  const { portfolio } = useSiteData();
  const [shown, chips] = usePortfolioFilter(portfolio);
  return (
    <section className="section tint" aria-labelledby="projects-title">
      <div className="wrap">
        <div className="head-row">
          <h2 className="h2" id="projects-title">Projects</h2>
          {chips}
        </div>
        {portfolio.length ? (
          <ul className="work-grid">
            {shown.map((w, i) => <li key={w._id}><WorkCard w={w} eager={i < 3} /></li>)}
          </ul>
        ) : (
          <p className="lead">Projects are loading. If nothing appears, <Link to="/contact">ask us for examples</Link> of our work.</p>
        )}
      </div>
    </section>
  );
}

/* Website build plans (home and /pricing). */
export function WebsitePlans({ titleId = "pricing-title", title = "Just need a website?", headingLevel = 2 }) {
  const { settings, openOrder } = useSiteData();
  const H = `h${headingLevel}`;
  return (
    <div className="wrap pricing">
      <div className="pricing-intro reveal">
        <div className="eyebrow" style={{ marginBottom: 0 }}>Website builds</div>
        <H className="h2" id={titleId}>{title}</H>
        <p className="lead">One time builds with no hidden fees. Add a monthly maintenance plan any time.</p>
      </div>
      <div className="grid-3" style={{ gap: 16 }}>
        {websitePlans(settings).map((p) => (
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
  );
}

/* Monthly maintenance plans from Admin › Services & packages. */
export function MaintenancePlans() {
  const { catalog } = useSiteData();
  const plans = catalog?.maintenancePlans || [];
  return (
    <section className="section tint" aria-labelledby="maint-title">
      <div className="wrap">
        <h2 className="h2" id="maint-title" style={{ marginBottom: 16 }}>Monthly maintenance plans</h2>
        <p className="lead" style={{ maxWidth: 640, marginBottom: 32 }}>Maintenance keeps your app, website or software secure and up to date after launch: hosting, security updates, backups, small changes and support.</p>
        {plans.length > 0 ? (
          <div className="grid-3">
            {plans.map((m) => (
              <div key={m._id} className="card">
                <h3 className="sub-h" style={{ margin: 0 }}>{m.name}</h3>
                <div className="price">{money(m.monthlyFee, m.currency)}<small> / month</small></div>
                {m.description && <p className="lead" style={{ fontSize: 14, marginBottom: 10 }}>{m.description}</p>}
                <ul className="ticks" style={{ fontSize: 14 }}>{m.features?.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="lead">Each package lists the maintenance it includes. <Link to="/contact">Ask us</Link> for a maintenance quote for your project.</p>
        )}
      </div>
    </section>
  );
}

function Testimonial({ r }) {
  return (
    <figure className="card review" style={{ margin: 0 }}>
      <Stars value={r.rating || 5} />
      <blockquote>“{r.message}”</blockquote>
      <footer>{r.name?.trim() || "Verified client"}</footer>
    </figure>
  );
}

function RatingSummary() {
  const { settings, google } = useSiteData();
  // Live Places data wins; otherwise the rating typed in Admin > Settings; otherwise just "Write a review".
  return !(google?.userRatingCount > 0) && parseGoogleRating(settings)
    ? <GoogleRatingBadge settings={settings} />
    : <GoogleSummary data={google} />;
}

/* Home: rating summary and a moving row of reviews. */
export function ReviewsTeaser() {
  const { feedback, google } = useSiteData();
  const shown = [
    ...(google?.reviews || []).map((r) => ({ ...r, _google: true, _id: `g:${r.id}` })),
    ...feedback.slice(0, 6),
  ];
  return (
    <section className="section tint" aria-labelledby="reviews-title">
      <div className="wrap">
        <h2 className="h2 reveal" id="reviews-title" style={{ marginBottom: 28 }}>Trusted By</h2>
        <RatingSummary />
      </div>
      {shown.length > 0 && (
        <Marquee label="Client ratings" reverse items={shown} keyOf={(r) => r._id}
          renderItem={(r) => (r._google ? <GoogleReviewCard review={r} /> : <Testimonial r={r} />)} />
      )}
      <div className="wrap"><MoreLink to="/reviews">Read all reviews</MoreLink></div>
    </section>
  );
}

/* /reviews: Google reviews load in the browser only (Places terms); testimonials are our own content. */
export function ReviewsFull() {
  const { feedback, google } = useSiteData();
  const googleReviews = google?.reviews || [];
  return (
    <>
      <section className="section tint" aria-labelledby="google-title">
        <div className="wrap">
          <h2 className="h2" id="google-title" style={{ marginBottom: 28 }}>Google rating and reviews</h2>
          <RatingSummary />
          {googleReviews.length > 0 && (
            <ul className="reviews-grid">
              {googleReviews.map((r) => <li key={r.id}><GoogleReviewCard review={r} /></li>)}
            </ul>
          )}
        </div>
      </section>
      <section className="section" aria-labelledby="testimonials-title">
        <div className="wrap">
          <h2 className="h2" id="testimonials-title" style={{ marginBottom: 12 }}>Client testimonials</h2>
          <p className="lead" style={{ marginBottom: 32 }}>Feedback clients have sent to Annek directly.</p>
          {feedback.length > 0 ? (
            <ul className="reviews-grid">
              {feedback.map((r) => <li key={r._id}><Testimonial r={r} /></li>)}
            </ul>
          ) : (
            <p className="lead">No testimonials to show yet.</p>
          )}
          <p className="more-row"><WriteReviewButton className="btn btn-orange">Write a Google review</WriteReviewButton></p>
        </div>
      </section>
    </>
  );
}

function Stats() {
  const { portfolio, stats } = useSiteData();
  const items = [
    portfolio.length > 0 && [portfolio.length, "Projects showcased"],
    stats.avgRating && [`${stats.avgRating}/5`, stats.reviewCount ? `Rating from ${stats.reviewCount} reviews` : "Average client rating"],
    stats.industryCount > 0 && [stats.industryCount, "Industries served"],
  ].filter(Boolean);
  if (!items.length) return null;
  return <div className="stats">{items.map(([v, l]) => <div key={l} className="stat"><b>{v}</b><span>{l}</span></div>)}</div>;
}

export function FaqList({ items = FAQS, headingLevel = 3, title = "Frequently asked questions" }) {
  const H = `h${headingLevel}`;
  return (
    <div className="faq reveal">
      {title && <H className="sub-h" style={{ marginTop: 0 }}>{title}</H>}
      {items.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </div>
  );
}

/* Home: short about text plus the first FAQs. */
export function AboutTeaser() {
  const { settings } = useSiteData();
  const company = companyInfo(settings);
  return (
    <section className="section" aria-labelledby="about-title">
      <div className="wrap about">
        <div className="about-copy reveal">
          <div className="eyebrow" style={{ marginBottom: 0 }}>About Annek</div>
          <h2 className="h2" id="about-title">A software development company from Sri Lanka, building for businesses everywhere.</h2>
          <p className="lead" style={{ whiteSpace: "pre-line" }}>{company.about}</p>
          <Stats />
          <p><Link to="/about" className="btn btn-line btn-sm">More about Annek →</Link></p>
        </div>
        <div>
          <FaqList items={FAQS.slice(0, 3)} />
          <p className="more-row" style={{ justifyContent: "flex-start" }}><Link to="/faq" className="btn btn-line btn-sm">All questions →</Link></p>
        </div>
      </div>
    </section>
  );
}

/* /about: the about text, stats and what Annek does. */
export function AboutFull() {
  const { settings } = useSiteData();
  const company = companyInfo(settings);
  return (
    <section className="section" aria-labelledby="story-title">
      <div className="wrap about">
        <div className="about-copy">
          <h2 className="h2" id="story-title">Who we are</h2>
          <p className="lead" style={{ whiteSpace: "pre-line" }}>{company.about}</p>
          {/* TODO(content): add Annek's story, founding year and team here. Real details only. */}
          <Stats />
        </div>
        <div className="about-copy">
          <h2 className="h2" id="what-title">What we build</h2>
          <ul className="ticks about-list">
            {SERVICES.map((s) => <li key={s.slug}><Link to={`/solutions/${s.slug}`}>{s.title}</Link>: {s.text}</li>)}
            <li><Link to="/pricing">Monthly maintenance</Link>: hosting, security updates, backups and changes after launch.</li>
          </ul>
          <p className="lead">Based in {company.address}. {company.area}.</p>
        </div>
      </div>
    </section>
  );
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

/* The dark contact block (home and /contact). */
export function ContactBlock({ title = <>Let's build <span>your</span> next app.</>, style }) {
  const { settings, openOrder } = useSiteData();
  const company = companyInfo(settings);
  return (
    <section className="section" style={{ paddingTop: 0, ...style }} aria-labelledby="contact-title">
      <div className="wrap">
        <div className="contact reveal">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 className="h2" id="contact-title">{title}</h2>
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
  );
}
