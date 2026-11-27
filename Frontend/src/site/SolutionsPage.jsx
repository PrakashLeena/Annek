/* /solutions/:category — public showcase of pre-designed solutions (Admin › Solutions). */
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./site.css";
import logoImg from "../images/annek-logo.webp";
import NotFound from "../NotFound.jsx";
import SolutionCard from "./SolutionCard.jsx";
import { IconClose } from "./icons";
import { CATEGORY_INFO, cld, cldSrcSet, videoEmbed, videoPoster } from "../utils/media";

const API = import.meta.env.VITE_API_URL || "/api";
const SITE = "https://annek.tech";

export default function SolutionsPage() {
  const { category } = useParams();
  const info = CATEGORY_INFO[category];
  if (!info) return <NotFound />;
  return <Showcase key={info.slug} info={info} />;
}

/** Sets title, description and canonical for this page; restores them on leave. */
function usePageMeta(title, description, path) {
  useEffect(() => {
    const set = (sel, attr, value, create) => {
      let el = document.head.querySelector(sel);
      let made = false;
      if (!el && create) { el = create(); document.head.appendChild(el); made = true; }
      if (!el) return () => {};
      const prev = el.getAttribute(attr);
      el.setAttribute(attr, value);
      return () => { if (made) el.remove(); else if (prev === null) el.removeAttribute(attr); else el.setAttribute(attr, prev); };
    };
    const meta = (name) => () => { const m = document.createElement("meta"); m.setAttribute("name", name); return m; };
    const prevTitle = document.title;
    document.title = title;
    const undo = [
      set('meta[name="description"]', "content", description, meta("description")),
      set('link[rel="canonical"]', "href", SITE + path, () => { const l = document.createElement("link"); l.rel = "canonical"; return l; }),
      set('meta[property="og:url"]', "content", SITE + path),
      set('meta[property="og:title"]', "content", title),
      set('meta[property="og:description"]', "content", description),
    ];
    return () => { document.title = prevTitle; undo.forEach((f) => f()); };
  }, [title, description, path]);
}

function Showcase({ info }) {
  const [items, setItems] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(null);
  const [customize, setCustomize] = useState(""); // solution title preselected in the form (Task 4)
  const lastCard = useRef(null);

  usePageMeta(`${info.title} | Annek`, info.intro, `/solutions/${info.slug}`);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/solutions?category=${info.slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => { if (alive) setItems(Array.isArray(d) ? d : []); })
      .catch(() => { if (alive) { setItems([]); setFailed(true); } });
    return () => { alive = false; };
  }, [info.slug]);

  const openItem = (item, el) => { lastCard.current = el; setOpen(item); };
  const close = () => { setOpen(null); lastCard.current?.focus(); };
  const startCustomize = (title) => {
    setOpen(null);
    setCustomize(title);
    requestAnimationFrame(() => document.getElementById("customize")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <>
      <header className="nav scrolled">
        <div className="wrap nav-inner">
          <Link to="/" className="nav-logo" aria-label="Annek home"><img src={logoImg} alt="Annek" width="82" height="38" /></Link>
          <nav className="nav-links sol-cats" aria-label="Solution categories">
            {Object.values(CATEGORY_INFO).map((c) => (
              <Link key={c.slug} to={`/solutions/${c.slug}`} aria-current={c.slug === info.slug ? "page" : undefined}>{c.label}</Link>
            ))}
          </nav>
          <div className="nav-right">
            <a href="#customize" className="btn btn-ink btn-sm" onClick={(e) => { e.preventDefault(); startCustomize(""); }}>Customize</a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="section sol-hero">
          <div className="wrap">
            <Link to="/#solutions" className="sol-back">← All services</Link>
            <div className="eyebrow">{info.label}</div>
            <h1 className="h2">{info.title}</h1>
            <p className="lead">{info.intro}</p>
            <nav className="sol-cats-sm" aria-label="Solution categories">
              {Object.values(CATEGORY_INFO).map((c) => (
                <Link key={c.slug} to={`/solutions/${c.slug}`} className="chip" aria-current={c.slug === info.slug ? "page" : undefined}>{c.label}</Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="section sol-list" aria-label={`${info.label} solutions`}>
          <div className="wrap">
            {items === null ? (
              <div className="sol-grid" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="sol-skel" />)}</div>
            ) : items.length === 0 ? (
              <div className="sol-empty card" role="status">
                <b>Solutions coming soon.</b>
                <span>Tell us what you need below.</span>
                {failed && <small>We could not load solutions right now.</small>}
              </div>
            ) : (
              <ul className="sol-grid">
                {items.map((it) => (
                  <li key={it._id}>
                    <SolutionCard item={it} onOpen={(e) => openItem(it, e.currentTarget)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section id="customize" className="section tint sol-customize" aria-labelledby="customize-title">
          <div className="wrap">
            <h2 className="h2" id="customize-title">Customize this for your business</h2>
            <p className="lead">Tell us which solution you like and what you need changed{customize ? ` for “${customize}”` : ""}. We reply within 24 hours.</p>
            <p><a className="btn btn-orange" href="/#contact">Contact us</a></p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <img src={logoImg} alt="Annek" width="73" height="34" loading="lazy" />
          <nav aria-label="Footer"><Link to="/">Home</Link>{Object.values(CATEGORY_INFO).map((c) => <Link key={c.slug} to={`/solutions/${c.slug}`}>{c.label}</Link>)}</nav>
          <small>© {new Date().getFullYear()} Annek</small>
        </div>
      </footer>

      {open && <Detail item={open} info={info} onClose={close} onCustomize={startCustomize} />}
    </>
  );
}

function Detail({ item, info, onClose, onCustomize }) {
  const [idx, setIdx] = useState(0);
  const closeRef = useRef(null);
  const images = item.images || [];
  const embed = videoEmbed(item.video);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft" && images.length > 1) setIdx((i) => (i - 1 + images.length) % images.length);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose, images.length]);

  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sol-modal" role="dialog" aria-modal="true" aria-labelledby="sol-detail-title">
        <button ref={closeRef} type="button" className="modal-x" aria-label="Close details" onClick={onClose}><IconClose size={18} /></button>
        <div className="sol-modal-body">
          <div className="eyebrow">{info.label}</div>
          <h2 id="sol-detail-title" className="sol-detail-title">{item.title}</h2>
          {item.purpose && <p className="lead">{item.purpose}</p>}

          {images.length > 0 && (
            <div className="sol-gallery">
              <div className="sol-gallery-main">
                <img src={cld(images[idx], 1400)} srcSet={cldSrcSet(images[idx], [600, 1000, 1400, 1920])} sizes="(max-width: 900px) 100vw, 860px" alt={`${item.title}, image ${idx + 1} of ${images.length}`} decoding="async" />
              </div>
              {images.length > 1 && (
                <div className="sol-thumbs" role="group" aria-label="Choose image">
                  {images.map((src, i) => (
                    <button key={src} type="button" aria-pressed={i === idx} aria-label={`Image ${i + 1}`} onClick={() => setIdx(i)}>
                      <img src={cld(src, 200)} alt="" loading="lazy" width="96" height="72" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {item.video && (
            <div className="sol-video">
              {embed
                ? <iframe src={embed} title={`${item.title} video`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
                : <video controls playsInline preload="metadata" poster={videoPoster(item.video) || (images[0] && cld(images[0], 1280))}><source src={item.video} /></video>}
            </div>
          )}

          {item.description && <p className="sol-desc">{item.description}</p>}
        </div>
        <div className="sol-modal-foot">
          {info.slug === "web" && item.liveUrl && (
            <a className="btn btn-line" href={item.liveUrl} target="_blank" rel="noopener noreferrer">Live demo ↗</a>
          )}
          <button type="button" className="btn btn-orange" onClick={() => onCustomize(item.title)}>Customize this</button>
        </div>
      </div>
    </div>
  );
}
