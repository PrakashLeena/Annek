/* Annek preloader — inlined by vite-plugin-preloader.js as a classic (non-module, non-deferred) <script> right after the markup.
   Config (data-* on #annek-preloader):
     data-theme  = "dark" | "light" | "auto"   (auto: html.dark / prefers-color-scheme)
     data-once   = "session" | "always"         (session: play once per browser tab session)
     data-ready  = "load" | "event"             (event: wait for window "annek:ready" — call AnnekPreloader.ready())
     data-max    = ms hard cap before the site is forced visible (default 6000)
   Events: window "annek:preloader-done" fires after removal. */
(function () {
  var el = document.getElementById("annek-preloader");
  if (!el) return;
  var root = document.documentElement;
  var cfg = {
    theme: el.dataset.theme || "dark",
    once: el.dataset.once || "session",
    ready: el.dataset.ready || "load",
    max: +el.dataset.max || 6000,
  };
  var KEY = "annek-preloader-seen";
  var done = false;

  function store(get) {
    try { return get ? sessionStorage.getItem(KEY) : sessionStorage.setItem(KEY, "1"); } catch { return null; }
  }
  function finish() {
    if (done) return; done = true;
    if (el.parentNode) el.parentNode.removeChild(el);
    root.classList.remove("ap-lock");
    store(false);
    window.dispatchEvent(new Event("annek:preloader-done"));
  }

  // Repeat visit in the same session: remove before first paint.
  if (cfg.once === "session" && store(true)) { finish(); window.AnnekPreloader = { ready: function () {}, skip: function () {} }; return; }

  if (cfg.theme === "auto") {
    var dark = root.classList.contains("dark") || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    el.dataset.theme = dark ? "dark" : "light";
  }
  root.classList.add("ap-lock");

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canAnimate = !!el.animate;

  // ---- page-ready signal ----
  var pageReady = false, readyCbs = [];
  function markReady() { if (pageReady) return; pageReady = true; readyCbs.forEach(function (f) { f(); }); }
  if (cfg.ready === "event") window.addEventListener("annek:ready", markReady, { once: true });
  else if (document.readyState === "complete") markReady();
  else window.addEventListener("load", markReady, { once: true });
  function whenReady(f) { pageReady ? f() : readyCbs.push(f); }

  // ---- spring easing -> CSS linear() (falls back to expo-out) ----
  function spring(damping, stiffness, mass) {
    var probe = "linear(0, 1)";
    if (!(window.CSS && CSS.supports && CSS.supports("animation-timing-function", probe))) return "cubic-bezier(.16,1,.3,1)";
    var x = 0, v = 0, dt = 1 / 120, pts = [], t = 0;
    for (var i = 0; i < 720; i++) { var a = (-stiffness * (x - 1) - damping * v) / mass; v += a * dt; x += v * dt; t += dt; pts.push(x); if (t > 0.4 && Math.abs(1 - x) < 0.001 && Math.abs(v) < 0.01) break; }
    var step = Math.max(1, Math.floor(pts.length / 48)), out = ["0"];
    for (var j = step; j < pts.length; j += step) out.push(pts[j].toFixed(4));
    out.push("1");
    return { easing: "linear(" + out.join(",") + ")", ms: Math.round(t * 1000) };
  }
  var S = {
    fly: spring(17, 62, 1),    // big sweeping entrance
    snap: spring(15, 150, 0.6), // letters
    smooth: spring(20, 90, 1), // domain
  };
  function sp(s, fallbackMs) { return typeof s === "string" ? { easing: s, ms: fallbackMs } : s; }

  var icon = el.querySelector(".ap-icon");
  var letters = el.querySelectorAll(".ap-l");
  var ring = el.querySelector(".ap-ring");
  var text = el.querySelector(".ap-text");
  var lines = el.querySelectorAll(".ap-line");
  var lockup = el.querySelector(".ap-lockup");
  var bar = el.querySelector(".ap-progress i");

  var exiting = false;
  function exit() {
    if (exiting) return; exiting = true;
    if (!canAnimate || reduce) {
      el.style.transition = "opacity .35s ease"; el.style.opacity = "0";
      return setTimeout(finish, 380);
    }
    if (bar) bar.style.transform = "scaleX(1)";
    lockup.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(.94)", opacity: 0 }],
      { duration: 380, easing: "cubic-bezier(.7,0,.84,0)", fill: "forwards" });
    var a = el.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }],
      { duration: 720, delay: 180, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" });
    a.onfinish = finish;
    // Finish events only fire on rendered frames; a tab that isn't painting (opened in the
    // background, occluded) could otherwise keep the page scroll-locked. finish() runs once.
    setTimeout(finish, 180 + 720 + 120);
  }

  // hard cap: never block the site longer than cfg.max
  var cap = setTimeout(function () { exit(); }, cfg.max);
  function exitWhenReady() {
    whenReady(function () { clearTimeout(cap); exit(); });
    if (!pageReady) {
      el.classList.add("ap-waiting");
      // gentle breathing + creeping progress while we wait
      if (canAnimate && !reduce) lockup.animate([{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }, { transform: "translateY(0)" }],
        { duration: 2800, iterations: Infinity, easing: "ease-in-out" });
      var p = 0.15, tick = setInterval(function () {
        if (pageReady || done) return clearInterval(tick);
        p += (0.9 - p) * 0.08; if (bar) bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
      }, 120);
    }
  }

  if (reduce || !canAnimate) { setTimeout(exitWhenReady, 600); window.AnnekPreloader = api(); return; }

  // ---------------- intro timeline (ms) ----------------
  var T = { land: 620, letters: 740, stagger: 85, domain: 1780, lines: 2000, end: 2500 };
  var fly = sp(S.fly, 700);
  icon.animate([
    { opacity: 0, transform: "translateX(-55vw) rotate(-42deg) scale(.5)", filter: "blur(8px) drop-shadow(0 0 0 transparent)" },
    { opacity: 1, offset: 0.18 },
    { opacity: 1, transform: "translateX(0) rotate(0) scale(1)", filter: "blur(0) drop-shadow(0 0 0 transparent)" },
  ], { duration: fly.ms, easing: fly.easing, fill: "forwards" });

  // Wiggle settle: damped jello on landing (individual rotate/scale compose with transform)
  var wr = [], ws = [];
  for (var k = 0; k <= 24; k++) {
    var t = (k / 24) * 0.8, dcy = Math.exp(-t * 5.2), w = Math.PI * 2 * 3.1 * t;
    wr.push({ rotate: (4.2 * dcy * Math.sin(w)).toFixed(3) + "deg" });
    var q = 0.035 * dcy * Math.cos(w); ws.push({ scale: (1 + q).toFixed(4) + " " + (1 - q).toFixed(4) });
  }
  icon.animate(wr, { duration: 800, delay: T.land });
  icon.animate(ws, { duration: 800, delay: T.land });
  // glow pulse on landing, settling to a soft halo
  icon.animate([
    { filter: "blur(0) drop-shadow(0 0 0 transparent)" },
    { filter: "blur(0) drop-shadow(0 0 42px var(--ap-glow))", offset: 0.25 },
    { filter: "blur(0) drop-shadow(0 0 18px var(--ap-glow))" },
  ], { duration: 1300, delay: T.land, easing: "ease-out", fill: "forwards" });
  ring.animate([
    { opacity: 0, transform: "translate(-50%,-50%) scale(.3)", borderWidth: "3px" },
    { opacity: 0.45, offset: 0.15 },
    { opacity: 0, transform: "translate(-50%,-50%) scale(2.9)", borderWidth: "1px" },
  ], { duration: 900, delay: T.land, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });

  var snap = sp(S.snap, 520);
  letters.forEach(function (l, i) {
    l.animate([
      { opacity: 0, transform: "translateX(-110%) rotate(-10deg) scale(.82)", filter: "blur(8px)" },
      { opacity: 1, offset: 0.35 },
      { opacity: 1, transform: "none", filter: "blur(0)" },
    ], { duration: snap.ms, delay: T.letters + i * T.stagger, easing: snap.easing, fill: "forwards" });
  });

  var smooth = sp(S.smooth, 800);
  text.animate([
    { opacity: 0, transform: "translateY(110%)", letterSpacing: ".6em", marginRight: "-.6em" },
    { opacity: 1, offset: 0.4 },
    { opacity: 1, transform: "translateY(0)", letterSpacing: ".24em", marginRight: "-.24em" },
  ], { duration: smooth.ms, delay: T.domain, easing: smooth.easing, fill: "forwards" });
  lines.forEach(function (ln) {
    ln.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: smooth.ms, delay: T.lines, easing: smooth.easing, fill: "forwards" });
  });

  setTimeout(exitWhenReady, T.end);
  window.AnnekPreloader = api();

  function api() {
    return {
      ready: function () { window.dispatchEvent(new Event("annek:ready")); },
      skip: function () { clearTimeout(cap); exit(); },
    };
  }
})();
