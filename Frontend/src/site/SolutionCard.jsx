/* One solution card. Used on /solutions/:category and as the live preview in Admin › Solutions. */
import "./solution-card.css";
import { cld, cldSrcSet } from "../utils/media";

export default function SolutionCard({ item, onOpen, preview = false }) {
  const cover = item.images?.[0];
  return (
    <button type="button" className="sol-card" onClick={onOpen} aria-haspopup={preview ? undefined : "dialog"} tabIndex={preview ? -1 : undefined}>
      <span className="sol-cover">
        {cover
          ? <img src={cld(cover, 800)} srcSet={cldSrcSet(cover)} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 400px" alt="" loading={preview ? "eager" : "lazy"} decoding="async" width="800" height="600" />
          : <span aria-hidden="true">{(item.title || "?")[0]}</span>}
      </span>
      <span className="sol-card-body">
        <span className="sol-card-title" role={preview ? undefined : "heading"} aria-level={preview ? undefined : 2}>{item.title || "Untitled solution"}</span>
        {item.purpose && <span className="sol-card-purpose">{item.purpose}</span>}
        <span className="sol-card-more">View details →</span>
      </span>
    </button>
  );
}
