import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { auth, signInWithGoogle, onAuthStateChanged } from "../firebase";
import { useWebsiteBuilder } from "../hooks/useWebsiteBuilder";
import { BT, DEVICE_WIDTHS } from "../theme/builderTheme";
import logoImg from "../images/logo.png";

const WebsiteRenderer = lazy(() => import("../components/builder/WebsiteRenderer"));

const EXAMPLE_PROMPT =
  "Create a modern portfolio website for a software engineer specializing in AI and machine learning. Use a dark futuristic theme with blue-purple gradients, animated hero section, projects section, skills, experience, and contact form.";

function IconSparkle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

export default function AIWebsiteBuilder() {
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");
  const chatEndRef = useRef(null);
  const builder = useWebsiteBuilder();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [builder.messages, builder.status]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || builder.loading) return;
    const text = input.trim();
    setInput("");
    if (builder.spec) builder.edit(text);
    else builder.generate(text);
  };

  const handleSave = async () => {
    const result = await builder.save();
    if (result) {
      setSaveMsg("Project saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const devices = [
    { id: "desktop", label: "Desktop", icon: "🖥" },
    { id: "tablet", label: "Tablet", icon: "📱" },
    { id: "mobile", label: "Mobile", icon: "📲" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: BT.bg,
      color: BT.text,
      fontFamily: BT.font,
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:.4} 50%{opacity:1} }
        .builder-scroll::-webkit-scrollbar { width: 6px; }
        .builder-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
        @media (max-width: 900px) {
          .builder-layout { flex-direction: column !important; }
          .builder-chat { max-height: 45vh !important; min-height: 320px !important; }
          .builder-preview { min-height: 50vh !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px", borderBottom: `1px solid ${BT.border}`,
        background: "rgba(5,5,8,0.95)", backdropFilter: "blur(16px)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center" }}>
            <img src={logoImg} alt="Annek" style={{ height: 32, width: "auto" }} />
          </Link>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: BT.bgElevated, borderRadius: 99, padding: "6px 14px",
            border: `1px solid ${BT.border}`, fontSize: 13, fontWeight: 600,
          }}>
            <span style={{ color: BT.accent }}><IconSparkle /></span>
            ANNEK AI Website Builder
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <span style={{ fontSize: 13, color: BT.textMuted }}>{user.displayName?.split(" ")[0]}</span>
          ) : (
            <button
              onClick={signInWithGoogle}
              style={{
                background: "transparent", border: `1px solid ${BT.border}`,
                color: BT.text, padding: "8px 14px", borderRadius: 99, cursor: "pointer",
                fontSize: 13, fontFamily: "inherit",
              }}
            >
              Sign in to save
            </button>
          )}
          <Link to="/" style={{ color: BT.textMuted, fontSize: 13, textDecoration: "none" }}>← Back to site</Link>
        </div>
      </header>

      {/* Main layout */}
      <div className="builder-layout" style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Chat panel */}
        <aside className="builder-chat" style={{
          width: "100%", maxWidth: 420, display: "flex", flexDirection: "column",
          borderRight: `1px solid ${BT.border}`, background: BT.bgPanel, minHeight: 0,
        }}>
          <div className="builder-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
            {builder.messages.length === 0 && !builder.loading && (
              <div style={{ padding: "8px 4px" }}>
                <p style={{ color: BT.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                  Describe any website you want — landing page, portfolio, SaaS, restaurant, e-commerce UI, and more.
                </p>
                <button
                  onClick={() => setInput(EXAMPLE_PROMPT)}
                  style={{
                    width: "100%", textAlign: "left", padding: 14, borderRadius: BT.radius,
                    background: BT.bgElevated, border: `1px solid ${BT.border}`, color: BT.textMuted,
                    fontSize: 12, lineHeight: 1.5, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <span style={{ color: BT.accent, fontWeight: 600 }}>Try example →</span>
                  <br />
                  {EXAMPLE_PROMPT.slice(0, 100)}…
                </button>
              </div>
            )}

            {builder.messages.map((msg, i) => (
              <div key={i} style={{
                marginBottom: 12,
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "90%", padding: "10px 14px", borderRadius: BT.radius,
                  background: msg.role === "user" ? BT.primary : BT.bgElevated,
                  color: msg.role === "user" ? "#fff" : BT.text,
                  fontSize: 14, lineHeight: 1.55,
                  border: msg.role === "user" ? "none" : `1px solid ${BT.border}`,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {builder.status && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", color: BT.textMuted, fontSize: 13 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", background: BT.accent,
                  animation: "pulse-dot 1.2s ease infinite",
                }} />
                {builder.status}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {builder.error && (
            <div style={{
              margin: "0 16px 8px", padding: "10px 14px", borderRadius: BT.radius,
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5", fontSize: 13,
            }}>
              {builder.error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ padding: 16, borderTop: `1px solid ${BT.border}` }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={builder.spec ? "Ask for changes… e.g. Change the background to black" : "Describe your website…"}
              rows={3}
              disabled={builder.loading}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: BT.radius,
                background: BT.bgElevated, border: `1px solid ${BT.border}`, color: BT.text,
                fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none",
                boxSizing: "border-box", marginBottom: 10,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={builder.loading || !input.trim()}
              style={{
                width: "100%", padding: "12px 20px", borderRadius: BT.radius,
                background: builder.loading ? BT.bgElevated : `linear-gradient(135deg, ${BT.primary}, ${BT.secondary})`,
                color: "#fff", border: "none", fontWeight: 700, fontSize: 14,
                cursor: builder.loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                opacity: builder.loading || !input.trim() ? 0.6 : 1,
              }}
            >
              {builder.loading ? "Generating…" : builder.spec ? "Apply Changes ✦" : "Generate Website ✦"}
            </button>
          </form>
        </aside>

        {/* Preview panel */}
        <section className="builder-preview" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderBottom: `1px solid ${BT.border}`, background: BT.bgPanel,
            flexWrap: "wrap", gap: 8,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {devices.map((d) => (
                <button
                  key={d.id}
                  onClick={() => builder.setDevice(d.id)}
                  style={{
                    padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", border: `1px solid ${BT.border}`,
                    background: builder.device === d.id ? BT.primary : "transparent",
                    color: builder.device === d.id ? "#fff" : BT.textMuted,
                  }}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {saveMsg && <span style={{ fontSize: 12, color: BT.success }}>{saveMsg}</span>}
              {builder.versions.length > 1 && (
                <select
                  onChange={(e) => builder.restore(Number(e.target.value))}
                  defaultValue=""
                  style={{
                    padding: "7px 10px", borderRadius: 8, background: BT.bgElevated,
                    border: `1px solid ${BT.border}`, color: BT.text, fontSize: 12,
                  }}
                >
                  <option value="" disabled>Restore version</option>
                  {builder.versions.map((v) => (
                    <option key={v.version} value={v.version}>v{v.version} — {v.label}</option>
                  ))}
                </select>
              )}
              <button
                onClick={handleSave}
                disabled={!builder.spec}
                style={actionBtnStyle(!builder.spec)}
              >
                Save
              </button>
              <button
                onClick={builder.download}
                disabled={!builder.spec}
                style={actionBtnStyle(!builder.spec, true)}
              >
                Export HTML
              </button>
              {builder.spec && (
                <button onClick={builder.reset} style={actionBtnStyle(false)}>New</button>
              )}
            </div>
          </div>

          <div style={{
            flex: 1, overflow: "auto", background: "#1a1a22",
            display: "flex", justifyContent: "center", padding: builder.device === "desktop" ? 0 : 24,
          }}>
            <div style={{
              width: DEVICE_WIDTHS[builder.device],
              maxWidth: "100%",
              height: builder.device === "desktop" ? "100%" : "auto",
              minHeight: builder.device !== "desktop" ? 640 : undefined,
              background: "#fff",
              borderRadius: builder.device !== "desktop" ? BT.radiusLg : 0,
              overflow: "hidden",
              boxShadow: builder.device !== "desktop" ? "0 24px 64px rgba(0,0,0,0.4)" : "none",
              transition: "width 0.3s ease",
            }}>
              <Suspense fallback={
                <div style={{ padding: 40, textAlign: "center", color: BT.textMuted }}>Loading preview…</div>
              }>
                <WebsiteRenderer spec={builder.spec} />
              </Suspense>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function actionBtnStyle(disabled, accent) {
  return {
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    border: `1px solid ${accent ? BT.accent : BT.border}`,
    background: accent ? BT.accent : "transparent",
    color: accent ? BT.bg : BT.text,
    opacity: disabled ? 0.4 : 1,
  };
}
