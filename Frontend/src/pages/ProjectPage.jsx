/* /portfolio/:slug — one portfolio project. Data: GET /api/portfolio/:slug (published only).
   Pre-rendered pages start with the build-time copy (window.__ANNEK_DATA__.projects) and refresh it.
   Unknown or unpublished slug → branded 404 (noindex). An old slug → replaced by the current one. */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NotFound from "../NotFound.jsx";
import { useSiteData } from "../site/SiteData";
import { WorkCard } from "../site/sections";
import { cld, cldSrcSet, videoEmbed, videoPoster } from "../utils/media";
import { PROJECT_TYPES, projectPage } from "../seo/pages";
import { usePageHead } from "../seo/useSeo";
import useReveal from "../site/useReveal";

const API = import.meta.env.VITE_API_URL || "/api";

export default function ProjectRoute() {
  const { slug } = useParams();
  // A new slug is a new page: start from a clean state.
  return <ProjectPage key={slug} slug={(slug || "").toLowerCase()} />;
}

function ProjectPage({ slug }) {
  const data = useSiteData();
  const navigate = useNavigate();
  const initial = data.projects?.[slug] || null;
  const [state, setState] = useState(() => (initial ? { status: "ok", p: initial } : { status: "loading", p: null }));

  useEffect(() => {
    let alive = true;
    fetch(`${API}/portfolio/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 404) return setState({ status: "missing", p: null });
        if (!r.ok) throw new Error(String(r.status));
        const p = await r.json();
        if (!alive) return;
        if (p.slug && p.slug !== slug) return navigate(`/portfolio/${p.slug}`, { replace: true }); // old link
        setState({ status: "ok", p });
      })
      .catch(() => { if (alive) setState((s) => (s.p ? s : { status: "error", p: null })); });
    return () => { alive = false; };
  }, [slug, navigate]);

  const p = state.p;
  usePageHead(p ? projectPage(p) : null, data);
  useReveal([slug, state.status]);

  if (state.status === "missing") return <NotFound embedded />;
  if (!p) {
    return (
      <section className="section sol-hero page-hero" aria-busy={state.status === "loading"}>
        <div className="wrap">
          <Link to="/portfolio" className="sol-back">← All projects</Link>
          {state.status === "error"
            ? <p className="lead" role="alert">We could not load this project right now. <Link to="/portfolio">See all projects</Link>.</p>
            : <div className="pj-skel" aria-label="Loading project" />}
        </div>
      </section>
    );
  }
  return <Project p={p} />;
}

function Project({ p }) {
  const { portfolio, openOrder } = useSiteData();
  const kind = PROJECT_TYPES[p.type] || "";
  const label = kind || p.category || "Project";
  const images = p.images?.length ? p.images : (p.imageUrl ? [p.imageUrl] : []);
  const embed = videoEmbed(p.video);
  const paragraphs = (p.description || "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

  // Two or three other projects: same type first, then same category, then the rest.
  const rank = (w) => (p.type && w.type === p.type ? 0 : w.category === p.category ? 1 : 2);
  const more = portfolio.filter((w) => w.slug !== p.slug).map((w, i) => [rank(w), i, w]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, 3).map((x) => x[2]);

  return (
    <>
      <section className="section sol-hero page-hero pj-hero">
        <div className="wrap">
          <nav aria-label="Breadcrumb" className="crumbs">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/portfolio">Portfolio</Link></li>
              <li aria-current="page">{p.title}</li>
            </ol>
          </nav>
          <div className="eyebrow">{label}</div>
          <h1 className="h2">{p.title}</h1>
          {p.summary && <p className="lead">{p.summary}</p>}
          <ul className="pj-meta">
            {kind && p.category && <li><span>Category</span>{p.category}</li>}
            {p.client && <li><span>Client</span>{p.client}</li>}
            {p.year && <li><span>Year</span>{p.year}</li>}
          </ul>
          <div className="pj-actions">
            {p.liveUrl && <a className="btn btn-ink" href={p.liveUrl} target="_blank" rel="noopener">Visit live project ↗</a>}
            <button type="button" className="btn btn-orange" onClick={() => openOrder(`Similar to: ${p.title}`)}>Start a similar project</button>
          </div>
        </div>
      </section>

      {images.length > 0 && (
        <section className="pj-media" aria-label="Project images">
          <div className="wrap"><Gallery images={images} title={p.title} label={label} /></div>
        </section>
      )}

      {p.video && (
        <section className="pj-media" aria-label="Project video">
          <div className="wrap">
            <div className="sol-video pj-video">
              {embed
                ? <iframe src={embed} title={`${p.title} video`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
                : <video controls playsInline preload="metadata" poster={videoPoster(p.video) || (images[0] && cld(images[0], 1280))}><source src={p.video} /></video>}
            </div>
          </div>
        </section>
      )}

      {(paragraphs.length > 0 || p.techStack?.length > 0) && (
        <section className="section pj-body">
          <div className="wrap pj-cols">
            {paragraphs.length > 0 && (
              <div className="pj-desc">
                <h2 className="sub-h">About the project</h2>
                {paragraphs.map((t, i) => <p key={i}>{t}</p>)}
              </div>
            )}
            {p.techStack?.length > 0 && (
              <div>
                <h2 className="sub-h">Built with</h2>
                <ul className="pj-tags">{p.techStack.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section tint" aria-labelledby="more-title">
        <div className="wrap">
          <div className="head-row">
            <h2 className="h2" id="more-title">More projects</h2>
            <Link to="/portfolio" className="btn btn-line btn-sm">View more projects →</Link>
          </div>
          {more.length > 0 && <ul className="work-grid">{more.map((w) => <li key={w._id}><WorkCard w={w} /></li>)}</ul>}
          <div className="related-cta" style={{ marginTop: 36 }}>
            <button type="button" className="btn btn-orange" onClick={() => openOrder(`Similar to: ${p.title}`)}>Start a similar project</button>
            <Link to="/contact" className="btn btn-line">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* Native swipe on touch screens (scroll snap), arrow buttons on larger screens. */
function Gallery({ images, title, label }) {
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const go = (dir) => {
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * Math.max(0, Math.min(images.length - 1, index + dir)), behavior: "smooth" });
  };
  const onScroll = () => {
    const el = track.current;
    if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  };
  return (
    <div className="pj-gallery">
      <div ref={track} className="pj-track" onScroll={onScroll} onKeyDown={onKey} tabIndex={0} role="region" aria-roledescription="carousel" aria-label={`${title} images`}>
        {images.map((src, i) => (
          <figure key={src} className="pj-slide" aria-label={`Image ${i + 1} of ${images.length}`}>
            <img src={cld(src, 1400)} srcSet={cldSrcSet(src, [640, 1000, 1400, 1920])} sizes="(max-width: 1240px) 100vw, 1176px"
              alt={i === 0 ? `${title}, ${label} by Annek` : `${title}, image ${i + 1} of ${images.length}`}
              width="1400" height="875" decoding="async" draggable={false}
              loading={i === 0 ? undefined : "lazy"} fetchPriority={i === 0 ? "high" : undefined} />
          </figure>
        ))}
      </div>
      {images.length > 1 && (
        <div className="pj-controls">
          <button type="button" className="pj-arrow" aria-label="Previous image" disabled={index === 0} onClick={() => go(-1)}>←</button>
          <span className="pj-count" aria-live="polite">{index + 1} / {images.length}</span>
          <button type="button" className="pj-arrow" aria-label="Next image" disabled={index >= images.length - 1} onClick={() => go(1)}>→</button>
        </div>
      )}
    </div>
  );
}
