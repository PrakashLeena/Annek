const { sanitizeString } = require("./websiteSchema");

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSectionHtml(section, theme) {
  const t = theme;
  const wrap = (inner) =>
    `<section id="${escapeHtml(section.id)}" class="section section-${section.type}">${inner}</section>`;

  switch (section.type) {
    case "navbar":
      return wrap(`
        <nav class="nav">
          <div class="logo">${escapeHtml(section.logo)}</div>
          <div class="nav-links">${(section.links || [])
            .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`)
            .join("")}</div>
          ${section.cta ? `<a class="btn btn-primary" href="${escapeHtml(section.cta.link)}">${escapeHtml(section.cta.text)}</a>` : ""}
        </nav>`);
    case "hero":
      return wrap(`
        <div class="hero ${section.backgroundStyle || "gradient"}">
          <h1>${escapeHtml(section.title)}</h1>
          ${section.subtitle ? `<p class="subtitle">${escapeHtml(section.subtitle)}</p>` : ""}
          ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}
          <div class="hero-cta">
            ${section.cta ? `<a class="btn btn-primary" href="${escapeHtml(section.cta.link)}">${escapeHtml(section.cta.text)}</a>` : ""}
            ${section.secondaryCta ? `<a class="btn btn-secondary" href="${escapeHtml(section.secondaryCta.link)}">${escapeHtml(section.secondaryCta.text)}</a>` : ""}
          </div>
        </div>`);
    case "features":
    case "services":
      return wrap(`
        ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ""}
        ${section.description ? `<p class="section-desc">${escapeHtml(section.description)}</p>` : ""}
        <div class="grid">${(section.items || [])
          .map(
            (item) => `<div class="card">
              ${item.icon ? `<div class="icon">${escapeHtml(item.icon)}</div>` : ""}
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </div>`
          )
          .join("")}</div>`);
    case "pricing":
      return wrap(`
        ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ""}
        <div class="grid pricing-grid">${(section.items || [])
          .map(
            (item) => `<div class="card pricing-card ${item.highlight ? "highlight" : ""}">
              <h3>${escapeHtml(item.title)}</h3>
              <div class="price">${escapeHtml(item.price)}<span>${escapeHtml(item.period)}</span></div>
              <ul>${(item.features || []).map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
            </div>`
          )
          .join("")}</div>`);
    case "testimonials":
      return wrap(`
        ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ""}
        <div class="grid">${(section.items || [])
          .map(
            (item) => `<blockquote class="card">
              <p>"${escapeHtml(item.description || item.title)}"</p>
              <footer>${escapeHtml(item.author)} — ${escapeHtml(item.role)}</footer>
            </blockquote>`
          )
          .join("")}</div>`);
    case "faq":
      return wrap(`
        ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ""}
        <div class="faq-list">${(section.items || [])
          .map(
            (item) => `<details class="faq-item">
              <summary>${escapeHtml(item.question || item.title)}</summary>
              <p>${escapeHtml(item.answer || item.description)}</p>
            </details>`
          )
          .join("")}</div>`);
    case "contact":
      return wrap(`
        ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ""}
        <form class="contact-form" onsubmit="event.preventDefault(); alert('Demo form — connect backend for production.');">
          ${(section.formFields || ["name", "email", "message"])
            .map(
              (f) =>
                f === "message"
                  ? `<textarea name="${escapeHtml(f)}" placeholder="${escapeHtml(f)}" rows="4"></textarea>`
                  : `<input type="${f === "email" ? "email" : "text"}" name="${escapeHtml(f)}" placeholder="${escapeHtml(f)}" />`
            )
            .join("")}
          <button type="submit" class="btn btn-primary">${escapeHtml(section.submitText || "Send")}</button>
        </form>`);
    case "cta":
      return wrap(`
        <div class="cta-box">
          <h2>${escapeHtml(section.title)}</h2>
          ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}
          ${section.cta ? `<a class="btn btn-primary" href="${escapeHtml(section.cta.link)}">${escapeHtml(section.cta.text)}</a>` : ""}
        </div>`);
    case "footer":
      return wrap(`
        <footer class="site-footer">
          <p>${escapeHtml(section.copyright || section.tagline || "")}</p>
          <div class="footer-links">${(section.links || [])
            .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`)
            .join("")}</div>
        </footer>`);
    default:
      return wrap(`
        ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ""}
        ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}`);
  }
}

function exportToHtml(spec) {
  const theme = spec.theme || {};
  const page = spec.pages?.[0];
  const sectionIds = page?.sectionIds || spec.sections.map((s) => s.id);
  const sections = sectionIds
    .map((id) => spec.sections.find((s) => s.id === id))
    .filter(Boolean);

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${theme.fontFamily || "'DM Sans', sans-serif"}; color: ${theme.textColor || "#1a1a1a"}; background: ${theme.backgroundColor || "#fff"}; line-height: 1.6; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .section { padding: 64px 24px; }
    .nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 16px 24px; position: sticky; top: 0; background: ${theme.mode === "dark" ? "#0a0a0f" : "rgba(255,255,255,0.95)"}; backdrop-filter: blur(12px); z-index: 10; border-bottom: 1px solid rgba(0,0,0,0.06); }
    .logo { font-weight: 700; font-size: 1.1rem; }
    .nav-links { display: flex; gap: 20px; flex-wrap: wrap; }
    .nav-links a, .footer-links a { color: inherit; text-decoration: none; opacity: 0.85; }
    .hero { text-align: center; padding: 96px 24px; }
    .hero.gradient { background: ${theme.gradient || "linear-gradient(135deg, #5c4ef8, #7c3aed)"}; color: #fff; border-radius: ${theme.borderRadius || "12px"}; margin: 16px; }
    .hero.dark, .section.dark { background: #0a0a0f; color: #fff; }
    h1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.1; margin-bottom: 16px; font-weight: 300; letter-spacing: -0.03em; }
    h2 { font-size: clamp(1.75rem, 3vw, 2.5rem); margin-bottom: 16px; font-weight: 300; letter-spacing: -0.02em; }
    h3 { margin-bottom: 8px; }
    .subtitle, .section-desc { opacity: 0.85; max-width: 640px; margin: 0 auto 24px; }
    .hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 24px; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: ${theme.borderRadius || "12px"}; text-decoration: none; font-weight: 600; transition: transform 0.2s; }
    .btn:hover { transform: translateY(-2px); }
    .btn-primary { background: ${theme.primaryColor || "#5c4ef8"}; color: #fff; }
    .btn-secondary { background: transparent; border: 2px solid currentColor; color: inherit; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; max-width: 1100px; margin: 0 auto; }
    .card { background: ${theme.mode === "dark" ? "#14141f" : "#f8f8fc"}; border-radius: ${theme.borderRadius || "12px"}; padding: 24px; border: 1px solid rgba(0,0,0,0.06); }
    .pricing-card.highlight { border: 2px solid ${theme.primaryColor || "#5c4ef8"}; }
    .price { font-size: 2rem; font-weight: 700; margin: 12px 0; color: ${theme.primaryColor || "#5c4ef8"}; }
    .price span { font-size: 0.9rem; font-weight: 400; opacity: 0.7; }
    ul { list-style: none; }
    ul li::before { content: "✓ "; color: ${theme.primaryColor || "#5c4ef8"}; }
    ul li { margin-bottom: 8px; }
    .faq-item { background: ${theme.mode === "dark" ? "#14141f" : "#f8f8fc"}; border-radius: ${theme.borderRadius || "12px"}; padding: 16px 20px; margin-bottom: 12px; max-width: 800px; margin-left: auto; margin-right: auto; }
    .contact-form { max-width: 520px; margin: 0 auto; display: grid; gap: 12px; }
    .contact-form input, .contact-form textarea { width: 100%; padding: 12px 14px; border-radius: ${theme.borderRadius || "12px"}; border: 1.5px solid #e5e5e5; font: inherit; }
    .cta-box { text-align: center; background: ${theme.gradient || theme.primaryColor}; color: #fff; border-radius: ${theme.borderRadius || "12px"}; padding: 48px 24px; max-width: 900px; margin: 0 auto; }
    .site-footer { text-align: center; padding: 32px 24px; border-top: 1px solid rgba(0,0,0,0.08); opacity: 0.8; }
    .footer-links { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-top: 12px; }
    @media (max-width: 768px) { .section { padding: 48px 16px; } .nav { justify-content: center; } }
  `;

  const body = sections.map((s) => renderSectionHtml(s, theme)).join("\n");
  const title = sanitizeString(spec.project?.name, 120) || "Website";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(spec.project?.description)}" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>${css}</style>
</head>
<body>
  <div class="container">
    ${body}
  </div>
</body>
</html>`;
}

module.exports = { exportToHtml };
