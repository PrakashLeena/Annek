// Run: node --test "tests/**/*.test.js"  (no database or email needed — both are stubbed)
process.env.VERCEL = "1";
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const Order = require("../models/Order");
const transporter = require("../config/nodemailer");
const app = require("../server");

let base, server;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); mongoose.disconnect().catch(() => {}); });

const post = (data) => {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  return fetch(`${base}/api/orders`, { method: "POST", body: fd }).then(async (r) => ({ status: r.status, body: await r.json() }));
};

test("order needs name and email", async () => {
  assert.equal((await post({ name: "A" })).status, 400);
});

test("clients cannot set status, and email HTML is escaped", async () => {
  const saved = [];
  const mails = [];
  const origSave = Order.prototype.save;
  const origSend = transporter.sendMail;
  Order.prototype.save = async function () { saved.push(this.toObject()); return this; };
  transporter.sendMail = async (m) => { mails.push(m); };
  try {
    const r = await post({
      name: "<b>Eve</b>", email: "eve@example.com", status: "completed",
      description: "<script>alert(1)</script>", platforms: ["Android"], phone: "0771234567",
      logoUrl: "javascript:alert(1)",
    });
    assert.equal(r.status, 200);
    assert.equal(saved[0].status, "pending");
    assert.equal(saved[0].logoUrl, "");
    assert.deepEqual(saved[0].platforms, ["Android"]);
    assert.equal(saved[0].phone, "0771234567");
    assert.ok(mails.length >= 1);
    for (const m of mails) {
      assert.ok(!m.html.includes("<script>"), "script tag must not reach the email");
      assert.ok(!m.html.includes("<b>Eve</b>"), "name must be escaped");
    }
  } finally {
    Order.prototype.save = origSave;
    transporter.sendMail = origSend;
  }
});
