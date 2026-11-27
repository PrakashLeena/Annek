/* Small inline stroke icons (decorative unless a label is passed). */
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

function Svg({ size = 20, label, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}
      role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : "true"}>
      {children}
    </svg>
  );
}

export const IconPhone = (p) => <Svg {...p}><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></Svg>;
export const IconGlobe = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></Svg>;
export const IconCode = (p) => <Svg {...p}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /></Svg>;
export const IconMail = (p) => <Svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></Svg>;
export const IconPin = (p) => <Svg {...p}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></Svg>;
export const IconChat = (p) => <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>;
export const IconClose = (p) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
export const IconMenu = (p) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
export const IconUpload = (p) => <Svg {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></Svg>;
export const IconArrow = (p) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const IconCheck = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></Svg>;

export function IconWhatsApp({ size = 26 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.8 6.5L4 29l7.7-1.8A12.9 12.9 0 0 0 16 28c6.6 0 12-5.4 12-12S22.6 3 16 3z" fill="#fff" />
      <path d="M22 19.4c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.3 3.3c.2.2 2.3 3.4 5.5 4.8.8.3 1.4.5 1.8.7.8.2 1.5.2 2 .1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4z" fill="#25D366" />
    </svg>
  );
}
