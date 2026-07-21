let admin = null;

function getAdmin() {
  if (admin !== null) return admin;
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      admin = false;
      return admin;
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    const firebaseAdmin = require("firebase-admin");
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });
    }
    admin = firebaseAdmin;
    return admin;
  } catch (err) {
    console.warn("Firebase Admin not configured:", err.message);
    admin = false;
    return admin;
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const firebaseAdmin = getAdmin();
  if (!firebaseAdmin) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
    };
    next();
  } catch {
    req.user = null;
    next();
  }
}

async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {
    if (!req.user?.uid) {
      return res.status(401).json({
        error: "Sign in required to save projects.",
      });
    }
    next();
  });
}

module.exports = { optionalAuth, requireAuth, getAdmin };
