/* Shown for any path that isn't a real page. Vercel serves dist/404.html for those with a real
   HTTP 404 status (scripts/prerender.mjs); noindex is kept as a second guard. */
import { usePrivateHead } from "./seo/useSeo";
import "./site/site.css";
import logoImg from "./images/annek-logo.webp";

/* `embedded`: shown inside the site layout (header and footer around it), e.g. an unknown project. */
export default function NotFound({ embedded = false }) {
  usePrivateHead("Page Not Found | Annek Software Development", "noindex");
  const Tag = embedded ? "div" : "main";

  return (
    <Tag className={`notfound ${embedded ? "notfound-embedded" : ""}`}>
      {!embedded && <a href="/" className="notfound-logo" aria-label="Annek home"><img src={logoImg} alt="Annek" width="86" height="40" /></a>}
      <div className="eyebrow">Error 404</div>
      <h1 className="h2">Page not found</h1>
      <p className="lead">The page you’re looking for doesn’t exist or has moved.</p>
      <a href="/" className="btn btn-orange">Back to home</a>
    </Tag>
  );
}
