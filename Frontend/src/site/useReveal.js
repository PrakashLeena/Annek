import { useEffect } from "react";

/* Fades sections in as they scroll into view. Re-scans when the page or its data changes. */
export default function useReveal(deps) {
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
