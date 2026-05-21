const nodemailer = require("nodemailer");

const rawPass = process.env.EMAIL_PASS || "";
const cleanPass = rawPass.replace(/\s+/g, "");

// Setup real nodemailer transporter for SMTP fallback
let smtpTransporter = null;
try {
  smtpTransporter = nodemailer.createTransport({
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
} catch (e) {
  console.warn("⚠️ Failed to initialize standard nodemailer transporter:", e.message);
}

// Helper to parse from address (e.g. '"Annek Platform" <email@domain.com>')
function parseFrom(fromStr) {
  let name = "Annek";
  let email = process.env.EMAIL_USER || "info@annek.tech";
  if (!fromStr) return { name, email };
  
  const match = fromStr.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (match) {
    name = (match[1] || name).trim();
    email = (match[2] || email).trim();
  }
  return { name, email };
}

const customTransporter = {
  verify: (callback) => {
    // Determine active transport mechanism
    if (process.env.SENDGRID_API_KEY) {
      console.log("🚀 Custom Mailer: Verified using SendGrid API Key.");
      if (callback) callback(null, true);
      return Promise.resolve(true);
    }
    if (process.env.BREVO_API_KEY) {
      console.log("🚀 Custom Mailer: Verified using Brevo API Key.");
      if (callback) callback(null, true);
      return Promise.resolve(true);
    }
    if (process.env.RESEND_API_KEY) {
      console.log("🚀 Custom Mailer: Verified using Resend API Key.");
      if (callback) callback(null, true);
      return Promise.resolve(true);
    }

    console.log("🚀 Custom Mailer: No HTTP Mail API Key found. Using SMTP fallback verify...");
    if (smtpTransporter) {
      smtpTransporter.verify((err, success) => {
        if (err) {
          console.error("❌ SMTP Verification failed:", err.message || err);
          if (callback) callback(err);
        } else {
          console.log("🚀 SMTP Verification succeeded!");
          if (callback) callback(null, success);
        }
      });
    } else {
      const err = new Error("No mail configuration available (no SMTP transporter and no API Keys)");
      if (callback) callback(err);
      return Promise.reject(err);
    }
  },

  sendMail: async (mailOptions) => {
    const { from, to, subject, html, text } = mailOptions;
    const toArray = Array.isArray(to) ? to : [to];
    let lastError = null;

    // 1. SendGrid API
    if (process.env.SENDGRID_API_KEY) {
      try {
        console.log(`📡 Sending mail via SendGrid API to: ${toArray.join(", ")}`);
        const { name: senderName, email: senderEmail } = parseFrom(from);
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: toArray.map(email => ({ email })) }],
            from: { name: senderName, email: senderEmail },
            subject: subject,
            content: [{ type: "text/html", value: html || text }],
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`SendGrid API error (${res.status}): ${errText}`);
        }
        console.log("✅ SendGrid email sent successfully.");
        return { messageId: "sendgrid-ok", response: "SendGrid OK" };
      } catch (err) {
        console.error("⚠️ SendGrid HTTP delivery failed:", err.message || err);
        lastError = err;
      }
    }

    // 2. Brevo API
    if (process.env.BREVO_API_KEY) {
      try {
        console.log(`📡 Sending mail via Brevo API to: ${toArray.join(", ")}`);
        const { name: senderName, email: senderEmail } = parseFrom(from);
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: toArray.map(email => ({ email })),
            subject: subject,
            htmlContent: html || text,
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(`Brevo API error (${res.status}): ${JSON.stringify(resData)}`);
        }
        console.log("✅ Brevo email sent successfully. Message ID:", resData.messageId);
        return { messageId: resData.messageId, response: "Brevo OK" };
      } catch (err) {
        console.error("⚠️ Brevo HTTP delivery failed:", err.message || err);
        lastError = err;
      }
    }

    // 3. Resend API
    if (process.env.RESEND_API_KEY) {
      try {
        console.log(`📡 Sending mail via Resend API to: ${toArray.join(", ")}`);
        
        // Rewrite from email to onboarding@resend.dev if using default domain restriction
        const usesGmailSender = from.toLowerCase().includes("@gmail.com");
        const finalFrom = usesGmailSender ? `"Annek" <onboarding@resend.dev>` : from;
        if (usesGmailSender) {
          console.log(`ℹ️ Resend sandbox helper: Rewriting sender email from Gmail to onboarding@resend.dev to avoid 403 restriction.`);
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: finalFrom,
            to: toArray,
            subject: subject,
            html: html || text,
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(`Resend API error (${res.status}): ${JSON.stringify(resData)}`);
        }
        console.log("✅ Resend email sent successfully. ID:", resData.id);
        return { messageId: resData.id, response: "Resend OK" };
      } catch (err) {
        console.error("⚠️ Resend HTTP delivery failed:", err.message || err);
        lastError = err;
      }
    }

    // 4. SMTP Fallback
    if (smtpTransporter) {
      console.log(`📡 Sending mail via SMTP (Gmail) to: ${toArray.join(", ")}`);
      return new Promise((resolve, reject) => {
        smtpTransporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error("❌ SMTP sendMail failed:", err.message || err);
            reject(lastError || err);
          } else {
            console.log("✅ SMTP email sent successfully:", info.response);
            resolve(info);
          }
        });
      });
    }

    throw lastError || new Error("No configured mail transporter or API key found to send email.");
  }
};

// Auto-run verify on startup
customTransporter.verify();

module.exports = customTransporter;
