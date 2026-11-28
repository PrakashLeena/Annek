/* AutoScroller — a row that scrolls itself slowly and can also be swiped, dragged and stepped.
   Used by the Portfolio and Trusted By rows (replaces the CSS translateX marquee).

   - The track is a real horizontal scroller (overflow-x: auto), so touch swipes and momentum are
     native and vertical page scrolling still works (touch-action: pan-x pan-y).
   - Auto-scroll: a requestAnimationFrame loop moves scrollLeft at `speed` px/s (`reverse` = leftwards).
   - Seamless loop: the items are rendered in three sets; the middle one is the real one. Whenever
     scrollLeft leaves the middle set it jumps by exactly one set width, in either direction.
     The other sets are aria-hidden and nothing in them is keyboard focusable.
   - Pauses while hovered, focused, touched or dragged (resumes ~3 s after the last interaction),
     off screen, and when the tab is hidden.
   - Mouse: click and drag with light momentum. A drag of more than 6 px cancels the click.
   - Arrow buttons and the Left/Right keys move by one card.
   - prefers-reduced-motion: no auto-scroll and no copies: a plain swipeable row with snap and arrows.
   The server and the first client render show a single set, so hydration always matches. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const SETS = 3;
const RESUME_MS = 3000;
const DRAG_PX = 6;
// useLayoutEffect warns during server rendering in older React; this keeps it quiet everywhere.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function AutoScroller({ items, keyOf, renderItem, speed = 35, reverse = false, label, className = "" }) {
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const [mode, setMode] = useState("init"); // init (single set, SSR safe) | loop | static (reduced motion)
  const [fill, setFill] = useState(1); // repeats of the item list inside one set, so a set is wider than the view
  const [fits, setFits] = useState(false); // static mode: everything already visible, so no arrows
  // Interaction state lives across effect re-runs (new data, resize), so a re-run never resets it.
  const state = useRef({ pos: 0, hover: false, focus: false, resumeAt: 0 });
  // Re-run the engine only when the items really change, not when the parent passes a new array.
  const sig = items.map((it, i) => (keyOf ? keyOf(it, i) : i)).join("|");

  // Decide the mode once mounted.
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setMode(mq && mq.matches ? "static" : "loop");
    update();
    mq?.addEventListener?.("change", update);
    return () => mq?.removeEventListener?.("change", update);
  }, []);

  // A set must be at least as wide as the viewport or the loop would show a gap.
  useIsoLayoutEffect(() => {
    if (mode !== "loop") return undefined;
    const track = trackRef.current;
    const measure = () => {
      const first = track.querySelector('[data-set="0"][data-rep="0"]');
      const nextRep = track.querySelector('[data-set="0"][data-rep="1"]') || track.querySelector('[data-set="1"]');
      if (!first || !nextRep) return;
      const one = (nextRep.offsetLeft - first.offsetLeft);
      if (one > 0) {
        const need = Math.max(1, Math.min(12, Math.ceil(track.clientWidth / one)));
        setFill((f) => (f === need ? f : need));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [mode, sig]);

  // Reduced motion: hide the arrows when the row has nothing to scroll.
  useIsoLayoutEffect(() => {
    if (mode !== "static") return undefined;
    const track = trackRef.current;
    const measure = () => setFits(track.scrollWidth <= track.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [mode, sig]);

  const loop = mode === "loop";
  const sets = loop ? SETS : 1;
  const reps = loop ? fill : 1;
  const realSet = loop ? 1 : 0;

  // Engine: auto-scroll, wrapping, interaction pauses, mouse drag.
  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track || mode === "init") return undefined;
    const now = () => performance.now();
    const s = Object.assign(state.current, {
      last: 0, raf: 0, visible: true, hidden: document.hidden,
      ownScroll: -1, drag: null, momentum: 0, suppressClick: false,
      hover: wrap.matches(":hover"), focus: wrap.contains(document.activeElement),
    });
    const setWidth = () => {
      if (!loop) return 0;
      const a = track.querySelector('[data-set="0"][data-rep="0"]');
      const b = track.querySelector('[data-set="1"][data-rep="0"]');
      return a && b ? b.offsetLeft - a.offsetLeft : 0;
    };
    const setLeft = (x) => { s.pos = x; track.scrollLeft = x; s.ownScroll = track.scrollLeft; };
    // Keep scrollLeft inside the middle set (jump by exactly one set: looks identical).
    const wrapAround = () => {
      const w = setWidth();
      if (!w) return;
      if (track.scrollLeft < w * 0.5) setLeft(track.scrollLeft + w);
      else if (track.scrollLeft >= w * 1.5) setLeft(track.scrollLeft - w);
    };
    // Pause auto-scroll for `ms`. Card snap only starts once the row has really been scrolled by the
    // user: switching it on at a touch would shift the row under the finger and a tap could open the
    // neighbouring card.
    const interact = ({ snap = true, ms = RESUME_MS } = {}) => {
      s.resumeAt = now() + ms;
      if (snap) wrap.classList.add("as-active");
    };
    // Start inside the middle set (or stay where we are if already there).
    if (loop) {
      const w = setWidth();
      if (w && (track.scrollLeft < w * 0.5 || track.scrollLeft >= w * 1.5)) setLeft(w * (reverse ? 1.25 : 1));
      else s.pos = track.scrollLeft;
    }

    const running = () => loop && s.visible && !s.hidden && !s.hover && !s.focus && !s.drag && !s.momentum && now() >= s.resumeAt;
    const tick = (t) => {
      const dt = s.last ? Math.min(64, t - s.last) : 0;
      s.last = t;
      if (running()) {
        if (wrap.classList.contains("as-active")) { wrap.classList.remove("as-active"); s.pos = track.scrollLeft; }
        s.pos += (reverse ? -1 : 1) * speed * dt / 1000;
        track.scrollLeft = s.pos;
        s.ownScroll = track.scrollLeft;
        wrapAround();
      }
      s.raf = requestAnimationFrame(tick);
    };
    if (loop) s.raf = requestAnimationFrame(tick);

    // Any scroll we did not cause (swipe, wheel, trackpad, smooth arrow scroll) is the user.
    const onScroll = () => {
      if (Math.abs(track.scrollLeft - s.ownScroll) > 1) { interact(); s.pos = track.scrollLeft; }
      if (loop && !s.drag) wrapAround();
    };

    // Mouse drag (touch and pen scroll natively).
    const onDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(s.momentum); s.momentum = 0; wrap.classList.remove("as-gliding");
      s.drag = { x: e.clientX, left: track.scrollLeft, moved: false, v: 0, lastX: e.clientX, lastT: now(), id: e.pointerId };
    };
    const onMove = (e) => {
      const d = s.drag;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > DRAG_PX) {
        d.moved = true;
        track.setPointerCapture?.(e.pointerId);
        wrap.classList.add("as-dragging");
        interact();
      }
      if (!d.moved) return;
      const t = now();
      d.v = (e.clientX - d.lastX) / Math.max(1, t - d.lastT);
      d.lastX = e.clientX; d.lastT = t;
      track.scrollLeft = d.left - dx;
      s.ownScroll = track.scrollLeft;
      if (loop) { const before = track.scrollLeft; wrapAround(); d.left += track.scrollLeft - before; }
    };
    const onUp = (e) => {
      const d = s.drag;
      if (!d || e.pointerId !== d.id) return;
      s.drag = null;
      wrap.classList.remove("as-dragging");
      if (!d.moved) return;
      s.suppressClick = true; // the click that follows this drag must not open a card
      setTimeout(() => { s.suppressClick = false; }, 0);
      interact();
      // Light momentum.
      let v = -d.v * 16; // px per frame
      wrap.classList.add("as-gliding");
      const glide = () => {
        if (Math.abs(v) < 0.4) { s.momentum = 0; wrap.classList.remove("as-gliding"); interact(); return; }
        track.scrollLeft += v; s.ownScroll = track.scrollLeft; v *= 0.92;
        if (loop) wrapAround();
        s.momentum = requestAnimationFrame(glide);
      };
      s.momentum = requestAnimationFrame(glide);
    };
    const onClickCapture = (e) => { if (s.suppressClick) { e.preventDefault(); e.stopPropagation(); s.suppressClick = false; } };
    const noNativeDrag = (e) => e.preventDefault();
    const onTouch = () => interact({ snap: false }); // touchstart: pause only; a real swipe then fires scroll events

    const onEnter = (e) => { if (e.pointerType === "mouse") s.hover = true; };
    const onLeave = (e) => { if (e.pointerType === "mouse") { s.hover = false; s.resumeAt = Math.max(s.resumeAt, now() + 600); } };
    const onFocusIn = () => { s.focus = true; };
    const onFocusOut = (e) => { if (!wrap.contains(e.relatedTarget)) { s.focus = false; interact(); } };
    const onVis = () => { s.hidden = document.hidden; s.last = 0; };
    const io = new IntersectionObserver(([en]) => { s.visible = en.isIntersecting; s.last = 0; });
    io.observe(wrap);

    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
    track.addEventListener("click", onClickCapture, true);
    track.addEventListener("dragstart", noNativeDrag);
    track.addEventListener("touchstart", onTouch, { passive: true });
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("focusin", onFocusIn);
    wrap.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onVis);
    wrap.__asInteract = interact; // for the arrow buttons below
    return () => {
      cancelAnimationFrame(s.raf); cancelAnimationFrame(s.momentum);
      io.disconnect();
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
      track.removeEventListener("click", onClickCapture, true);
      track.removeEventListener("dragstart", noNativeDrag);
      track.removeEventListener("touchstart", onTouch);
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("focusin", onFocusIn);
      wrap.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVis);
      delete wrap.__asInteract;
    };
  }, [mode, loop, fill, sig, speed, reverse]);

  // Copies are for looks only: hide them from assistive tech and keep them out of the tab order.
  useEffect(() => {
    trackRef.current?.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button, [aria-hidden="true"] [tabindex]')
      .forEach((el) => el.setAttribute("tabindex", "-1"));
  }, [mode, fill, sig]);

  const step = (dir) => {
    const track = trackRef.current;
    const item = track?.querySelector(".as-item");
    if (!track || !item) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    wrapRef.current.__asInteract?.();
    track.scrollBy({ left: dir * (item.getBoundingClientRect().width + gap), behavior: "smooth" });
  };
  const onKeyDown = (e) => {
    if (e.target !== trackRef.current) return;
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  };

  const cells = [];
  for (let set = 0; set < sets; set++) {
    for (let rep = 0; rep < reps; rep++) {
      const real = set === realSet && rep === 0;
      items.forEach((it, i) => cells.push(
        <li key={`${set}-${rep}-${keyOf ? keyOf(it, i) : i}`} className="as-item"
          data-set={i === 0 ? set : undefined} data-rep={i === 0 ? rep : undefined}
          aria-hidden={real ? undefined : "true"}>
          {renderItem(it, i)}
        </li>,
      ));
    }
  }

  return (
    <div ref={wrapRef} className={`as as-${mode} ${mode === "static" && fits ? "as-fits" : ""} ${className}`}>
      <button type="button" className="as-arrow as-prev" aria-label={`Previous ${label ? label.toLowerCase() : "item"}`} onClick={() => step(-1)}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div ref={trackRef} className="as-track" role="region" aria-label={label} tabIndex={0} onKeyDown={onKeyDown}>
        <ul className="as-list">{cells}</ul>
      </div>
      <button type="button" className="as-arrow as-next" aria-label={`Next ${label ? label.toLowerCase() : "item"}`} onClick={() => step(1)}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}
