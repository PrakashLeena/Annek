/**
 * ANNEK BACKEND — Security Middleware
 * File: Backend/middleware/security.js
 * 
 * Add to server.js:
 *   const { applySecurityMiddleware } = require("./middleware/security");
 *   applySecurityMiddleware(app);
 */

const rateLimit = require("express-rate-limit");

// ─── Rate Limiters ───────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,       // 15 minutes
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: (req) => req.path === "/api/health",
});

const ordersLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,       // 1 hour
  max: 10,
  message: { error: "Order limit reached. Please contact us directly." },
  keyGenerator: (req) => req.ip,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Message limit reached. Please try again in an hour." },
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Feedback limit reached." },
});

// ─── Input Sanitizer ─────────────────────────────────────────
function sanitizeInput(obj, depth = 0) {
  if (depth > 5) return {};
  if (typeof obj === "string") {
    return obj
      .replace(/<[^>]*>/g, "")          // Strip HTML tags
      .replace(/javascript:/gi, "")      // Block JS protocol
      .replace(/on\w+\s*=/gi, "")        // Block event handlers
      .replace(/\x00/g, "")              // Null bytes
      .trim()
      .slice(0, 5000);
  }
  if (Array.isArray(obj)) return obj.map(v => sanitizeInput(v, depth + 1));
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 64),
        sanitizeInput(v, depth + 1),
      ])
    );
  }
  return obj;
}

// ─── Sanitizer Middleware ─────────────────────────────────────
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeInput(req.body);
  }
  next();
}

// ─── Security Headers ─────────────────────────────────────────
// Note: Primary headers set in vercel.json. These are fallbacks for
// non-Vercel deployments (Railway, Render, etc.)
function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  // Remove fingerprinting headers
  res.removeHeader("X-Powered-By");
  next();
}

// ─── API Key Validator (simple secret check for admin routes) ─
function requireAdminSecret(req, res, next) {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ─── NoSQL Injection Preventer ────────────────────────────────
function preventNoSQLInjection(req, res, next) {
  const checkForOperators = (obj) => {
    if (typeof obj === "object" && obj !== null) {
      for (const key of Object.keys(obj)) {
        if (key.startsWith("$") || key.includes(".")) {
          return true;
        }
        if (checkForOperators(obj[key])) return true;
      }
    }
    return false;
  };
  if (req.body && checkForOperators(req.body)) {
    return res.status(400).json({ error: "Invalid input." });
  }
  next();
}

// ─── Main export ─────────────────────────────────────────────
function applySecurityMiddleware(app) {
  // Global middlewares
  app.use(securityHeaders);
  app.use(globalLimiter);
  app.use(preventNoSQLInjection);
  app.use(sanitizeBody);

  // Route-specific rate limits
  app.use("/api/orders",   ordersLimiter);
  app.use("/api/contact",  contactLimiter);
  app.use("/api/feedback", feedbackLimiter);

  console.log("✅ Security middleware applied");
}

module.exports = {
  applySecurityMiddleware,
  sanitizeInput,
  requireAdminSecret,
  ordersLimiter,
  contactLimiter,
};
