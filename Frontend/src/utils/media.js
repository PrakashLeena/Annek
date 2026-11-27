/* Media helpers for the solutions showcase. */

/**
 * Cloudinary delivery URL resized to `w` px wide, auto format/quality.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cld(url, w) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${w}/`);
}

/** srcset for a Cloudinary image (falls back to the plain URL elsewhere). */
export function cldSrcSet(url, widths = [400, 800, 1200]) {
  if (cld(url, 1) === url) return undefined;
  return widths.map((w) => `${cld(url, w)} ${w}w`).join(", ");
}

/** Poster frame for an uploaded Cloudinary video (first second, as jpg). */
export function videoPoster(url) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com/") || !url.includes("/video/upload/")) return undefined;
  return url.replace("/upload/", "/upload/so_1,w_1280,c_limit,f_jpg,q_auto/").replace(/\.(mp4|webm|mov)$/i, ".jpg");
}

/** YouTube / Vimeo links → privacy-friendly embed URL; anything else → null (play as a file). */
export function videoEmbed(url) {
  if (typeof url !== "string") return null;
  let u;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "");
  let id = null;
  if (host === "youtu.be") id = u.pathname.slice(1);
  else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
    id = u.searchParams.get("v") || (u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/) || [])[1];
  }
  if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vid = (u.pathname.match(/(\d{6,12})/) || [])[1];
    if (vid) return `https://player.vimeo.com/video/${vid}?dnt=1`;
  }
  return null;
}

export const CATEGORY_INFO = {
  mobile: {
    slug: "mobile",
    label: "Mobile Applications",
    short: "Mobile App",
    title: "Mobile app solutions",
    intro: "Ready made mobile apps for Android and iPhone. Pick one and we customise it for your business.",
  },
  web: {
    slug: "web",
    label: "Web Applications",
    short: "Web App",
    title: "Web application solutions",
    intro: "Ready made web applications that run in any browser, with an admin panel you control. Try the live demos.",
  },
  software: {
    slug: "software",
    label: "Custom Software",
    short: "Software",
    title: "Software solutions",
    intro: "Ready made software for billing, stock, records and automation, shaped around how your business works.",
  },
};
