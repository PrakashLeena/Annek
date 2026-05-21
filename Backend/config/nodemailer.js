const nodemailer = require("nodemailer");

const rawPass = process.env.EMAIL_PASS || "";
// Strip any whitespace from the Gmail App Password since Google shows it as "xxxx xxxx xxxx xxxx" 
// but requires "xxxxxxxxxxxxxxxx" (without spaces) for SMTP authentication.
const cleanPass = rawPass.replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: cleanPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Nodemailer SMTP Connection Error:", error.message || error);
    console.error("👉 Tip: Verify that EMAIL_USER matches your Gmail address and EMAIL_PASS is a valid 16-character App Password.");
  } else {
    console.log("🚀 Nodemailer SMTP Connection Verified Successfully!");
  }
});

module.exports = transporter;
