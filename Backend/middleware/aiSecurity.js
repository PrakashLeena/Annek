const rateLimit = require("express-rate-limit");

const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI generation limit reached. Please try again later." },
  keyGenerator: (req) => req.user?.uid || req.ip,
});

const aiUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: "AI update limit reached. Please try again later." },
  keyGenerator: (req) => req.user?.uid || req.ip,
});

const aiProjectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
});

const MAX_BODY_SIZE = 500000;

function validatePromptBody(req, res, next) {
  const bodySize = JSON.stringify(req.body || {}).length;
  if (bodySize > MAX_BODY_SIZE) {
    return res.status(413).json({ error: "Request too large." });
  }
  next();
}

module.exports = {
  aiGenerateLimiter,
  aiUpdateLimiter,
  aiProjectLimiter,
  validatePromptBody,
};
