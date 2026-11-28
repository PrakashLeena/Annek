/* Google rating badge for Trusted By. The rating and count are typed into Admin > Settings
   (googleRating, googleReviewCount); no Google API is called. Hidden unless both are valid. */

import { GOOGLE_PROFILE_URL, GOOGLE_REVIEW_URL, parseGoogleRating } from "../utils/googleRating";

const LETTERS = [["G", "#4285F4"], ["o", "#EA4335"], ["o", "#FBBC05"], ["g", "#4285F4"], ["l", "#34A853"], ["e", "#EA4335"]];

export default function GoogleRatingBadge({ settings }) {
  const data = parseGoogleRating(settings);
  if (!data) return null;
  const { rating, count } = data;
  const label = rating.toFixed(1);
  return (
    <div className="g-badge-row reveal">
      <div className="g-badge-main">
        <span className="g-wordmark" translate="no" aria-label="Google">
          {LETTERS.map(([l, c], i) => <span key={i} style={{ color: c }} aria-hidden="true">{l}</span>)}
        </span>
        <div className="g-badge-score">
          <div className="g-badge-line">
            <b>{label}</b>
            <span className="g-stars" role="img" aria-label={`${label} out of 5 stars`}>
              <span className="g-stars-off" aria-hidden="true">★★★★★</span>
              <span className="g-stars-on" aria-hidden="true" style={{ width: `${(rating / 5) * 100}%` }}>★★★★★</span>
            </span>
          </div>
          <span className="g-badge-count">Based on {count} Google {count === 1 ? "review" : "reviews"}</span>
        </div>
      </div>
      <div className="g-badge-actions">
        <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener" className="btn btn-orange btn-sm">Write a review</a>
        <a href={GOOGLE_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm">See all reviews on Google</a>
      </div>
    </div>
  );
}
