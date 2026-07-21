import { BT } from "../../theme/builderTheme";

function Btn({ text, link, theme, variant = "primary", small }) {
  if (!text) return null;
  const isPrimary = variant === "primary";
  return (
    <a
      href={link || "#"}
      style={{
        display: "inline-block",
        padding: small ? "8px 16px" : "12px 24px",
        borderRadius: theme.borderRadius || "12px",
        background: isPrimary ? theme.primaryColor : "transparent",
        color: isPrimary ? "#fff" : theme.textColor,
        border: isPrimary ? "none" : `2px solid ${theme.primaryColor}`,
        textDecoration: "none",
        fontWeight: 600,
        fontSize: small ? 13 : 14,
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {text}
    </a>
  );
}

function SectionWrapper({ section, theme, children, dark }) {
  const bg =
    section.backgroundStyle === "gradient"
      ? theme.gradient
      : section.backgroundStyle === "dark"
        ? "#0a0a0f"
        : section.backgroundStyle === "image" && section.backgroundImage
          ? `url(${section.backgroundImage}) center/cover`
          : theme.backgroundColor;

  const textColor =
    section.backgroundStyle === "gradient" || section.backgroundStyle === "dark" || dark
      ? "#ffffff"
      : theme.textColor;

  return (
    <section
      id={section.id}
      style={{
        padding: "64px 24px",
        background: bg,
        color: textColor,
        textAlign: section.alignment || "center",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function NavbarSection({ section, theme }) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        padding: "16px 24px",
        position: "sticky",
        top: 0,
        zIndex: 5,
        background: theme.mode === "dark" ? "rgba(10,10,15,0.95)" : "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${theme.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        color: theme.textColor,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{section.logo}</div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        {(section.links || []).map((l) => (
          <a key={l.label} href={l.href} style={{ color: "inherit", textDecoration: "none", opacity: 0.85, fontSize: 14 }}>
            {l.label}
          </a>
        ))}
        {section.cta && <Btn text={section.cta.text} link={section.cta.link} theme={theme} small />}
      </div>
    </nav>
  );
}

function HeroSection({ section, theme }) {
  return (
    <SectionWrapper section={section} theme={theme}>
      <h1 style={{
        fontSize: "clamp(2rem, 5vw, 3.2rem)",
        fontWeight: 300,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        marginBottom: 16,
      }}>
        {section.title}
      </h1>
      {section.subtitle && (
        <p style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", opacity: 0.9, maxWidth: 640, margin: "0 auto 12px" }}>
          {section.subtitle}
        </p>
      )}
      {section.description && (
        <p style={{ opacity: 0.8, maxWidth: 560, margin: "0 auto 24px" }}>{section.description}</p>
      )}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Btn text={section.cta?.text} link={section.cta?.link} theme={theme} />
        {section.secondaryCta && (
          <Btn text={section.secondaryCta.text} link={section.secondaryCta.link} theme={theme} variant="secondary" />
        )}
      </div>
    </SectionWrapper>
  );
}

function GridSection({ section, theme, renderItem }) {
  return (
    <SectionWrapper section={section} theme={theme}>
      {section.title && (
        <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.4rem)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 12 }}>
          {section.title}
        </h2>
      )}
      {section.description && (
        <p style={{ opacity: 0.75, maxWidth: 640, margin: "0 auto 32px" }}>{section.description}</p>
      )}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 20,
        textAlign: "left",
      }}>
        {(section.items || []).map((item, i) => renderItem(item, i))}
      </div>
    </SectionWrapper>
  );
}

function Card({ theme, children, highlight }) {
  return (
    <div style={{
      background: theme.mode === "dark" ? "#14141f" : "#f8f8fc",
      borderRadius: theme.borderRadius || "12px",
      padding: 24,
      border: highlight ? `2px solid ${theme.primaryColor}` : `1px solid ${theme.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </div>
  );
}

function renderSection(section, theme) {
  switch (section.type) {
    case "navbar":
      return <NavbarSection key={section.id} section={section} theme={theme} />;
    case "hero":
      return <HeroSection key={section.id} section={section} theme={theme} />;
    case "about":
    case "features":
    case "services":
      return (
        <GridSection
          key={section.id}
          section={section}
          theme={theme}
          renderItem={(item) => (
            <Card theme={theme} key={item.id}>
              {item.icon && <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>}
              <h3 style={{ marginBottom: 8, color: theme.primaryColor }}>{item.title}</h3>
              <p style={{ opacity: 0.8, fontSize: 14, lineHeight: 1.6 }}>{item.description}</p>
            </Card>
          )}
        />
      );
    case "pricing":
      return (
        <GridSection
          key={section.id}
          section={section}
          theme={theme}
          renderItem={(item) => (
            <Card theme={theme} highlight={item.highlight} key={item.id}>
              <h3>{item.title}</h3>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: theme.primaryColor, margin: "12px 0" }}>
                {item.price}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7 }}>{item.period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {(item.features || []).map((f) => (
                  <li key={f} style={{ marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: theme.primaryColor }}>✓ </span>{f}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        />
      );
    case "testimonials":
      return (
        <GridSection
          key={section.id}
          section={section}
          theme={theme}
          renderItem={(item) => (
            <Card theme={theme} key={item.id}>
              <p style={{ fontStyle: "italic", marginBottom: 12, lineHeight: 1.6 }}>
                "{item.description || item.title}"
              </p>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.author}</div>
              <div style={{ opacity: 0.6, fontSize: 13 }}>{item.role}</div>
            </Card>
          )}
        />
      );
    case "faq":
      return (
        <SectionWrapper key={section.id} section={section} theme={theme}>
          {section.title && <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.4rem)", fontWeight: 300, marginBottom: 24 }}>{section.title}</h2>}
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "left" }}>
            {(section.items || []).map((item) => (
              <details key={item.id} style={{
                background: theme.mode === "dark" ? "#14141f" : "#f8f8fc",
                borderRadius: theme.borderRadius || "12px",
                padding: "16px 20px",
                marginBottom: 12,
                border: `1px solid ${theme.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>{item.question || item.title}</summary>
                <p style={{ marginTop: 12, opacity: 0.8, lineHeight: 1.6 }}>{item.answer || item.description}</p>
              </details>
            ))}
          </div>
        </SectionWrapper>
      );
    case "contact":
      return (
        <SectionWrapper key={section.id} section={section} theme={theme}>
          {section.title && <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.4rem)", fontWeight: 300, marginBottom: 24 }}>{section.title}</h2>}
          <form style={{ maxWidth: 480, margin: "0 auto", display: "grid", gap: 12, textAlign: "left" }}
            onSubmit={(e) => e.preventDefault()}>
            {(section.formFields || ["name", "email", "message"]).map((f) =>
              f === "message" ? (
                <textarea key={f} rows={4} placeholder={f} style={{
                  padding: "12px 14px", borderRadius: theme.borderRadius || "12px",
                  border: "1.5px solid #e5e5e5", font: "inherit", resize: "vertical",
                }} />
              ) : (
                <input key={f} type={f === "email" ? "email" : "text"} placeholder={f} style={{
                  padding: "12px 14px", borderRadius: theme.borderRadius || "12px",
                  border: "1.5px solid #e5e5e5", font: "inherit",
                }} />
              )
            )}
            <button type="submit" style={{
              padding: "12px 24px", borderRadius: theme.borderRadius || "12px",
              background: theme.primaryColor, color: "#fff", border: "none",
              fontWeight: 600, cursor: "pointer", font: "inherit",
            }}>
              {section.submitText || "Send Message"}
            </button>
          </form>
        </SectionWrapper>
      );
    case "cta":
      return (
        <SectionWrapper key={section.id} section={{ ...section, backgroundStyle: "gradient" }} theme={theme}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, marginBottom: 12 }}>{section.title}</h2>
          {section.description && <p style={{ opacity: 0.9, marginBottom: 20 }}>{section.description}</p>}
          <Btn text={section.cta?.text} link={section.cta?.link} theme={theme} />
        </SectionWrapper>
      );
    case "stats":
      return (
        <GridSection
          key={section.id}
          section={section}
          theme={theme}
          renderItem={(item) => (
            <div key={item.id} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 300, color: theme.primaryColor }}>{item.value}</div>
              <div style={{ opacity: 0.7, marginTop: 4 }}>{item.label || item.title}</div>
            </div>
          )}
        />
      );
    case "gallery":
    case "products":
      return (
        <GridSection
          key={section.id}
          section={section}
          theme={theme}
          renderItem={(item) => (
            <Card theme={theme} key={item.id}>
              {item.image && (
                <div style={{
                  height: 140, borderRadius: 8, marginBottom: 12,
                  background: `linear-gradient(135deg, ${theme.primaryColor}33, ${theme.secondaryColor}33)`,
                  display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8,
                }}>
                  🖼
                </div>
              )}
              <h3>{item.title}</h3>
              {item.price && <div style={{ color: theme.primaryColor, fontWeight: 700 }}>{item.price}</div>}
              <p style={{ opacity: 0.75, fontSize: 14, marginTop: 8 }}>{item.description}</p>
            </Card>
          )}
        />
      );
    case "footer":
      return (
        <footer key={section.id} style={{
          padding: "32px 24px",
          textAlign: "center",
          borderTop: `1px solid ${theme.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          opacity: 0.8,
          color: theme.textColor,
          background: theme.backgroundColor,
        }}>
          <p>{section.copyright || section.tagline}</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
            {(section.links || []).map((l) => (
              <a key={l.label} href={l.href} style={{ color: "inherit", textDecoration: "none", fontSize: 13 }}>{l.label}</a>
            ))}
          </div>
        </footer>
      );
    default:
      return (
        <SectionWrapper key={section.id} section={section} theme={theme}>
          {section.title && <h2>{section.title}</h2>}
          {section.description && <p>{section.description}</p>}
        </SectionWrapper>
      );
  }
}

export default function WebsiteRenderer({ spec }) {
  if (!spec) {
    return (
      <div style={{
        height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        color: BT.textMuted, fontFamily: BT.font, flexDirection: "column", gap: 12, padding: 32,
      }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>✦</div>
        <p style={{ textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
          Describe your website and click Generate to see a live preview here.
        </p>
      </div>
    );
  }

  const theme = spec.theme || {};
  const page = spec.pages?.[0];
  const ordered = page?.sectionIds?.length
    ? page.sectionIds.map((id) => spec.sections.find((s) => s.id === id)).filter(Boolean)
    : spec.sections;

  return (
    <div style={{
      fontFamily: theme.fontFamily || BT.font,
      color: theme.textColor || "#1a1a1a",
      background: theme.backgroundColor || "#fff",
      minHeight: "100%",
      overflow: "auto",
    }}>
      {ordered.map((section) => renderSection(section, theme))}
    </div>
  );
}
