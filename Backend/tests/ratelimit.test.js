// Run: node --test tests/ratelimit.test.js
// The contact limiter must count each visitor separately behind Vercel's proxy.
process.env.VERCEL = "1";
process.env.MONGODB_URI = "";
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const Contact = require("../models/Contact");
const transporter = require("../config/nodemailer");
const app = require("../server");

let base, server;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); mongoose.disconnect().catch(() => {}); });

test("rate limits are per visitor IP (X-Forwarded-For from the proxy)", async () => {
  const origSave = Contact.prototype.save, origSend = transporter.sendMail;
  Contact.prototype.save = async function () { return this; };
  transporter.sendMail = async () => {};
  try {
    const send = (ip) => fetch(`${base}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
      body: JSON.stringify({ name: "T", email: "t@example.com", message: "hi" }),
    }).then((r) => r.status);
    for (let i = 0; i < 5; i++) assert.equal(await send("203.0.113.7"), 200);
    assert.equal(await send("203.0.113.7"), 429, "6th message from the same visitor is limited");
    assert.equal(await send("198.51.100.9"), 200, "another visitor is not affected");
  } finally {
    Contact.prototype.save = origSave;
    transporter.sendMail = origSend;
  }
});
