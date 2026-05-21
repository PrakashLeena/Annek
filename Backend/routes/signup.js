const express = require("express");
const router = express.Router();
const Signup = require("../models/Signup");
const transporter = require("../config/nodemailer");

function signupEmailHtml(data) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#19376d;padding:28px 32px">
      <h1 style="margin:0;color:#d4f74b;font-size:22px;font-weight:700">🎁 New Report Signup - Annek</h1>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 16px;color:#555;font-size:16px;line-height:1.5">
        A new user has successfully registered to claim their free website audit/report. Here are their details:
      </p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:10px 12px;font-weight:600;color:#555;width:140px;border-bottom:1px solid #f0f0f0">First Name</td>
          <td style="padding:10px 12px;color:#333;border-bottom:1px solid #f0f0f0">${data.firstName}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:600;color:#555;border-bottom:1px solid #f0f0f0">Last Name</td>
          <td style="padding:10px 12px;color:#333;border-bottom:1px solid #f0f0f0">${data.lastName}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:600;color:#555;border-bottom:1px solid #f0f0f0">Email Address</td>
          <td style="padding:10px 12px;color:#333;border-bottom:1px solid #f0f0f0">
            <a href="mailto:${data.email}" style="color:#5c4ef8;text-decoration:none">${data.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:600;color:#555;border-bottom:1px solid #f0f0f0">Company Name</td>
          <td style="padding:10px 12px;color:#333;border-bottom:1px solid #f0f0f0">${data.company}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:600;color:#555;border-bottom:1px solid #f0f0f0">Job Title</td>
          <td style="padding:10px 12px;color:#333;border-bottom:1px solid #f0f0f0">${data.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:600;color:#555">Signup Date</td>
          <td style="padding:10px 12px;color:#333">${new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;font-size:12px;color:#999;border-top:1px solid #f0f0f0">
      This is an automated signup notification sent by the Annek Platform.
    </div>
  </div></body></html>`;
}

// GET /api/signup — fetch all signups (for admin dashboard)
router.get("/", async (req, res) => {
  try {
    const signups = await Signup.find().sort({ createdAt: -1 });
    res.json(signups);
  } catch (error) {
    console.error("Fetch signups error:", error);
    res.status(500).json({ error: "Failed to fetch signups." });
  }
});

// DELETE /api/signup/:id — delete a specific signup
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Signup.findByIdAndDelete(id);
    res.json({ success: true, message: "Signup successfully deleted." });
  } catch (error) {
    console.error("Delete signup error:", error);
    res.status(500).json({ error: "Failed to delete signup." });
  }
});

// POST /api/signup — submit details and save + send email
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, company, jobTitle } = req.body;
    if (!firstName || !lastName || !email || !company || !jobTitle) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const signup = new Signup({ firstName, lastName, email, company, jobTitle });
    await signup.save();

    // Send email notification to Admin
    try {
      await transporter.sendMail({
        from: `"Annek Signup Center" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `🎁 New Report Signup: ${firstName} ${lastName} (${company})`,
        html: signupEmailHtml({ firstName, lastName, email, company, jobTitle }),
      });
    } catch (emailErr) {
      console.error("⚠️ Failed to send signup notification email:", emailErr.message || emailErr);
    }

    res.json({ success: true, signup });
  } catch (error) {
    console.error("Signup submission error:", error);
    res.status(500).json({ error: "Failed to process signup." });
  }
});

module.exports = router;
