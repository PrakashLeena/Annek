/**
 * Structured website specification schema & validation.
 * AI output is validated here before preview or persistence.
 */

const SECTION_TYPES = [
  "navbar",
  "hero",
  "about",
  "features",
  "services",
  "pricing",
  "testimonials",
  "faq",
  "contact",
  "cta",
  "gallery",
  "products",
  "stats",
  "team",
  "footer",
];

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function isNonEmptyString(v, max = 5000) {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

function sanitizeString(v, max = 5000) {
  if (typeof v !== "string") return "";
  return v
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, max);
}

function sanitizeColor(v, fallback = "#5c4ef8") {
  if (typeof v !== "string") return fallback;
  const c = v.trim();
  return HEX_COLOR.test(c) ? c : fallback;
}

function makeId(prefix = "sec") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultTheme() {
  return {
    primaryColor: "#5c4ef8",
    secondaryColor: "#7c3aed",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    mutedColor: "#666666",
    accentColor: "#d4f74b",
    fontFamily: "'DM Sans', sans-serif",
    mode: "light",
    borderRadius: "12px",
    gradient: "linear-gradient(135deg, #5c4ef8, #7c3aed)",
  };
}

function createEmptySpec(name = "Untitled Website", description = "") {
  const heroId = makeId("hero");
  const footerId = makeId("footer");
  const navId = makeId("nav");
  return {
    version: 1,
    project: {
      name: sanitizeString(name, 120) || "Untitled Website",
      description: sanitizeString(description, 500),
    },
    theme: defaultTheme(),
    navigation: {
      logo: sanitizeString(name, 80) || "My Site",
      links: [
        { label: "Home", href: "#home" },
        { label: "About", href: "#about" },
        { label: "Contact", href: "#contact" },
      ],
      cta: { text: "Get Started", link: "#contact" },
    },
    pages: [{ name: "Home", path: "/", sectionIds: [navId, heroId, footerId] }],
    sections: [
      {
        id: navId,
        type: "navbar",
        logo: sanitizeString(name, 80) || "My Site",
        links: [
          { label: "Home", href: "#home" },
          { label: "About", href: "#about" },
          { label: "Contact", href: "#contact" },
        ],
        cta: { text: "Get Started", link: "#contact" },
      },
      {
        id: heroId,
        type: "hero",
        title: "Welcome",
        subtitle: description || "Your website starts here",
        description: "",
        cta: { text: "Learn More", link: "#about" },
        secondaryCta: null,
        backgroundStyle: "gradient",
        alignment: "center",
      },
      {
        id: footerId,
        type: "footer",
        copyright: `© ${new Date().getFullYear()} ${sanitizeString(name, 80) || "My Site"}`,
        links: [{ label: "Contact", href: "#contact" }],
        social: [],
      },
    ],
    footer: {
      copyright: `© ${new Date().getFullYear()}`,
      tagline: "",
    },
  };
}

function normalizeItem(item, index) {
  if (!item || typeof item !== "object") {
    return { id: makeId("item"), title: `Item ${index + 1}`, description: "" };
  }
  return {
    id: sanitizeString(item.id, 64) || makeId("item"),
    title: sanitizeString(item.title, 200) || `Item ${index + 1}`,
    description: sanitizeString(item.description, 1000),
    icon: sanitizeString(item.icon, 40),
    price: sanitizeString(item.price, 40),
    period: sanitizeString(item.period, 40),
    features: Array.isArray(item.features)
      ? item.features.map((f) => sanitizeString(f, 200)).filter(Boolean).slice(0, 20)
      : [],
    image: sanitizeString(item.image, 500),
    link: sanitizeString(item.link, 300),
    author: sanitizeString(item.author, 120),
    role: sanitizeString(item.role, 120),
    rating: typeof item.rating === "number" ? Math.min(5, Math.max(1, item.rating)) : 5,
    question: sanitizeString(item.question || item.title, 300),
    answer: sanitizeString(item.answer || item.description, 2000),
    highlight: Boolean(item.highlight),
    value: sanitizeString(item.value, 40),
    label: sanitizeString(item.label, 80),
  };
}

function normalizeSection(section, index) {
  if (!section || typeof section !== "object") return null;
  const type = SECTION_TYPES.includes(section.type) ? section.type : "features";
  const base = {
    id: sanitizeString(section.id, 64) || makeId(type),
    type,
    title: sanitizeString(section.title, 200),
    subtitle: sanitizeString(section.subtitle, 300),
    description: sanitizeString(section.description, 3000),
    alignment: ["left", "center", "right"].includes(section.alignment)
      ? section.alignment
      : "center",
    backgroundStyle: ["solid", "gradient", "image", "dark"].includes(section.backgroundStyle)
      ? section.backgroundStyle
      : "solid",
    backgroundImage: sanitizeString(section.backgroundImage, 500),
  };

  if (section.cta && typeof section.cta === "object") {
    base.cta = {
      text: sanitizeString(section.cta.text, 80) || "Learn More",
      link: sanitizeString(section.cta.link, 300) || "#",
    };
  }
  if (section.secondaryCta && typeof section.secondaryCta === "object") {
    base.secondaryCta = {
      text: sanitizeString(section.secondaryCta.text, 80),
      link: sanitizeString(section.secondaryCta.link, 300),
    };
  }

  const items = Array.isArray(section.items)
    ? section.items.map(normalizeItem).slice(0, 24)
    : [];

  switch (type) {
    case "navbar":
      return {
        ...base,
        logo: sanitizeString(section.logo, 80) || base.title || "Logo",
        links: Array.isArray(section.links)
          ? section.links
              .map((l) => ({
                label: sanitizeString(l?.label, 60),
                href: sanitizeString(l?.href, 200) || "#",
              }))
              .filter((l) => l.label)
              .slice(0, 10)
          : [],
        cta: base.cta || { text: "Contact", link: "#contact" },
      };
    case "hero":
      return {
        ...base,
        title: base.title || "Welcome",
        subtitle: base.subtitle || base.description || "",
        cta: base.cta || { text: "Get Started", link: "#contact" },
        secondaryCta: base.secondaryCta || null,
      };
    case "features":
    case "services":
    case "pricing":
    case "testimonials":
    case "faq":
    case "gallery":
    case "products":
    case "stats":
    case "team":
      return { ...base, items };
    case "contact":
      return {
        ...base,
        email: sanitizeString(section.email, 120),
        phone: sanitizeString(section.phone, 40),
        address: sanitizeString(section.address, 300),
        formFields: Array.isArray(section.formFields)
          ? section.formFields.map((f) => sanitizeString(f, 40)).slice(0, 8)
          : ["name", "email", "message"],
        submitText: sanitizeString(section.submitText, 40) || "Send Message",
      };
    case "cta":
      return {
        ...base,
        title: base.title || "Ready to get started?",
        cta: base.cta || { text: "Contact Us", link: "#contact" },
      };
    case "footer":
      return {
        ...base,
        copyright: sanitizeString(section.copyright, 200),
        tagline: sanitizeString(section.tagline, 200),
        links: Array.isArray(section.links)
          ? section.links
              .map((l) => ({
                label: sanitizeString(l?.label, 60),
                href: sanitizeString(l?.href, 200) || "#",
              }))
              .filter((l) => l.label)
              .slice(0, 12)
          : [],
        social: Array.isArray(section.social)
          ? section.social
              .map((s) => ({
                platform: sanitizeString(s?.platform, 40),
                url: sanitizeString(s?.url, 300),
              }))
              .filter((s) => s.platform && s.url)
              .slice(0, 8)
          : [],
      };
    default:
      return { ...base, items };
  }
}

function normalizeSpec(raw) {
  if (!raw || typeof raw !== "object") {
    return createEmptySpec();
  }

  const themeIn = raw.theme && typeof raw.theme === "object" ? raw.theme : {};
  const theme = {
    ...defaultTheme(),
    primaryColor: sanitizeColor(themeIn.primaryColor, defaultTheme().primaryColor),
    secondaryColor: sanitizeColor(themeIn.secondaryColor, defaultTheme().secondaryColor),
    backgroundColor: sanitizeColor(themeIn.backgroundColor, "#ffffff"),
    textColor: sanitizeColor(themeIn.textColor, "#1a1a1a"),
    mutedColor: sanitizeColor(themeIn.mutedColor, "#666666"),
    accentColor: sanitizeColor(themeIn.accentColor, "#d4f74b"),
    fontFamily: sanitizeString(themeIn.fontFamily, 120) || defaultTheme().fontFamily,
    mode: themeIn.mode === "dark" ? "dark" : "light",
    borderRadius: sanitizeString(themeIn.borderRadius, 20) || "12px",
    gradient: sanitizeString(themeIn.gradient, 200) || defaultTheme().gradient,
  };

  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .map(normalizeSection)
    .filter(Boolean)
    .slice(0, 30);

  if (sections.length === 0) {
    return createEmptySpec(
      raw.project?.name,
      raw.project?.description
    );
  }

  const sectionIds = sections.map((s) => s.id);
  const pages = Array.isArray(raw.pages) && raw.pages.length
    ? raw.pages.map((p, i) => ({
        name: sanitizeString(p?.name, 80) || `Page ${i + 1}`,
        path: sanitizeString(p?.path, 80) || (i === 0 ? "/" : `/page-${i + 1}`),
        sectionIds: Array.isArray(p?.sectionIds)
          ? p.sectionIds.filter((id) => sectionIds.includes(id))
          : sectionIds,
      }))
    : [{ name: "Home", path: "/", sectionIds }];

  const navIn = raw.navigation && typeof raw.navigation === "object" ? raw.navigation : {};
  const navbarSection = sections.find((s) => s.type === "navbar");

  return {
    version: 1,
    project: {
      name: sanitizeString(raw.project?.name, 120) || "Untitled Website",
      description: sanitizeString(raw.project?.description, 500),
    },
    theme,
    navigation: {
      logo: sanitizeString(navIn.logo || navbarSection?.logo || raw.project?.name, 80) || "Logo",
      links: Array.isArray(navIn.links)
        ? navIn.links
            .map((l) => ({
              label: sanitizeString(l?.label, 60),
              href: sanitizeString(l?.href, 200) || "#",
            }))
            .filter((l) => l.label)
            .slice(0, 10)
        : navbarSection?.links || [],
      cta: navIn.cta
        ? {
            text: sanitizeString(navIn.cta.text, 80) || "Contact",
            link: sanitizeString(navIn.cta.link, 300) || "#contact",
          }
        : navbarSection?.cta || { text: "Contact", link: "#contact" },
    },
    pages,
    sections,
    footer: {
      copyright: sanitizeString(raw.footer?.copyright, 200),
      tagline: sanitizeString(raw.footer?.tagline, 200),
    },
  };
}

function validateSpec(spec) {
  const errors = [];
  if (!spec?.project?.name) errors.push("Missing project name");
  if (!Array.isArray(spec?.sections) || spec.sections.length === 0) {
    errors.push("At least one section is required");
  }
  if (spec?.sections?.length > 30) errors.push("Too many sections (max 30)");
  const ids = new Set();
  for (const s of spec?.sections || []) {
    if (!SECTION_TYPES.includes(s.type)) errors.push(`Invalid section type: ${s.type}`);
    if (ids.has(s.id)) errors.push(`Duplicate section id: ${s.id}`);
    ids.add(s.id);
  }
  return { valid: errors.length === 0, errors };
}

function validateAiResponse(data) {
  const errors = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Response is not an object"] };
  }
  if (!["create_website", "update_website"].includes(data.action)) {
    errors.push("Invalid or missing action");
  }
  if (data.message != null && typeof data.message !== "string") {
    errors.push("Invalid message field");
  }
  if (typeof data.message === "string" && data.message.length > 2000) {
    errors.push("Message too long");
  }
  if (data.action === "create_website" && !data.spec) {
    errors.push("create_website requires spec");
  }
  if (data.action === "update_website" && !Array.isArray(data.changes)) {
    errors.push("update_website requires changes array");
  }
  return { valid: errors.length === 0, errors };
}

function getRelevantContext(spec, userMessage = "") {
  const msg = userMessage.toLowerCase();
  const themeKeywords = ["color", "theme", "background", "font", "dark", "light", "gradient"];
  const wantsTheme = themeKeywords.some((k) => msg.includes(k));

  let relevantSections = spec.sections;
  if (!wantsTheme && msg.length > 3) {
    relevantSections = spec.sections.filter((s) => {
      const hay = `${s.type} ${s.title || ""} ${s.subtitle || ""}`.toLowerCase();
      return msg.split(/\s+/).some((word) => word.length > 3 && hay.includes(word));
    });
    if (relevantSections.length === 0) {
      relevantSections = spec.sections.slice(0, 5);
    }
  }

  return {
    project: spec.project,
    theme: spec.theme,
    navigation: spec.navigation,
    sectionSummary: spec.sections.map((s) => ({ id: s.id, type: s.type, title: s.title })),
    relevantSections: wantsTheme ? [] : relevantSections.slice(0, 8),
    pages: spec.pages,
  };
}

module.exports = {
  SECTION_TYPES,
  createEmptySpec,
  normalizeSpec,
  normalizeSection,
  validateSpec,
  validateAiResponse,
  getRelevantContext,
  sanitizeString,
  makeId,
  defaultTheme,
};
