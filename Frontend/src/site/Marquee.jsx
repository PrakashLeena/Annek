/* Seamless sideways auto-scroll (Portfolio, Ratings).
   - CSS translateX animation on two identical groups (no JS scroll loop); the track moves
     by exactly one group, so the loop has no seam.
   - Speed in px/s: the duration is measured from the group width.
   - The item set repeats inside each group until it is at least as wide as the viewport,
     so short lists still loop without a gap.
   - Pauses on hover and focus-within. Copies are aria-hidden and inert (not focusable).
   - prefers-reduced-motion: no animation, a normal horizontal scroll row (see site.css). */
import { useLayoutEffect, useRef, useState } from "react";

export default function Marquee({ items, keyOf, renderItem, speed = 35, reverse = false, label, className = "" }) {
  const wrapRef = useRef(null);
  const groupRef = useRef(null);
  const [repeat, setRepeat] = useState(1);
  const [duration, setDuration] = useState(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current, group = groupRef.current;
    if (!wrap || !group) return undefined;
    const measure = () => {
      const groupWidth = group.scrollWidth;
      if (!groupWidth) return;
      const oneSet = groupWidth / repeat;
      const need = Math.max(1, Math.min(12, Math.ceil(wrap.clientWidth / oneSet)));
      if (need !== repeat) { setRepeat(need); return; }
      setDuration(groupWidth / speed);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(group);
    return () => ro.disconnect();
  }, [repeat, speed, items]);

  const set = (copy, hidden) => items.map((it, i) => (
    <li key={`${copy}-${keyOf ? keyOf(it, i) : i}`} className="marquee-item" aria-hidden={hidden || undefined} inert={hidden || undefined}>
      {renderItem(it, i)}
    </li>
  ));
  const groups = (hiddenFirst) => Array.from({ length: repeat }, (_, r) => set(r, hiddenFirst || r > 0)).flat();

  return (
    // tabIndex: keyboard users can focus the region to pause it (the cards themselves may have nothing focusable).
    <div ref={wrapRef} className={`marquee ${reverse ? "marquee-rev" : ""} ${className}`} role="region" aria-label={label} tabIndex={0}
      style={duration ? { "--marquee-dur": `${duration.toFixed(2)}s` } : undefined}>
      <div className="marquee-track">
        <ul ref={groupRef} className="marquee-group">{groups(false)}</ul>
        <ul className="marquee-group" aria-hidden="true" inert>{groups(true)}</ul>
      </div>
    </div>
  );
}
