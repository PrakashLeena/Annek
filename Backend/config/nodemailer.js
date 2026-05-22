const nodemailer = require("nodemailer");

// Clean the app password (remove any spaces in case it was copied with spaces)
const rawPass = process.env.EMAIL_PASS || "";
const cleanPass = rawPass.replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER, // annek.websitebuild.official@gmail.com
    pass: cleanPass,              // Gmail App Password (16 chars, no spaces)
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection on startup
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Gmail SMTP connection failed:", err.message || err);
    console.error("   → Make sure EMAIL_USER and EMAIL_PASS are set correctly in .env");
    console.error("   → EMAIL_PASS must be a Gmail App Password (not your login password)");
  } else {
    console.log("✅ Gmail SMTP ready — connected as", process.env.EMAIL_USER);
  }
});

module.exports = transporter;
