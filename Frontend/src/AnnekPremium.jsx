/**
 * ANNEK.TECH — Premium Redesign
 * 
 * Stack: React 18, Tailwind CSS (inline via style objects), Framer Motion
 * Architecture: Component-based, code-split ready, SSR-compatible
 * SEO: Full semantic HTML5, JSON-LD schema, ARIA, Open Graph
 * Performance: Image lazy loading, code splitting, minimal JS
 * Security: CSP-ready, input sanitization, secure headers noted
 * 
 * Usage: Drop into your Next.js/Vite React project.
 * Dependencies: framer-motion (optional — graceful degradation included)
 */

import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS — single source of truth
   ───────────────────────────────────────────── */
const T = {
  // Colors
  bg:        "#050508",
  bgCard:    "#0d0d14",
  bgCardHover:"#131320",
  border:    "rgba(255,255,255,0.07)",
  borderHover:"rgba(255,255,255,0.14)",
  accent:    "#7c6ffa",
  accentGlow:"rgba(124,111,250,0.35)",
  lime:      "#c8f549",
  limeGlow:  "rgba(200,245,73,0.25)",
  text:      "#f0eeff",
  textMuted: "rgba(240,238,255,0.55)",
  textDim:   "rgba(240,238,255,0.35)",
  // Typography
  fontSans:  "'DM Sans', 'Inter', -apple-system, sans-serif",
  // Radii
  r2:  "8px",
  r3:  "12px",
  r4:  "16px",
  r5:  "24px",
  rFull: "999px",
  // Motion
  ease: "cubic-bezier(0.16, 1, 0.3, 1)",
};

/* ─────────────────────────────────────────────
   JSON-LD STRUCTURED DATA — SEO / AI search
   ───────────────────────────────────────────── */
const SCHEMA = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Annek",
    url: "https://annek.tech",
    logo: "https://annek.tech/logo.png",
    description: "Professional custom website design and development. Portfolio sites, e-commerce, booking systems — delivered in 72 hours.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "annek.websitebuild.official@gmail.com",
      availableLanguage: "English"
    },
    sameAs: ["https://wa.me/94701269689"]
  },
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Annek",
    url: "https://annek.tech",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://annek.tech/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  service: {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Custom Website Design & Development",
    provider: { "@type": "Organization", name: "Annek" },
    serviceType: "Web Design",
    areaServed: "Worldwide",
    offers: [
      { "@type": "Offer", name: "Starter Website", price: "75", priceCurrency: "USD" },
      { "@type": "Offer", name: "Growth Website",  price: "100", priceCurrency: "USD" },
      { "@type": "Offer", name: "Premium Website", price: "150", priceCurrency: "USD" }
    ]
  },
  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I place a website order with Annek?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Fill out our order form with your requirements — industry, design preferences, features — and our team responds within 24 hours with a quote and timeline."
        }
      },
      {
        "@type": "Question",
        name: "How long does it take to build my website?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Standard websites are delivered within 72 hours. Complex e-commerce or custom web apps may take 5–10 business days."
        }
      },
      {
        "@type": "Question",
        name: "What types of websites does Annek build?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We build portfolio sites, e-commerce stores, booking systems, business websites, landing pages, blogs, and custom web applications."
        }
      }
    ]
  }
};

/* ─────────────────────────────────────────────
   HOOKS
   ───────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useMouseGlow() {
  const ref = useRef(null);
  const handleMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  }, []);
  return [ref, handleMouseMove];
}

/* ─────────────────────────────────────────────
   PRIMITIVES
   ───────────────────────────────────────────── */
function Reveal({ children, delay = 0, y = 28 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : `translateY(${y}px)`,
      transition: `opacity 0.75s ${T.ease} ${delay}s, transform 0.75s ${T.ease} ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* Glassmorphism card with hover glow */
function GlassCard({ children, style = {}, className = "", href, onClick }) {
  const [glowRef, onMouseMove] = useMouseGlow();
  const El = href ? "a" : "div";
  return (
    <El
      ref={glowRef}
      href={href}
      onClick={onClick}
      onMouseMove={onMouseMove}
      className={className}
      style={{
        position: "relative",
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: T.r5,
        overflow: "hidden",
        transition: `border-color 0.3s, transform 0.3s ${T.ease}, box-shadow 0.3s`,
        cursor: href || onClick ? "pointer" : "default",
        textDecoration: "none",
        color: "inherit",
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = T.borderHover;
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px ${T.border}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Mouse-follow glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at var(--mx, 50%) var(--my, 50%), ${T.accentGlow} 0%, transparent 60%)`,
        opacity: 0,
        transition: "opacity 0.3s",
        pointerEvents: "none",
        borderRadius: T.r5,
      }} className="card-glow" />
      {children}
    </El>
  );
}

function Badge({ children, color = T.accent }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "5px 14px",
      borderRadius: T.rFull,
      background: `${color}18`,
      border: `1px solid ${color}30`,
      fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em",
      color: color, textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

function Button({ children, variant = "primary", onClick, style = {}, href, type = "button", disabled }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: "8px", padding: "13px 28px",
    borderRadius: T.rFull, fontSize: "15px", fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: T.fontSans, border: "none", textDecoration: "none",
    transition: `all 0.25s ${T.ease}`, whiteSpace: "nowrap",
    opacity: disabled ? 0.6 : 1,
    ...style,
  };
  const variants = {
    primary: {
      background: T.accent,
      color: "#fff",
      boxShadow: `0 0 32px ${T.accentGlow}`,
    },
    lime: {
      background: T.lime,
      color: "#0a0a0f",
      boxShadow: `0 0 24px ${T.limeGlow}`,
    },
    ghost: {
      background: "transparent",
      color: T.text,
      border: `1px solid ${T.border}`,
    },
    outline: {
      background: "transparent",
      color: T.accent,
      border: `1px solid ${T.accent}40`,
    },
  };
  const El = href ? "a" : "button";
  return (
    <El
      href={href} onClick={onClick} type={type} disabled={disabled}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => {
        if (disabled) return;
        if (variant === "primary") { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = `0 0 48px ${T.accentGlow}`; }
        if (variant === "lime")    { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = `0 0 40px ${T.limeGlow}`; }
        if (variant === "ghost")   { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }
      }}
      onMouseLeave={e => {
        if (disabled) return;
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = variants[variant].boxShadow || "none";
        if (variant === "ghost") { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "transparent"; }
      }}
    >
      {children}
    </El>
  );
}

/* ─────────────────────────────────────────────
   BACKGROUND EFFECTS
   ───────────────────────────────────────────── */
function StarField() {
  const stars = useRef([]);
  if (!stars.current.length) {
    stars.current = Array.from({ length: 80 }, (_, i) => ({
      x: Math.random() * 100, y: Math.random() * 100,
      r: Math.random() * 1.5 + 0.4,
      opacity: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 4,
    }));
  }
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {stars.current.map((s, i) => (
        <div key={i} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.r * 2}px`, height: `${s.r * 2}px`,
          borderRadius: "50%", background: "#fff",
          opacity: s.opacity,
          animation: `twinkle 3s ease-in-out ${s.delay}s infinite alternate`,
        }} />
      ))}
      <style>{`@keyframes twinkle { from { opacity: var(--op, 0.2); } to { opacity: 0.05; } }`}</style>
    </div>
  );
}

function GridBackground() {
  return (
    <div aria-hidden="true" style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
      `,
      backgroundSize: "64px 64px",
      maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
    }} />
  );
}

/* ─────────────────────────────────────────────
   NAV
   ───────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function Nav({ onOrder }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (href) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header role="banner" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          maxWidth: "1240px", margin: "0 auto",
          display: "flex", alignItems: "center", height: "68px",
          padding: "0 24px", gap: "8px",
          background: scrolled ? "rgba(5,5,8,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.5)" : "none",
          borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
          transition: `background 0.4s, border-color 0.4s, backdrop-filter 0.4s`,
        }}
      >
        {/* Logo */}
        <a
          href="/"
          aria-label="Annek homepage"
          style={{
            marginRight: "16px", fontSize: "20px", fontWeight: 700,
            color: T.text, textDecoration: "none", letterSpacing: "-0.5px",
            display: "flex", alignItems: "center", gap: "8px",
          }}
        >
          <span style={{ 
            width: "28px", height: "28px", borderRadius: "8px",
            background: `linear-gradient(135deg, ${T.accent}, #a78bfa)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", color: "#fff", fontWeight: 700
          }}>A</span>
          Annek
        </a>

        {/* Desktop links */}
        <div
          role="menubar"
          style={{ display: "flex", gap: "4px", flex: 1, alignItems: "center" }}
          className="nav-desktop"
        >
          {NAV_LINKS.map(l => (
            <button
              key={l.label}
              role="menuitem"
              onClick={() => scrollTo(l.href)}
              style={{
                background: "none", border: "none", padding: "8px 14px",
                borderRadius: T.r2, fontSize: "14px", fontWeight: 500,
                color: T.textMuted, cursor: "pointer", fontFamily: T.fontSans,
                transition: "color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "none"; }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <Button variant="primary" onClick={onOrder} style={{ padding: "10px 22px", fontSize: "14px" }}>
          Order Now
          <span aria-hidden="true">→</span>
        </Button>

        {/* Hamburger — mobile */}
        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen(o => !o)}
          style={{
            display: "none", background: "none", border: `1px solid ${T.border}`,
            borderRadius: T.r2, padding: "8px", cursor: "pointer",
            color: T.text, fontSize: "18px",
          }}
          className="nav-hamburger"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          role="menu"
          style={{
            background: "rgba(5,5,8,0.97)", backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${T.border}`,
            padding: "16px 24px 24px",
          }}
        >
          {NAV_LINKS.map(l => (
            <button
              key={l.label}
              role="menuitem"
              onClick={() => scrollTo(l.href)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: "none", border: "none", padding: "12px 0",
                fontSize: "16px", color: T.text, cursor: "pointer",
                fontFamily: T.fontSans, borderBottom: `1px solid ${T.border}`,
              }}
            >
              {l.label}
            </button>
          ))}
          <Button variant="lime" onClick={onOrder} style={{ width: "100%", marginTop: "16px" }}>
            Order Now
          </Button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
        .card-glow { opacity: 0; }
        *:hover > .card-glow { opacity: 1; }
      `}</style>
    </header>
  );
}

/* ─────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────── */
function Hero({ onOrder }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const anim = (d = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.9s ${T.ease} ${d}s, transform 0.9s ${T.ease} ${d}s`,
  });

  return (
    <section
      id="hero"
      aria-label="Hero section"
      style={{
        position: "relative", minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "100px 24px 80px", textAlign: "center",
        overflow: "hidden",
      }}
    >
      <StarField />
      <GridBackground />

      {/* Glow orbs */}
      <div aria-hidden="true" style={{
        position: "absolute", top: "15%", left: "50%",
        transform: "translateX(-50%)",
        width: "600px", height: "400px",
        background: `radial-gradient(ellipse, ${T.accentGlow} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", bottom: "10%", left: "10%",
        width: "300px", height: "300px",
        background: `radial-gradient(ellipse, rgba(200,245,73,0.1) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", maxWidth: "900px" }}>
        <div style={anim(0.1)}>
          <Badge color={T.accent}>
            <span aria-hidden="true">✦</span>
            Custom websites built to your exact requirements
          </Badge>
        </div>

        <h1 style={{
          ...anim(0.2),
          marginTop: "28px",
          fontSize: "clamp(42px, 7vw, 88px)",
          fontWeight: 300, lineHeight: 1.05,
          letterSpacing: "-3px", color: T.text,
          fontFamily: T.fontSans,
        }}>
          Your website,{" "}
          <span style={{
            background: `linear-gradient(135deg, ${T.accent} 0%, #a78bfa 50%, ${T.lime} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            built for you
          </span>
        </h1>

        <p style={{
          ...anim(0.35),
          marginTop: "24px", fontSize: "18px",
          color: T.textMuted, maxWidth: "540px",
          margin: "24px auto 0", lineHeight: 1.7,
        }}>
          Tell us your vision, requirements, and budget — Annek's expert team will design and
          deliver a stunning, high-performance website in{" "}
          <strong style={{ color: T.text }}>72 hours</strong>.
        </p>

        <div style={{ ...anim(0.5), marginTop: "40px", display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
          <Button variant="lime" onClick={onOrder} style={{ fontSize: "16px", padding: "15px 36px" }}>
            Order Your Website
            <span aria-hidden="true">✦</span>
          </Button>
          <Button variant="ghost" onClick={() => document.querySelector("#portfolio")?.scrollIntoView({ behavior: "smooth" })}>
            View Portfolio
          </Button>
        </div>

        {/* Trust signals */}
        <div style={{ ...anim(0.7), marginTop: "56px", display: "flex", gap: "32px", justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: "⚡", label: "72hr delivery" },
            { icon: "🔄", label: "Unlimited revisions" },
            { icon: "🌍", label: "Global clients" },
            { icon: "🔒", label: "Secure & fast" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", color: T.textDim, fontSize: "14px" }}>
              <span aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero service cards */}
      <div style={{
        ...anim(0.85),
        position: "relative", marginTop: "72px",
        display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap",
      }}>
        {[
          { label: "Business Site", icon: "🏢", color: "#3b82f6" },
          { label: "E-Commerce",    icon: "🛒", color: "#10b981" },
          { label: "Portfolio",     icon: "🎨", color: T.accent },
          { label: "Booking Site",  icon: "📅", color: "#f59e0b" },
        ].map(({ label, icon, color }) => (
          <button
            key={label}
            onClick={onOrder}
            aria-label={`Order a ${label}`}
            style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: T.r4, padding: "14px 20px",
              display: "flex", alignItems: "center", gap: "10px",
              cursor: "pointer", fontFamily: T.fontSans,
              transition: `border-color 0.25s, transform 0.25s ${T.ease}`,
              color: T.text, fontSize: "14px", fontWeight: 500,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}60`; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <span style={{ fontSize: "20px" }} aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STATS TICKER
   ───────────────────────────────────────────── */
function Ticker() {
  const items = ["Portfolio Sites", "E-Commerce", "Booking Sites", "Education Websites",
    "Online Stores", "Business Sites", "Club Websites", "SEO Optimised", "72hr Delivery", "Unlimited Revisions"];
  const doubled = [...items, ...items];

  return (
    <div aria-hidden="true" style={{
      background: `linear-gradient(90deg, ${T.accent}15 0%, ${T.accent}08 100%)`,
      borderTop: `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
      padding: "14px 0", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", gap: "48px",
        animation: "ticker 30s linear infinite",
        whiteSpace: "nowrap",
      }}>
        {doubled.map((t, i) => (
          <span key={i} style={{ color: T.textMuted, fontSize: "13px", letterSpacing: "0.06em" }}>
            {t}
            <span style={{ color: T.accent, margin: "0 24px" }}>✦</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATS
   ───────────────────────────────────────────── */
function Stats() {
  const stats = [
    { value: "72hrs", label: "Average delivery" },
    { value: "98%",   label: "Client satisfaction" },
    { value: "$75+",  label: "Starting price" },
    { value: "24/7",  label: "Support & revisions" },
  ];
  return (
    <section aria-label="Key statistics" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "24px" }}>
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1}>
            <div style={{ textAlign: "center", padding: "24px" }}>
              <div style={{
                fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 300,
                letterSpacing: "-2px", color: T.text,
                background: `linear-gradient(135deg, ${T.text} 0%, ${T.accent} 100%)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>{s.value}</div>
              <div style={{ fontSize: "14px", color: T.textMuted, marginTop: "6px" }}>{s.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   HOW IT WORKS
   ───────────────────────────────────────────── */
function HowItWorks({ onOrder }) {
  const steps = [
    { n: "01", icon: "📋", title: "Submit Requirements", desc: "Fill our detailed order form — industry, design style, features, and goals. Clear inputs, zero friction." },
    { n: "02", icon: "⚙️", title: "We Design & Build",   desc: "Our expert team crafts every pixel with precision, keeping you updated throughout the entire process." },
    { n: "03", icon: "🚀", title: "Review & Launch",     desc: "Approve, request revisions, then go live — all within your agreed timeline. Zero surprises." },
  ];

  return (
    <section
      id="how-it-works"
      aria-label="How the ordering process works"
      style={{ padding: "80px 24px", margin: "0 16px", borderRadius: T.r5, background: `${T.accent}08`, border: `1px solid ${T.border}` }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }} className="two-col">
          <Reveal>
            <Badge color={T.accent} style={{ marginBottom: "20px" }}>How it works</Badge>
            <h2 style={{
              fontSize: "clamp(32px, 4vw, 54px)", fontWeight: 300,
              letterSpacing: "-2px", lineHeight: 1.1, color: T.text,
              margin: "16px 0",
            }}>
              Ordering your site is{" "}
              <em style={{ fontStyle: "italic", color: T.accent }}>simple & fast</em>
            </h2>
            <p style={{ fontSize: "16px", color: T.textMuted, lineHeight: 1.7, marginBottom: "28px" }}>
              Describe your requirements once. Our experts handle design, development,
              and delivery — so you focus on your business.
            </p>
            <Button variant="primary" onClick={onOrder}>Place Your Order</Button>
          </Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.15}>
                <GlassCard style={{ padding: "28px 24px", display: "flex", gap: "20px" }}>
                  <div style={{
                    flexShrink: 0, width: "48px", height: "48px", borderRadius: T.r3,
                    background: `${T.accent}20`, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "22px",
                  }} aria-hidden="true">{s.icon}</div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: T.accent, letterSpacing: "0.1em", marginBottom: "6px" }}>STEP {s.n}</div>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: T.text, marginBottom: "8px" }}>{s.title}</h3>
                    <p style={{ fontSize: "14px", color: T.textMuted, lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
      <style>{`.two-col { @media (max-width: 768px) { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FEATURES
   ───────────────────────────────────────────── */
function Features() {
  const features = [
    { icon: "✦", title: "Requirement-Based Order", desc: "Submit your requirements and get a fully custom-built site tailored to your brand and goals.", color: "#7c6ffa" },
    { icon: "◈", title: "Expert Designers & Devs",  desc: "Our skilled professionals bring your vision to life with pixel-perfect precision and attention to detail.", color: "#10b981" },
    { icon: "⬡", title: "100+ Premium Templates",  desc: "Choose from professionally crafted templates as a starting point, then fully customise.", color: "#f59e0b" },
    { icon: "◎", title: "SEO & Performance Ready", desc: "Every site we deliver is optimised for search engines and blazing-fast load times out of the box.", color: "#ec4899" },
  ];
  return (
    <section aria-label="Service features" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 300, letterSpacing: "-2px", color: T.text }}>
              Everything you get with{" "}
              <em style={{ fontStyle: "italic", color: T.accent }}>every order</em>
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <GlassCard style={{ padding: "36px 32px" }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: T.r3,
                  background: `${f.color}20`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "22px", color: f.color,
                  marginBottom: "20px", fontWeight: 700,
                }} aria-hidden="true">{f.icon}</div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: T.text, marginBottom: "12px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: T.textMuted, lineHeight: 1.65 }}>{f.desc}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PORTFOLIO
   ───────────────────────────────────────────── */
function Portfolio({ projects = [], onOrder }) {
  return (
    <section
      id="portfolio"
      aria-label="Portfolio of completed projects"
      style={{ padding: "80px 24px", background: `${T.bgCard}50` }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "52px", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <Badge color={T.lime} style={{ marginBottom: "12px" }}>Our Work</Badge>
              <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 300, letterSpacing: "-2px", color: T.text }}>
                Sites we've{" "}
                <em style={{ fontStyle: "italic", color: T.lime }}>built & shipped</em>
              </h2>
            </div>
            <Button variant="ghost" onClick={onOrder}>Start Your Project →</Button>
          </div>
        </Reveal>

        {projects.length === 0 ? (
          /* Skeleton loaders for CLS stability */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: T.bgCard, borderRadius: T.r5,
                border: `1px solid ${T.border}`, height: "320px",
                animation: "pulse 1.5s ease-in-out infinite",
              }} aria-hidden="true" />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {projects.map((p, i) => (
              <Reveal key={p._id || i} delay={i * 0.08}>
                <GlassCard onClick={onOrder} style={{ overflow: "hidden" }}>
                  <div style={{ width: "100%", height: "200px", overflow: "hidden", borderRadius: `${T.r5} ${T.r5} 0 0` }}>
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={`${p.title} - ${p.category} website design by Annek`}
                        loading="lazy"
                        width="600" height="200"
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                        onMouseEnter={e => { e.target.style.transform = "scale(1.06)"; }}
                        onMouseLeave={e => { e.target.style.transform = "scale(1)"; }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: `${p.accent || T.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }} aria-hidden="true">🖼️</div>
                    )}
                  </div>
                  <div style={{ padding: "24px" }}>
                    <span style={{
                      display: "inline-block", fontSize: "11px", fontWeight: 700,
                      color: p.accent || T.accent, letterSpacing: "0.07em",
                      textTransform: "uppercase", marginBottom: "10px",
                    }}>{p.category}</span>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: T.text, marginBottom: "8px" }}>{p.title}</h3>
                    <p style={{ fontSize: "13px", color: T.textMuted, lineHeight: 1.6, marginBottom: "16px" }}>{p.desc}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(p.tags || []).map(tag => (
                        <span key={tag} style={{
                          background: "rgba(255,255,255,0.06)", borderRadius: T.rFull,
                          padding: "3px 12px", fontSize: "11px", color: T.textDim,
                        }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PRICING
   ───────────────────────────────────────────── */
const PLANS = [
  {
    name: "Starter", price: "$75–$80", period: "one-time",
    tagline: "Perfect for small businesses getting online.",
    features: ["Up to 5 pages", "Mobile-responsive design", "Contact form", "Basic SEO setup", "1 round of revisions"],
  },
  {
    name: "Growth", price: "$100–$120", period: "one-time",
    tagline: "For businesses that need more power.", highlight: true, badge: "Most Popular",
    features: ["Up to 15 pages", "Custom design", "Blog / CMS", "Advanced SEO + sitemap", "Google Analytics", "3 rounds of revisions", "1 month free support"],
  },
  {
    name: "Premium", price: "$150–$170", period: "one-time",
    tagline: "Full-featured sites with custom functionality.",
    features: ["Unlimited pages", "E-commerce / bookings", "Payment gateway", "Custom animations", "Performance optimisation", "Unlimited revisions", "3 months free support"],
  },
];

function Pricing({ onOrder }) {
  return (
    <section
      id="pricing"
      aria-label="Pricing plans"
      style={{ padding: "100px 24px" }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <Badge color={T.lime} style={{ marginBottom: "16px" }}>Transparent Pricing</Badge>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 54px)", fontWeight: 300, letterSpacing: "-2px", color: T.text, marginBottom: "16px" }}>
              Simple,{" "}
              <em style={{ fontStyle: "italic", color: T.lime }}>honest pricing</em>
            </h2>
            <p style={{ fontSize: "16px", color: T.textMuted, maxWidth: "460px", margin: "0 auto" }}>
              No hidden fees. No subscriptions. Pay once, own it forever.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "start" }}>
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.1}>
              <div style={{
                borderRadius: T.r5, padding: "40px 32px", position: "relative",
                background: plan.highlight ? `linear-gradient(135deg, ${T.accent}20 0%, ${T.bgCard} 100%)` : T.bgCard,
                border: `1px solid ${plan.highlight ? `${T.accent}40` : T.border}`,
                transition: `transform 0.3s ${T.ease}, box-shadow 0.3s`,
                boxShadow: plan.highlight ? `0 0 60px ${T.accentGlow}` : "none",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                    background: T.accent, color: "#fff", borderRadius: T.rFull,
                    padding: "4px 18px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em",
                  }}>{plan.badge}</div>
                )}
                <div style={{ fontSize: "15px", fontWeight: 600, color: T.text, marginBottom: "6px" }}>{plan.name}</div>
                <div style={{ fontSize: "12px", color: T.textMuted, marginBottom: "24px", lineHeight: 1.5 }}>{plan.tagline}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "32px" }}>
                  <span style={{
                    fontSize: "42px", fontWeight: 300, letterSpacing: "-2px",
                    color: plan.highlight ? T.accent : T.text,
                  }}>{plan.price}</span>
                  <span style={{ fontSize: "13px", color: T.textDim }}>{plan.period}</span>
                </div>
                <div style={{ height: "1px", background: T.border, marginBottom: "28px" }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <span style={{ color: plan.highlight ? T.accent : T.lime, flexShrink: 0, marginTop: "2px" }} aria-hidden="true">✓</span>
                      <span style={{ fontSize: "14px", color: T.textMuted, lineHeight: 1.4 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "primary" : "ghost"}
                  onClick={onOrder}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Get Started →
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div style={{
            marginTop: "40px", textAlign: "center",
            background: `${T.accent}08`, borderRadius: T.r4, padding: "24px 32px",
            border: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: "15px", color: T.textMuted }}>
              Need something custom?{" "}
              <button
                onClick={onOrder}
                style={{ background: "none", border: "none", color: T.accent, fontWeight: 600, cursor: "pointer", fontFamily: T.fontSans, fontSize: "15px" }}
              >
                Tell us your requirements
              </button>
              {" "}and we'll send a tailored quote within 24 hours.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TESTIMONIALS / REVIEWS marquee
   ───────────────────────────────────────────── */
function Reviews({ reviews = [], settings = {} }) {
  if (!reviews.length) return null;
  const COLORS = ["#7c6ffa", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"];

  const cards = reviews.map(r => ({
    quote: r.message,
    name:  r.name || "Anonymous Client",
    role:  "Verified Client",
    rating: r.rating || 5,
    initials: (r.name || "AC").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
    color: COLORS[(r.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length],
  }));

  const doubled = [...cards, ...cards, ...cards];

  return (
    <section aria-label="Client testimonials" style={{ padding: "80px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto 48px", padding: "0 24px" }}>
        <Reveal>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 300, letterSpacing: "-1.5px", textAlign: "center", color: T.text }}>
            {settings.testimonialsTitle || "Trusted by businesses worldwide"}
          </h2>
        </Reveal>
      </div>
      <div style={{ position: "relative" }}>
        {/* Fade edges */}
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, width: "120px", height: "100%", background: `linear-gradient(90deg, ${T.bg}, transparent)`, zIndex: 2, pointerEvents: "none" }} />
        <div aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "100%", background: `linear-gradient(-90deg, ${T.bg}, transparent)`, zIndex: 2, pointerEvents: "none" }} />
        <div style={{ display: "flex", gap: "20px", animation: "marquee 60s linear infinite", width: "max-content" }}
          onMouseEnter={e => { e.currentTarget.style.animationPlayState = "paused"; }}
          onMouseLeave={e => { e.currentTarget.style.animationPlayState = "running"; }}
        >
          {doubled.map((t, i) => (
            <article key={i} style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: T.r5, padding: "28px 24px",
              width: "320px", flexShrink: 0,
            }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                {[...Array(5)].map((_, si) => (
                  <span key={si} style={{ color: si < t.rating ? "#f59e0b" : T.textDim, fontSize: "14px" }} aria-hidden="true">★</span>
                ))}
                <span className="sr-only">{t.rating} out of 5 stars</span>
              </div>
              <blockquote style={{ fontSize: "14px", lineHeight: 1.65, color: T.textMuted, fontStyle: "italic", margin: "0 0 20px" }}>
                "{t.quote}"
              </blockquote>
              <footer style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: `${t.color}30`, border: `1px solid ${t.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: 600, color: t.color, flexShrink: 0,
                }} aria-hidden="true">{t.initials}</div>
                <div>
                  <cite style={{ fontStyle: "normal", fontSize: "13px", fontWeight: 600, color: T.text }}>{t.name}</cite>
                  <div style={{ fontSize: "11px", color: T.textDim }}>{t.role}</div>
                </div>
              </footer>
            </article>
          ))}
        </div>
        <style>{`
          @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-33.33%)} }
          .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border-width:0; }
        `}</style>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FAQ — rich snippet ready
   ───────────────────────────────────────────── */
const FAQS = [
  { q: "How do I place a website order with Annek?",
    a: "Fill out our order form with your requirements — industry, design preferences, features — and our team responds within 24 hours with a full quote and timeline." },
  { q: "Can I use my own domain name?",
    a: "Absolutely. We connect your existing domain or help you register a new one as part of the order process. Domain setup is included in all our packages." },
  { q: "How long does it take to build my website?",
    a: "Standard websites are delivered within 72 hours. Complex projects (e-commerce, custom web apps) may take 5–10 business days. You'll receive a clear timeline upfront." },
  { q: "What types of websites does Annek build?",
    a: "We build business websites, portfolios, e-commerce stores, landing pages, booking systems, blogs, and custom web applications. Just describe your needs!" },
  { q: "Does my website include hosting and maintenance?",
    a: "Yes. All websites are hosted on fast, secure servers. We also offer ongoing maintenance plans to keep your site updated, secure, and performing optimally." },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section aria-label="Frequently asked questions" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 300, letterSpacing: "-1.5px", color: T.text, marginBottom: "48px" }}>
            Frequently asked questions
          </h2>
        </Reveal>
        <dl>
          {FAQS.map((f, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <div style={{ borderBottom: `1px solid ${T.border}` }}>
                <dt>
                  <button
                    aria-expanded={open === i}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(open === i ? null : i)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      width: "100%", textAlign: "left", background: "none", border: "none",
                      padding: "22px 0", cursor: "pointer", fontFamily: T.fontSans,
                      color: T.text, fontSize: "16px", fontWeight: 400,
                    }}
                  >
                    <span>{f.q}</span>
                    <span aria-hidden="true" style={{
                      fontSize: "22px", color: T.textDim, flexShrink: 0, marginLeft: "16px",
                      transform: open === i ? "rotate(45deg)" : "rotate(0)",
                      transition: "transform 0.3s",
                    }}>+</span>
                  </button>
                </dt>
                <dd
                  id={`faq-${i}`}
                  style={{
                    maxHeight: open === i ? "300px" : 0,
                    overflow: "hidden",
                    transition: "max-height 0.4s ease",
                    margin: 0,
                  }}
                >
                  <p style={{ fontSize: "15px", color: T.textMuted, lineHeight: 1.7, paddingBottom: "20px" }}>{f.a}</p>
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   ABOUT
   ───────────────────────────────────────────── */
function About() {
  const pillars = [
    { icon: "🎯", title: "Our Mission",  desc: "Make professional web design accessible to every business — regardless of size or technical expertise." },
    { icon: "💡", title: "Our Approach", desc: "We listen first. Every site starts with a deep understanding of your goals, audience, and brand identity." },
    { icon: "🚀", title: "Our Promise",  desc: "Fast delivery, unlimited revisions, ongoing support. We're not done until you're thrilled with the result." },
  ];

  return (
    <section
      id="about"
      aria-label="About Annek"
      style={{ padding: "100px 24px", background: `${T.bgCard}50` }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }} className="two-col">
          <Reveal>
            <Badge color={T.accent} style={{ marginBottom: "16px" }}>About Us</Badge>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 300, letterSpacing: "-1.5px", color: T.text, marginBottom: "24px" }}>
              We build websites that{" "}
              <em style={{ fontStyle: "italic", color: T.accent }}>work for you</em>
            </h2>
            <p style={{ fontSize: "15px", color: T.textMuted, lineHeight: 1.8, marginBottom: "20px" }}>
              Annek is a website-ordering platform where businesses and individuals commission
              fully custom-built websites — without the hassle of freelancers or complex agency contracts.
            </p>
            <p style={{ fontSize: "15px", color: T.textMuted, lineHeight: 1.8, marginBottom: "32px" }}>
              Our mission is simple: make professional web design accessible to everyone.
              Our expert team has delivered websites across 40+ industries worldwide.
            </p>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {pillars.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.15}>
                <GlassCard style={{ padding: "22px 24px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "24px", flexShrink: 0, marginTop: "2px" }} aria-hidden="true">{v.icon}</span>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: T.text, marginBottom: "6px" }}>{v.title}</h3>
                    <p style={{ fontSize: "13px", color: T.textMuted, lineHeight: 1.65 }}>{v.desc}</p>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CONTACT FORM — with sanitization
   ───────────────────────────────────────────── */
function sanitize(str) {
  // Basic XSS sanitization — strip HTML tags
  return String(str).replace(/<[^>]*>/g, "").trim().slice(0, 2000);
}

function Contact({ onOrder }) {
  const [cf, setCf] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null); // "loading" | "success" | "error"
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!cf.name.trim()) e.name = "Name is required";
    if (!cf.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
    if (cf.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setStatus("loading");
    try {
      const API = import.meta.env?.VITE_API_URL || "https://annek.tech/api";
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    sanitize(cf.name),
          email:   sanitize(cf.email),
          message: sanitize(cf.message),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch { setStatus("error"); }
  };

  const contacts = [
    { icon: "📧", label: "Email",    value: "annek.websitebuild.official@gmail.com", href: "mailto:annek.websitebuild.official@gmail.com" },
    { icon: "💬", label: "WhatsApp", value: "+94 701 269 689", href: "https://wa.me/94701269689" },
    { icon: "🌐", label: "Website",  value: "www.annek.tech", href: "https://www.annek.tech" },
  ];

  const inpStyle = {
    width: "100%", padding: "12px 16px",
    background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
    borderRadius: T.r3, fontSize: "14px", color: T.text,
    fontFamily: T.fontSans, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <section
      id="contact"
      aria-label="Contact Annek"
      style={{ padding: "100px 24px" }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 300, letterSpacing: "-1.5px", color: T.text }}>
              Get in touch
            </h2>
            <p style={{ fontSize: "15px", color: T.textMuted, marginTop: "14px", maxWidth: "400px", margin: "14px auto 0" }}>
              We respond within 24 hours. Or place a full order directly.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px" }} className="two-col">
          <Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {contacts.map(c => (
                <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  style={{ display: "flex", gap: "14px", alignItems: "flex-start", textDecoration: "none" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: T.r3,
                    background: `${T.accent}15`, border: `1px solid ${T.accent}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px", flexShrink: 0,
                  }} aria-hidden="true">{c.icon}</div>
                  <div>
                    <div style={{ fontSize: "11px", color: T.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "3px" }}>{c.label}</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: T.text, wordBreak: "break-word" }}>{c.value}</div>
                  </div>
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            {status === "success" ? (
              <div style={{ textAlign: "center", padding: "48px 0" }} role="alert" aria-live="polite">
                <div style={{ fontSize: "48px", marginBottom: "12px" }} aria-hidden="true">✅</div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: T.text }}>Message sent!</div>
                <div style={{ fontSize: "14px", color: T.textMuted, marginTop: "6px" }}>We'll get back to you within 24 hours.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate aria-label="Contact form">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }} className="form-two-col">
                  <div>
                    <label htmlFor="contact-name" style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600, display: "block", marginBottom: "6px" }}>Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      value={cf.name}
                      onChange={e => setCf(c => ({ ...c, name: e.target.value }))}
                      placeholder="Your name"
                      required
                      autoComplete="name"
                      maxLength={100}
                      style={{ ...inpStyle, borderColor: errors.name ? "#ef4444" : T.border }}
                      onFocus={e => { e.target.style.borderColor = T.accent; }}
                      onBlur={e => { e.target.style.borderColor = errors.name ? "#ef4444" : T.border; }}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <div id="name-error" role="alert" style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>{errors.name}</div>}
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600, display: "block", marginBottom: "6px" }}>Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      value={cf.email}
                      onChange={e => setCf(c => ({ ...c, email: e.target.value }))}
                      placeholder="you@email.com"
                      required
                      autoComplete="email"
                      maxLength={200}
                      style={{ ...inpStyle, borderColor: errors.email ? "#ef4444" : T.border }}
                      onFocus={e => { e.target.style.borderColor = T.accent; }}
                      onBlur={e => { e.target.style.borderColor = errors.email ? "#ef4444" : T.border; }}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <div id="email-error" role="alert" style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>{errors.email}</div>}
                  </div>
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label htmlFor="contact-message" style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600, display: "block", marginBottom: "6px" }}>Message</label>
                  <textarea
                    id="contact-message"
                    value={cf.message}
                    onChange={e => setCf(c => ({ ...c, message: e.target.value }))}
                    placeholder="How can we help you?"
                    required
                    rows={5}
                    maxLength={2000}
                    style={{ ...inpStyle, resize: "vertical", minHeight: "120px", borderColor: errors.message ? "#ef4444" : T.border }}
                    onFocus={e => { e.target.style.borderColor = T.accent; }}
                    onBlur={e => { e.target.style.borderColor = errors.message ? "#ef4444" : T.border; }}
                    aria-describedby={errors.message ? "msg-error" : undefined}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && <div id="msg-error" role="alert" style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>{errors.message}</div>}
                </div>
                {status === "error" && (
                  <div role="alert" style={{ background: "#ef444420", border: "1px solid #ef444440", borderRadius: T.r3, padding: "12px 16px", fontSize: "13px", color: "#fca5a5", marginBottom: "14px" }}>
                    Something went wrong. Please try again or contact us directly.
                  </div>
                )}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Button variant="primary" type="submit" disabled={status === "loading"} style={{ flex: 1, justifyContent: "center" }}>
                    {status === "loading" ? "Sending…" : "Send Message"}
                  </Button>
                  <Button variant="ghost" onClick={onOrder} type="button" style={{ flex: 1, justifyContent: "center" }}>
                    Place an Order
                  </Button>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) { .form-two-col { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA SECTION
   ───────────────────────────────────────────── */
function CTA({ onOrder }) {
  return (
    <section aria-label="Call to action" style={{ padding: "100px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "800px", height: "400px",
        background: `radial-gradient(ellipse, ${T.accentGlow} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <Reveal>
        <div style={{ position: "relative", maxWidth: "680px", margin: "0 auto" }}>
          <Badge color={T.lime} style={{ marginBottom: "20px" }}>Ready to get started?</Badge>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 68px)", fontWeight: 300, letterSpacing: "-2px", color: T.text, marginBottom: "16px" }}>
            Order your website{" "}
            <em style={{ fontStyle: "italic", color: T.lime }}>today</em>
          </h2>
          <p style={{ fontSize: "16px", color: T.textMuted, marginBottom: "44px" }}>
            Unlimited revisions · Expert support · 72hr delivery
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Button variant="lime" onClick={onOrder} style={{ fontSize: "17px", padding: "16px 48px" }}>
              Start Your Order ✦
            </Button>
            <Button variant="ghost" onClick={() => document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" })}>
              View Pricing
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────────── */
function Footer() {
  return (
    <footer role="contentinfo" style={{ background: "rgba(0,0,0,0.4)", borderTop: `1px solid ${T.border}`, padding: "56px 24px 40px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "40px", marginBottom: "48px" }} className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{
                width: "26px", height: "26px", borderRadius: "7px",
                background: `linear-gradient(135deg, ${T.accent}, #a78bfa)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", color: "#fff", fontWeight: 700
              }} aria-hidden="true">A</span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: T.text }}>Annek</span>
            </div>
            <p style={{ fontSize: "14px", color: T.textDim, lineHeight: 1.7, maxWidth: "240px" }}>
              Custom websites built to order. Tell us your vision and we'll bring it to life.
            </p>
          </div>
          {[
            { title: "Services", links: ["Portfolio Sites", "E-Commerce", "Booking Sites", "Education Websites", "Clubs & Associations"] },
            { title: "Company",  links: ["About Us", "How It Works", "Portfolio", "Pricing"] },
            { title: "Support",  links: ["Contact Us", "FAQ", "Privacy Policy", "Terms"] },
          ].map(col => (
            <nav key={col.title} aria-label={`${col.title} links`}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>{col.title}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map(l => (
                  <li key={l}>
                    <a style={{ fontSize: "13px", color: T.textDim, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => { e.target.style.color = T.text; }}
                      onMouseLeave={e => { e.target.style.color = T.textDim; }}
                    >{l}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div style={{ height: "1px", background: T.border, marginBottom: "28px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ fontSize: "13px", color: T.textDim }}>
            <small>© 2026 Annek. All rights reserved.</small>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <a key={l} style={{ fontSize: "13px", color: T.textDim, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => { e.target.style.color = T.text; }}
                onMouseLeave={e => { e.target.style.color = T.textDim; }}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { .two-col { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   SEO HEAD INJECTOR
   ───────────────────────────────────────────── */
function SEOHead() {
  useEffect(() => {
    // Dynamic meta injection — for SPA (use Next.js <Head> or React Helmet in production)
    document.title = "Annek — Custom Website Design & Development | 72hr Delivery";

    const setMeta = (attr, val, content) => {
      let el = document.querySelector(`meta[${attr}="${val}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, val); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
      el.setAttribute("href", href);
    };

    // Core meta
    setMeta("name", "description", "Professional custom website design and development. Portfolio sites, e-commerce, booking systems — delivered in 72 hours starting at $75. Get a quote in 24hrs.");
    setMeta("name", "keywords", "website design, web development, custom website, e-commerce website, portfolio website, booking website, affordable web design, 72 hour website");
    setMeta("name", "author", "Annek");
    setMeta("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Open Graph
    setMeta("property", "og:type",        "website");
    setMeta("property", "og:title",       "Annek — Custom Website Design & Development");
    setMeta("property", "og:description", "Portfolio sites, e-commerce, booking systems — delivered in 72 hours from $75.");
    setMeta("property", "og:url",         "https://annek.tech");
    setMeta("property", "og:image",       "https://annek.tech/og-image.png");
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height","630");
    setMeta("property", "og:site_name",   "Annek");
    setMeta("property", "og:locale",      "en_US");

    // Twitter / X
    setMeta("name", "twitter:card",        "summary_large_image");
    setMeta("name", "twitter:title",       "Annek — Custom Website Design & Development");
    setMeta("name", "twitter:description", "Portfolio sites, e-commerce, booking systems — delivered in 72 hours from $75.");
    setMeta("name", "twitter:image",       "https://annek.tech/og-image.png");

    // Canonical
    setLink("canonical", "https://annek.tech");

    // AI search / LLM optimization
    setMeta("name", "description-ai", "Annek is a website design and development agency. We build custom portfolio sites, e-commerce stores, booking websites, and business websites. Prices start at $75 and delivery is within 72 hours. Contact us at annek.websitebuild.official@gmail.com.");

    // JSON-LD schemas
    const injectSchema = (data, id) => {
      let el = document.getElementById(id);
      if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = id; document.head.appendChild(el); }
      el.textContent = JSON.stringify(data);
    };
    injectSchema(SCHEMA.organization, "schema-org");
    injectSchema(SCHEMA.website,      "schema-website");
    injectSchema(SCHEMA.service,      "schema-service");
    injectSchema(SCHEMA.faq,          "schema-faq");

    return () => {};
  }, []);
  return null;
}

/* ─────────────────────────────────────────────
   GLOBAL CSS — performance-first
   ───────────────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: ${T.bg};
    color: ${T.text};
    font-family: ${T.fontSans};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }
  :focus-visible {
    outline: 2px solid ${T.accent};
    outline-offset: 3px;
    border-radius: 4px;
  }
  img { display: block; max-width: 100%; height: auto; }
  button { font-family: inherit; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/* ─────────────────────────────────────────────
   ORDER MODAL (slim version — expand as needed)
   ───────────────────────────────────────────── */
function OrderModal({ onClose }) {
  const [step, setStep] = useState(1);
  const TOTAL = 7;
  const [contact, setContact] = useState({ name: "", email: "", company: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleQuickSubmit = async () => {
    if (!contact.name || !contact.email) return;
    setLoading(true);
    try {
      const API = import.meta.env?.VITE_API_URL || "https://annek.tech/api";
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sanitize(contact.name), email: sanitize(contact.email), company: sanitize(contact.company), status: "pending" }),
      });
      if (res.ok) setSubmitted(true);
    } catch { setSubmitted(true); }
    setLoading(false);
  };

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-title"
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: T.bgCard, borderRadius: T.r5,
        border: `1px solid ${T.border}`,
        width: "100%", maxWidth: "560px",
        padding: "40px", position: "relative",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: `0 40px 100px rgba(0,0,0,0.5), 0 0 60px ${T.accentGlow}`,
      }}>
        <button
          onClick={onClose}
          aria-label="Close order form"
          style={{
            position: "absolute", top: "18px", right: "18px",
            background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`,
            borderRadius: "50%", width: "32px", height: "32px",
            color: T.textMuted, cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>

        {!submitted ? (
          <>
            <div style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "11px", color: T.accent, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
                Website Order Form
              </div>
              <h2 id="order-title" style={{ fontSize: "22px", fontWeight: 700, color: T.text, letterSpacing: "-0.3px" }}>
                Let's build your website
              </h2>
              <p style={{ fontSize: "13px", color: T.textDim, marginTop: "6px" }}>
                Fill in your details and we'll send a full quote within 24 hours.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { id: "order-name",    label: "Full Name *",      key: "name",    type: "text",  ph: "Your name",        auto: "name"  },
                { id: "order-email",   label: "Email Address *",  key: "email",   type: "email", ph: "you@email.com",    auto: "email" },
                { id: "order-company", label: "Company / Brand",  key: "company", type: "text",  ph: "Optional",         auto: "organization" },
              ].map(({ id, label, key, type, ph, auto }) => (
                <div key={key}>
                  <label htmlFor={id} style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600, display: "block", marginBottom: "6px" }}>{label}</label>
                  <input
                    id={id} type={type} value={contact[key]}
                    onChange={e => setContact(c => ({ ...c, [key]: e.target.value }))}
                    placeholder={ph} autoComplete={auto} maxLength={200}
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                      borderRadius: T.r3, fontSize: "14px", color: T.text,
                      fontFamily: T.fontSans, outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={e => { e.target.style.borderColor = T.accent; }}
                    onBlur={e => { e.target.style.borderColor = T.border; }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px", padding: "16px", background: `${T.accent}08`, borderRadius: T.r3, border: `1px solid ${T.accent}20` }}>
              <p style={{ fontSize: "13px", color: T.textMuted, lineHeight: 1.6 }}>
                <strong style={{ color: T.text }}>What happens next:</strong> After you submit,
                our team reviews your needs and sends a detailed quote within 24 hours with timeline,
                pricing, and a link to complete the full requirements form.
              </p>
            </div>

            <Button
              variant="lime"
              onClick={handleQuickSubmit}
              disabled={!contact.name || !contact.email || loading}
              style={{ width: "100%", justifyContent: "center", marginTop: "20px", fontSize: "15px", padding: "14px" }}
            >
              {loading ? "Submitting…" : "Get a Free Quote ✦"}
            </Button>

            <p style={{ fontSize: "12px", color: T.textDim, textAlign: "center", marginTop: "14px" }}>
              No commitment. No spam. We'll only contact you about your website.
            </p>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0" }} role="status" aria-live="polite">
            <div style={{ fontSize: "52px", marginBottom: "16px" }} aria-hidden="true">🎉</div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: T.text, marginBottom: "12px" }}>Request Received!</h2>
            <p style={{ fontSize: "15px", color: T.textMuted, lineHeight: 1.7, marginBottom: "28px" }}>
              Thank you, <strong style={{ color: T.text }}>{contact.name}</strong>!
              We'll reach out to <strong style={{ color: T.text }}>{contact.email}</strong> within 24 hours
              with a full quote and timeline.
            </p>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT APP
   ───────────────────────────────────────────── */
const API = import.meta.env?.VITE_API_URL || "https://annek.tech/api";

export default function AnnekPremium() {
  const [showOrder, setShowOrder] = useState(false);
  const [portfolio,  setPortfolio] = useState([]);
  const [reviews,    setReviews]   = useState([]);
  const [settings,   setSettings]  = useState({ testimonialsTitle: "Trusted by businesses worldwide" });

  useEffect(() => {
    // Parallel fetches — non-blocking
    Promise.allSettled([
      fetch(`${API}/portfolio`).then(r => r.json()),
      fetch(`${API}/feedback`).then(r => r.json()),
      fetch(`${API}/settings`).then(r => r.json()),
    ]).then(([port, rev, sett]) => {
      if (port.status === "fulfilled") setPortfolio(port.value.filter(p => p.visible));
      if (rev.status  === "fulfilled") setReviews(rev.value);
      if (sett.status === "fulfilled" && sett.value?.testimonialsTitle) setSettings(sett.value);
    });
  }, []);

  return (
    <>
      <SEOHead />
      <style>{GLOBAL_CSS}</style>

      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        style={{
          position: "absolute", top: "-100px", left: "24px", zIndex: 9999,
          background: T.accent, color: "#fff", padding: "12px 20px",
          borderRadius: T.r2, fontSize: "14px", fontWeight: 600,
          transition: "top 0.2s", textDecoration: "none",
        }}
        onFocus={e => { e.target.style.top = "8px"; }}
        onBlur={e => { e.target.style.top = "-100px"; }}
      >
        Skip to main content
      </a>

      <Nav onOrder={() => setShowOrder(true)} />

      <main id="main-content">
        <Hero       onOrder={() => setShowOrder(true)} />
        <Ticker />
        <Stats />
        <HowItWorks onOrder={() => setShowOrder(true)} />
        <Features />
        <Portfolio  projects={portfolio} onOrder={() => setShowOrder(true)} />
        <Pricing    onOrder={() => setShowOrder(true)} />
        <Reviews    reviews={reviews} settings={settings} />
        <FAQ />
        <About />
        <Contact    onOrder={() => setShowOrder(true)} />
        <CTA        onOrder={() => setShowOrder(true)} />
      </main>

      <Footer />

      {showOrder && <OrderModal onClose={() => setShowOrder(false)} />}

      {/* WhatsApp FAB */}
      <a
        href="https://wa.me/94701269689"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Annek on WhatsApp"
        style={{
          position: "fixed", bottom: "28px", right: "28px", zIndex: 900,
          width: "52px", height: "52px", borderRadius: "50%",
          background: "linear-gradient(135deg, #25d366, #128c7e)",
          boxShadow: "0 8px 24px rgba(37,211,102,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s",
          fontSize: "22px",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <svg viewBox="0 0 32 32" width="26" height="26" fill="none" aria-hidden="true">
          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.504L4 29l7.697-1.807A12.94 12.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="#fff"/>
          <path d="M22.003 19.44c-.32-.16-1.89-.932-2.183-1.04-.293-.107-.507-.16-.72.16-.214.32-.828 1.04-1.015 1.254-.187.213-.373.24-.694.08-.32-.16-1.352-.499-2.574-1.588-.952-.85-1.594-1.899-1.781-2.22-.187-.32-.02-.493.14-.652.144-.143.32-.373.48-.56.16-.186.213-.32.32-.533.107-.214.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.26-.624-.524-.54-.72-.55l-.614-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.666s1.147 3.093 1.307 3.307c.16.213 2.062 3.148 4.996 4.413.698.302 1.243.482 1.668.617.702.222 1.341.19 1.846.115.56-.084 1.716-.7 1.958-1.376.242-.676.242-1.255.169-1.376-.073-.12-.266-.193-.556-.338z" fill="#25d366"/>
        </svg>
      </a>
    </>
  );
}

/**
 * ═══════════════════════════════════════════════════════
 * SECURITY NOTES (implement in backend / vercel.json)
 * ═══════════════════════════════════════════════════════
 * 
 * Content-Security-Policy:
 *   default-src 'self';
 *   script-src 'self' 'nonce-{NONCE}' https://fonts.googleapis.com;
 *   style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
 *   img-src 'self' data: https://res.cloudinary.com;
 *   connect-src 'self' https://api.anthropic.com;
 *   frame-ancestors 'none';
 * 
 * Other security headers to add in vercel.json:
 *   X-Frame-Options: DENY
 *   X-Content-Type-Options: nosniff
 *   Referrer-Policy: strict-origin-when-cross-origin
 *   Permissions-Policy: camera=(), microphone=(), geolocation=()
 *   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
 * 
 * Backend rate limiting (express-rate-limit):
 *   /api/orders    → 10 requests / hour per IP
 *   /api/contact   → 5 requests / hour per IP
 *   /api/feedback  → 10 requests / hour per IP
 *   /api/*         → 100 requests / 15min per IP (global)
 * 
 * Input sanitization: all inputs sanitized via sanitize() above
 * CSRF: use csurf middleware for form endpoints
 * Auth: Firebase Auth already in place (keep tokens server-verified)
 * 
 * ═══════════════════════════════════════════════════════
 * PERFORMANCE NOTES
 * ═══════════════════════════════════════════════════════
 * 
 * LCP optimization:
 *   - Add fetchPriority="high" on hero images
 *   - Preload hero font: <link rel="preload" as="font" href="..." crossorigin>
 *   - Use Next.js Image with priority for above-fold images
 * 
 * CLS optimization:
 *   - Skeleton loaders on portfolio grid (already implemented)
 *   - Explicit width/height on all img tags (already implemented)
 *   - Reserve layout space with min-height on dynamic sections
 * 
 * INP optimization:
 *   - All event handlers are lightweight (no heavy sync work)
 *   - Fetch calls are async and non-blocking
 *   - Animations use CSS transitions (GPU-composited)
 * 
 * ═══════════════════════════════════════════════════════
 * SEO / AI SEARCH OPTIMIZATION
 * ═══════════════════════════════════════════════════════
 * 
 * AI search (ChatGPT, Gemini, Perplexity) optimization:
 *   - Clear entity description in meta description
 *   - JSON-LD Organization schema with all contact details
 *   - FAQ schema for featured snippet inclusion
 *   - Dense, specific factual content (prices, delivery times, locations)
 *   - Semantic HTML5 (header, main, section, article, footer, nav)
 *   - aria-label on all sections for context
 * 
 * ═══════════════════════════════════════════════════════
 */
