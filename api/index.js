// Single-project entry point.
// Vercel serves this file as a serverless function at /api, and vercel.json
// rewrites every /api/* request here. The Express app in Backend/server.js
// already defines its routes with the /api prefix, so no route changes are needed.
module.exports = require("../Backend/server.js");
