/* Google reviews (Places API (New) via our own /api/google-reviews; the key stays on the server).
   Attribution follows the Places policies: "Google Maps" text attribution (unaltered, translate="no"),
   author avatar + name + profile link on every review, a link to each review on Google Maps,
   and a short notice about how Google handles reviews. All review text is rendered as React
   text nodes, so it is escaped. */

import { GOOGLE_PROFILE_URL, GOOGLE_REVIEW_URL } from "../utils/googleRating";

const UGC_POLICY_URL = "https://support.google.com/contributionpolicy/answer/7422880";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function GoogleG({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function Stars({ value, size }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.round(v);
  return (
    <div className="stars" role="img" aria-label={`${Number.isInteger(v) ? v : v.toFixed(1)} out of 5 stars`} style={size ? { fontSize: size } : undefined}>
      <span aria-hidden="true">{"★".repeat(full)}</span>
      <span aria-hidden="true" className="stars-off">{"★".repeat(5 - full)}</span>
    </div>
  );
}

const ext = { target: "_blank", rel: "noopener noreferrer" };

export function WriteReviewButton({ className = "btn btn-orange btn-sm", children = "Write a review" }) {
  return (
    <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener" className={className}>
      <GoogleG size={16} />{children}
    </a>
  );
}

/* "Google Maps" text attribution, kept exactly as Google requires. */
const MapsAttribution = () => <span className="g-attr" translate="no">Google Maps</span>;

export function GoogleSummary({ data }) {
  const has = data && data.userRatingCount > 0 && typeof data.rating === "number";
  return (
    <div className="g-summary reveal">
      <div className="g-summary-main">
        <span className="g-summary-logo"><GoogleG size={28} /></span>
        {has ? (
          <div className="g-summary-score">
            <div className="g-summary-line"><b>{data.rating.toFixed(1)}</b><Stars value={data.rating} size={20} /></div>
            <span className="meta">Based on {data.userRatingCount} Google {data.userRatingCount === 1 ? "review" : "reviews"}</span>
          </div>
        ) : (
          <div className="g-summary-score">
            <b className="g-summary-cta">Worked with us?</b>
            <span className="meta">Share your experience on Google.</span>
          </div>
        )}
      </div>
      <div className="g-summary-actions">
        <WriteReviewButton />
        <a href={(has && data.googleMapsUri) || GOOGLE_PROFILE_URL} {...ext} className="btn btn-soft btn-sm">See all reviews on Google</a>
      </div>
      {has && (
        <p className="g-note">
          Ratings and reviews from <MapsAttribution />. Showing the reviews Google lists as most relevant. Reviews aren't verified by Google, but Google checks for and removes fake content when it's identified. <a href={UGC_POLICY_URL} {...ext}>Learn more</a>
        </p>
      )}
    </div>
  );
}

function Avatar({ review }) {
  const initial = (review.authorName || "G").trim().charAt(0).toUpperCase();
  const img = review.authorPhotoUri
    ? <img src={review.authorPhotoUri} alt="" width="40" height="40" loading="lazy" decoding="async" referrerPolicy="no-referrer"
        onError={(e) => { e.currentTarget.style.display = "none"; }} />
    : null;
  return <span className="g-avatar" aria-hidden="true"><span>{initial}</span>{img}</span>;
}

export function GoogleReviewCard({ review }) {
  const name = review.authorUri
    ? <a href={review.authorUri} {...ext} className="g-author">{review.authorName}</a>
    : <span className="g-author">{review.authorName}</span>;
  const visit = review.visitDate
    ? `Visited ${review.visitDate.month ? `${MONTHS[review.visitDate.month - 1]} ` : ""}${review.visitDate.year}`
    : null;
  return (
    <figure className="card review g-review" style={{ margin: 0 }}>
      <div className="g-review-head">
        {review.authorUri ? <a href={review.authorUri} {...ext} tabIndex={-1} aria-hidden="true"><Avatar review={review} /></a> : <Avatar review={review} />}
        <div className="g-review-who">
          {name}
          {(review.relativeTime || visit) && <span className="meta">{[review.relativeTime, visit].filter(Boolean).join(" · ")}</span>}
        </div>
        <span className="g-badge" title="Review from Google"><GoogleG size={14} /><span>Google</span></span>
      </div>
      <Stars value={review.rating} />
      {review.text && <blockquote className="g-text">{review.text}</blockquote>}
      <footer className="g-review-foot">
        {review.translated && <span>Translated by Google</span>}
        {review.googleMapsUri && <a href={review.googleMapsUri} {...ext}>View on <span translate="no">Google Maps</span></a>}
      </footer>
    </figure>
  );
}
