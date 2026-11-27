// Run: node --test tests/inquiries.test.js   (email is stubbed; nothing is sent)
process.env.VERCEL = "1";
process.env.MONGODB_URI = "";
process.env.EMAIL_USER = "sender@gmail.com";
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const transporter = require("../config/nodemailer");
const app = require("../server");

let base, server, mails, origSend, ipSeq = 1;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
  origSend = transporter.sendMail;
});
test.after(() => { transporter.sendMail = origSend; server.close(); mongoose.disconnect().catch(() => {}); });
test.beforeEach(() => { mails = []; transporter.sendMail = async (m) => { mails.push(m); }; });

// Each test uses its own visitor IP so the 5/hour limiter doesn't interfere.
const post = (body, ip = `192.0.2.${ipSeq++}`) => fetch(`${base}/api/inquiries`, {
  method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": ip }, body: JSON.stringify(body),
}).then(async (r) => ({ status: r.status, body: await r.json() }));
const valid = { category: "mobile", solution: "Food Delivery App", name: "Nimal Perera", email: "nimal@example.com", message: "Add Sinhala and Tamil.", budget: "$500 to $1,000" };

test("sends to info@annek.tech with subject format and reply-to", async () => {
  delete process.env.INQUIRY_TO_EMAIL;
  const r = await post(valid);
  assert.equal(r.status, 200);
  assert.equal(mails.length, 1);
  const m = mails[0];
  assert.equal(m.to, "info@annek.tech");
  assert.equal(m.subject, "[Mobile App customization] Food Delivery App | Nimal Perera");
  assert.deepEqual(m.replyTo, { name: "Nimal Perera", address: "nimal@example.com" });
  assert.match(m.from, /sender@gmail\.com/, "from stays the existing sending address");
  assert.match(m.text, /Budget: \$500 to \$1,000/);
  assert.doesNotMatch(m.text, /Phone:/, "empty optional fields are left out");
});

test("category labels and INQUIRY_TO_EMAIL override", async () => {
  process.env.INQUIRY_TO_EMAIL = "sales@annek.tech";
  await post({ ...valid, category: "web", solution: "" });
  await post({ ...valid, category: "software" });
  delete process.env.INQUIRY_TO_EMAIL;
  assert.equal(mails[0].to, "sales@annek.tech");
  assert.equal(mails[0].subject, "[Web App customization] Something new | Nimal Perera");
  assert.equal(mails[1].subject, "[Software customization] Food Delivery App | Nimal Perera");
});

test("validation: required fields, email format, category, lengths", async () => {
  for (const bad of [{ name: "" }, { email: "nope" }, { message: "  " }, { category: "games" }, { message: "x".repeat(3001) }]) {
    const r = await post({ ...valid, ...bad });
    assert.equal(r.status, 400, JSON.stringify(bad));
  }
  assert.equal(mails.length, 0);
});

test("honeypot submissions get a fake success and send nothing", async () => {
  const r = await post({ ...valid, website: "http://spam.example" });
  assert.equal(r.status, 200);
  assert.equal(mails.length, 0);
});

test("HTML is escaped and header injection is flattened", async () => {
  await post({ ...valid, name: "Eve\r\nBcc: victim@example.com", message: "<script>alert(1)</script>" });
  const m = mails[0];
  assert.doesNotMatch(m.subject, /[\r\n]/);
  assert.doesNotMatch(m.html, /<script>/);
  assert.match(m.html, /&lt;script&gt;/);
});

test("email failure returns 502 with the fallback address", async () => {
  transporter.sendMail = async () => { throw new Error("SMTP down"); };
  const r = await post(valid);
  assert.equal(r.status, 502);
  assert.equal(r.body.fallback, "info@annek.tech");
});

test("rate limit: 5 per hour per visitor", async () => {
  const ip = "203.0.113.50";
  for (let i = 0; i < 5; i++) assert.equal((await post(valid, ip)).status, 200);
  const r = await post(valid, ip);
  assert.equal(r.status, 429);
  assert.match(r.body.error, /info@annek\.tech/);
});
