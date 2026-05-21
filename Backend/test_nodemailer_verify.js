require("dotenv").config();
const nodemailer = require("nodemailer");

const rawPass = process.env.EMAIL_PASS;
const passNoSpaces = rawPass ? rawPass.replace(/\s+/g, "") : "";

async function testConfig(config, label) {
  console.log(`\n--- Testing config: ${label} ---`);
  const transporter = nodemailer.createTransport(config);

  try {
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) reject(error);
        else resolve(success);
      });
    });
    console.log(`✅ Success: ${label} verified successfully!`);
    return true;
  } catch (err) {
    console.log(`❌ Failed: ${label} failed:`, err.message || err);
    return false;
  }
}

async function run() {
  // Test Port 587 (STARTTLS)
  await testConfig({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // false for STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: passNoSpaces
    },
    tls: {
      rejectUnauthorized: false
    }
  }, "Port 587 (STARTTLS)");

  // Test Port 465 (Implicit SSL/TLS)
  await testConfig({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: passNoSpaces
    },
    tls: {
      rejectUnauthorized: false
    }
  }, "Port 465 (SSL/TLS)");
}

run();
