require("dotenv").config();
const transporter = require("./config/nodemailer");

console.log("Loading environment variables...");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "********" : "undefined");
console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "********" : "undefined");
console.log("BREVO_API_KEY:", process.env.BREVO_API_KEY ? "********" : "undefined");
console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY ? "********" : "undefined");

console.log("\n🚀 Attempting to send test email using config/nodemailer.js...");

transporter.sendMail({
  from: `"Annek Diagnostic" <${process.env.EMAIL_USER || "info@annek.tech"}>`,
  to: process.env.ADMIN_EMAIL || "kiboxsonleena51@gmail.com",
  subject: "🧪 Annek Resilient Mailer Diagnostic",
  text: "Hello! If you are reading this email, the resilient custom mailer configuration works!",
  html: "<h3>🎉 Diagnostic Test!</h3><p>Hello! If you are reading this email, the resilient custom mailer configuration works!</p>"
})
.then(info => {
  console.log("✅ Email sent successfully!");
  console.log("Message ID:", info.messageId);
  console.log("Response:", info.response);
})
.catch(err => {
  console.error("❌ Failed to send email:", err.message || err);
});
