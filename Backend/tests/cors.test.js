// Run: node --test tests/cors.test.js
// Only https://annek.tech (plus localhost dev ports) may call the API from a browser.
process.env.VERCEL = "1";
process.env.MONGODB_URI = "";
process.env.FRONTEND_URL = "https://evil.example"; // must be ignored now
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const app = require("../server");

let base, server;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); mongoose.disconnect().catch(() => {}); });

const preflight = (origin) => fetch(`${base}/api/inquiries`, {
  method: "OPTIONS",
  headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
}).then((r) => r.headers.get("access-control-allow-origin"));

test("allowed: the official site and local dev", async () => {
  for (const o of ["https://annek.tech", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]) {
    assert.equal(await preflight(o), o, o);
  }
});

test("blocked: www, vercel.app hosts, FRONTEND_URL extras, anything else", async () => {
  for (const o of ["https://www.annek.tech", "https://annek.vercel.app", "https://annek-jet.vercel.app", "https://annek-d6zv-a-g-prakash-leenas-projects.vercel.app", "https://evil.example", "http://annek.tech"]) {
    assert.equal(await preflight(o), null, o);
  }
});
