/**
 * Server-side admin guard.
 *
 * The admin panel signs in with Firebase (Google). The browser sends the
 * Firebase ID token as `Authorization: Bearer <token>`; we verify it here and
 * check the email against the admin allow-list. Without this check every admin
 * endpoint (orders, contacts, settings…) would be open to anyone.
 *
 * Env (either name works, so the merged Vercel project can reuse the VITE_ vars):
 *   ADMIN_EMAILS        or VITE_ADMIN_EMAILS         comma-separated admin emails
 *   FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID  Firebase project id
 *   FIREBASE_SERVICE_ACCOUNT_JSON (optional; project id is read from it too)
 */
let verifier = null;

function adminEmails() {
  return (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function getVerifier() {
  if (verifier !== null) return verifier;
  try {
    const firebaseAdmin = require("firebase-admin");
    if (!firebaseAdmin.apps.length) {
      const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (saJson) {
        firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(JSON.parse(saJson)) });
      } else {
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
        if (!projectId) { verifier = false; return verifier; }
        // Verifying ID tokens only needs the project id (public Google certs).
        firebaseAdmin.initializeApp({ projectId });
      }
    }
    verifier = firebaseAdmin.auth();
  } catch (err) {
    console.warn("Admin auth not configured:", err.message);
    verifier = false;
  }
  return verifier;
}

async function requireAdmin(req, res, next) {
  res.set("Cache-Control", "no-store");
  const emails = adminEmails();
  const auth = getVerifier();
  if (!emails.length || !auth) {
    return res.status(503).json({ error: "Admin access is not configured on the server." });
  }
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Admin sign-in required." });
  }
  try {
    const decoded = await auth.verifyIdToken(header.slice(7));
    const email = (decoded.email || "").toLowerCase();
    if (!email || decoded.email_verified === false || !emails.includes(email)) {
      return res.status(403).json({ error: "Not an admin account." });
    }
    req.admin = { uid: decoded.uid, email };
    next();
  } catch {
    return res.status(401).json({ error: "Admin session expired. Please sign in again." });
  }
}

// Test hook: lets unit tests swap in a fake token verifier.
function _setVerifierForTests(v) { verifier = v; }

module.exports = { requireAdmin, adminEmails, _setVerifierForTests };
