require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("Loading environment variables...");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "********" : "undefined");
console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log("\n🚀 Attempting to send test email...");
transporter.sendMail({
  from: `"Annek Diagnostic" <${process.env.EMAIL_USER}>`,
  to: process.env.ADMIN_EMAIL,
  subject: "🧪 Annek Resilient SMTP Test Email",
  text: "Hello! If you are reading this email, the resilient Nodemailer SMTP configurations over Port 465 are working flawlessly!",
  html: "<h3>🎉 SMTP Test Successful!</h3><p>Hello! If you are reading this email, the resilient Nodemailer SMTP configurations over Port 465 are working flawlessly!</p>"
})
.then(info => {
  console.log("✅ Email sent successfully!");
  console.log("Message ID:", info.messageId);
  console.log("Response:", info.response);
})
.catch(err => {
  console.error("❌ Failed to send email:", err);
});
