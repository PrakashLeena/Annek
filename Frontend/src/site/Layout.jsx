/* Shared shell for every public page: header, footer, floating buttons, order modal. */
import { lazy, Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import "./site.css";
import logoImg from "../images/annek-logo.webp";
import FeedbackWidget from "./FeedbackWidget";
import { WriteReviewButton } from "./GoogleReviews";
import { IconMenu, IconClose, IconWhatsApp } from "./icons";
import { useSiteData } from "./SiteData";
import { companyInfo } from "./content";
import { NAV, PAGES } from "../seo/pages";
import useReveal from "./useReveal";

const OrderModal = lazy(() => import("./OrderModal"));
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/* Firebase is only needed for the optional Google log in, so it loads after the page is up. */
const firebase = () => import("../firebase");

function useAuthUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    let unsub = () => {};
    let alive = true;
    const start = () => firebase().then((f) => { if (alive) unsub = f.onAuthStateChanged(f.auth, setUser); }).catch(() => {});
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
    idle(start);
    return () => { alive = false; unsub(); };
  }, []);
  return user;
}
const logIn = () => firebase().then((f) => f.signInWithGoogle());
const logOut = () => firebase().then((f) => f.logOut());

export default function Layout() {
  const { pathname, hash } = useLocation();
  const data = useSiteData();
  const { settings, products, portfolio, order, openOrder, closeOrder } = data;
  const user = useAuthUser();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // New page: close the menu and start at the top (unless the link targets an anchor).
  useEffect(() => {
    setMenuOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  useReveal([pathname, data.catalog, products, portfolio, data.feedback, data.google]);

  const company = companyInfo(settings);
  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || "").toLowerCase());
  // Products only appear once there is at least one to show.
  const nav = NAV.filter((k) => k !== "products" || products.length > 0).map((k) => PAGES[k]);
  const start = () => { setMenuOpen(false); openOrder(""); };

  return (
    <>
      <a href="#main" className="sr-only">Skip to content</a>

      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap nav-inner">
          <Link to="/" className="nav-logo" aria-label="Annek home">
            <img src={logoImg} alt="Annek" width="82" height="38" fetchPriority="high" />
          </Link>
          <nav className="nav-links" aria-label="Main">
            {nav.map((p) => <NavLink key={p.path} to={p.path}>{p.nav}</NavLink>)}
          </nav>
          <div className="nav-right">
            {user ? (
              <div className="nav-user hide-sm">
                {isAdmin && <a href="/admin" className="btn btn-soft btn-sm">Admin</a>}
                {user.photoURL && <img src={user.photoURL} alt="" width="32" height="32" referrerPolicy="no-referrer" />}
                <button type="button" className="link-btn" style={{ color: "var(--ink)", fontWeight: 500 }} onClick={logOut}>Log out</button>
              </div>
            ) : (
              <button type="button" className="link-btn hide-sm" style={{ color: "var(--ink)", fontWeight: 500, padding: "10px 8px" }} onClick={logIn}>Log in</button>
            )}
            <button type="button" className="btn btn-ink btn-sm" onClick={start}>Start a project</button>
            <button type="button" className="nav-burger" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((o) => !o)}>
              {menuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
            {nav.map((p) => <NavLink key={p.path} to={p.path}>{p.nav}</NavLink>)}
            {isAdmin && <a href="/admin">Admin panel</a>}
            {user ? <button type="button" onClick={logOut}>Log out</button> : <button type="button" onClick={logIn}>Log in</button>}
          </nav>
        )}
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
            <img src={logoImg} alt="Annek" width="73" height="34" loading="lazy" />
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{company.tagline}</p>
            <WriteReviewButton className="btn btn-soft btn-sm footer-review">Write a Google review</WriteReviewButton>
          </div>
          <nav aria-label="Footer">
            <Link to="/">Home</Link>
            {nav.map((p) => <Link key={p.path} to={p.path}>{p.nav}</Link>)}
            <Link to={PAGES.faq.path}>{PAGES.faq.nav}</Link>
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
