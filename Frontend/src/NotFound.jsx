/* Shown for any path that isn't a real page. Vercel still answers 200 (SPA rewrite),
   so this page tells search engines not to index it. */
import { useEffect } from "react";
import "./site/site.css";
import logoImg from "./images/annek-logo.webp";

export default function NotFound() {
  useEffect(() => {
    const prevTitle = document.title;
    let robots = document.querySelector('meta[name="robots"]');
    const created = !robots;
    if (created) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    const prevRobots = robots.content;
    robots.content = "noindex";
    document.title = "Page Not Found | Annek Software Development";
    return () => {
      document.title = prevTitle;
      if (created) robots.remove();
      else robots.content = prevRobots;
    };
  }, []);

  return (
    <main className="notfound">
      <a href="/" className="notfound-logo" aria-label="Annek home"><img src={logoImg} alt="Annek" height="40" /></a>
      <div className="eyebrow">Error 404</div>
      <h1 className="h2">Page not found</h1>
      <p className="lead">The page you’re looking for doesn’t exist or has moved.</p>
      <a href="/" className="btn btn-orange">Back to home</a>
    </main>
  );
}
