import { useState } from "react";
import { Link } from "react-router-dom";
import coderImg from "./images/coder_character.png";
import logoImg from "./images/logo.png";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobTitle: "",
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Simple SVG Icons
  const UserIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#8892b0" }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const MailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#8892b0" }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );

  const BuildingIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#8892b0" }}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="16" />
      <line x1="15" y1="22" x2="15" y2="16" />
      <line x1="9" y1="16" x2="15" y2="16" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M12 6h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );

  const BriefcaseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#8892b0" }}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );

  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const validateStep1 = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Please enter a valid email address";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.company.trim()) errs.company = "Company name is required";
    if (!form.jobTitle.trim()) errs.jobTitle = "Job title is required";
    if (!form.consent) errs.consent = "You must accept the privacy policy to continue";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          company: form.company,
          jobTitle: form.jobTitle,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit form");
      }

      setSuccess(true);
      setStep(3);
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Failed to submit. Please try again later." });
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 10% 20%, #0c1a30 0%, #070d18 90%)",
      fontFamily: "'DM Sans', 'Montserrat', 'Lato', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden"
    }}>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.15; transform: scale(0.98); }
          50% { opacity: 0.28; transform: scale(1.03); }
          100% { opacity: 0.15; transform: scale(0.98); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .signup-container {
          display: grid;
          grid-template-columns: 42% 58%;
          width: 100%;
          max-width: 1040px;
          min-height: 620px;
          background: rgba(13, 27, 56, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.35);
          animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .left-panel {
          background: linear-gradient(135deg, rgba(25, 55, 109, 0.9) 0%, rgba(13, 27, 56, 0.95) 100%);
          padding: 44px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }
        .left-panel-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #5c4ef8 0%, transparent 70%);
          top: 10%;
          left: -10%;
          filter: blur(50px);
          z-index: 1;
          animation: pulseGlow 6s ease-in-out infinite;
          pointer-events: none;
        }
        .left-panel-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }
        .branding {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }
        .branding img {
          height: 32px;
          width: auto;
          filter: brightness(1.2);
        }
        .branding span {
          color: #fff;
          font-weight: 700;
          font-size: 19px;
          letter-spacing: -0.5px;
        }
        .graphic-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 20px 0;
        }
        .graphic-img {
          max-width: 90%;
          height: auto;
          max-height: 280px;
          object-fit: contain;
          filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.4));
          animation: float 5s ease-in-out infinite;
        }
        .promo-text h2 {
          color: #fff;
          font-size: 22px;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }
        .promo-text p {
          color: #8892b0;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .right-panel {
          padding: 50px 55px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(8, 14, 27, 0.3);
          position: relative;
        }
        .form-header {
          margin-bottom: 30px;
        }
        .form-header h1 {
          color: #fff;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .form-header p {
          color: #8892b0;
          font-size: 14px;
        }
        .progress-bar-container {
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          margin-bottom: 32px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #5c4ef8, #8c82ff);
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .input-group {
          margin-bottom: 20px;
          position: relative;
        }
        .input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .input-label {
          color: #ccd6f6;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          display: block;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-wrapper svg {
          position: absolute;
          left: 14px;
          pointer-events: none;
          transition: color 0.2s;
        }
        .input-field {
          width: 100%;
          padding: 13px 16px 13px 42px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s;
        }
        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
        .input-field:focus {
          border-color: #5c4ef8;
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 0 4px rgba(92, 78, 248, 0.15);
          outline: none;
        }
        .input-field:focus + svg {
          color: #5c4ef8 !important;
        }
        .input-field.error {
          border-color: #ff5252;
          box-shadow: 0 0 0 4px rgba(255, 82, 82, 0.15);
        }
        .error-message {
          color: #ff5252;
          font-size: 11.5px;
          margin-top: 5px;
          display: block;
        }
        .btn-submit {
          width: 100%;
          background: #5c4ef8;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          margin-top: 10px;
          box-shadow: 0 4px 16px rgba(92, 78, 248, 0.25);
        }
        .btn-submit:hover {
          background: #6e62ff;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(92, 78, 248, 0.35);
        }
        .btn-submit:active {
          transform: translateY(0);
        }
        .btn-back {
          background: transparent;
          color: #8892b0;
          border: none;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 18px;
          align-self: center;
          transition: color 0.2s;
          font-family: inherit;
        }
        .btn-back:hover {
          color: #fff;
        }
        .consent-container {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 24px;
          margin-bottom: 16px;
          cursor: pointer;
        }
        .consent-checkbox {
          width: 17px;
          height: 17px;
          border-radius: 5px;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          margin-top: 2px;
          color: transparent;
        }
        .consent-checkbox.checked {
          background: #5c4ef8;
          border-color: #5c4ef8;
          color: #fff;
        }
        .consent-text {
          color: #8892b0;
          font-size: 12.5px;
          line-height: 1.45;
          user-select: none;
        }
        .consent-text a {
          color: #5c4ef8;
          text-decoration: none;
          font-weight: 500;
        }
        .consent-text a:hover {
          text-decoration: underline;
        }
        .thank-you-screen {
          text-align: center;
          animation: slideIn 0.5s ease-out forwards;
        }
        .success-icon {
          width: 64px;
          height: 64px;
          background: rgba(212, 247, 75, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #d4f74b;
        }
        .success-icon svg {
          width: 32px;
          height: 32px;
        }
        .success-link {
          color: #5c4ef8;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .success-link:hover {
          color: #8c82ff;
          text-decoration: underline;
        }
        .btn-download {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #d4f74b;
          color: #070d18;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 28px;
          border-radius: 12px;
          margin-top: 28px;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(212, 247, 75, 0.2);
        }
        .btn-download:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212, 247, 75, 0.35);
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 860px) {
          .signup-container {
            grid-template-columns: 1fr;
            max-width: 500px;
          }
          .left-panel {
            padding: 30px;
            align-items: center;
            text-align: center;
          }
          .graphic-container {
            display: none;
          }
          .promo-text {
            margin-top: 15px;
          }
          .right-panel {
            padding: 35px 30px;
          }
        }
      `}</style>

      <div className="signup-container">
        {/* Left branding panel */}
        <div className="left-panel">
          <div className="left-panel-glow"></div>
          <div className="left-panel-content">
            <Link to="/" className="branding">
              <img src={logoImg} alt="Annek logo" />
              <span>Annek</span>
            </Link>

            <div className="graphic-container">
              <img src={coderImg} alt="3D Coder" className="graphic-img" />
            </div>

            <div className="promo-text">
              <h2>Claim Your FREE Website Optimization Audit</h2>
              <p>Get a comprehensive inspection of your website speed, accessibility, SEO benchmarks, and a high-converting wireframe proposal.</p>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="right-panel">
          {/* Progress Indicator */}
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column" }}>
              {/* Form header description */}
              <div className="form-header">
                <h1>{step === 1 ? "Get Started" : "About Your Business"}</h1>
                <p>{step === 1 ? "First, tell us who you are so we can address you." : "Help us understand your company details."}</p>
              </div>

              {/* STEP 1: User Info */}
              {step === 1 && (
                <div>
                  <div className="input-row">
                    <div>
                      <label className="input-label">First Name *</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          className={`input-field ${errors.firstName ? "error" : ""}`}
                          placeholder="First Name"
                          value={form.firstName}
                          onChange={e => {
                            setForm({ ...form, firstName: e.target.value });
                            if (errors.firstName) setErrors({ ...errors, firstName: "" });
                          }}
                        />
                        <UserIcon />
                      </div>
                      {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>

                    <div>
                      <label className="input-label">Last Name *</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          className={`input-field ${errors.lastName ? "error" : ""}`}
                          placeholder="Last Name"
                          value={form.lastName}
                          onChange={e => {
                            setForm({ ...form, lastName: e.target.value });
                            if (errors.lastName) setErrors({ ...errors, lastName: "" });
                          }}
                        />
                        <UserIcon />
                      </div>
                      {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Your Email *</label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        className={`input-field ${errors.email ? "error" : ""}`}
                        placeholder="Ex. yourname@company.com"
                        value={form.email}
                        onChange={e => {
                          setForm({ ...form, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: "" });
                        }}
                      />
                      <MailIcon />
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <button
                    type="button"
                    className="btn-submit"
                    onClick={handleNext}
                  >
                    Next Step
                  </button>
                </div>
              )}

              {/* STEP 2: Company Details */}
              {step === 2 && (
                <div>
                  <div className="input-group">
                    <label className="input-label">Company Name *</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className={`input-field ${errors.company ? "error" : ""}`}
                        placeholder="What's your Company Name?"
                        value={form.company}
                        onChange={e => {
                          setForm({ ...form, company: e.target.value });
                          if (errors.company) setErrors({ ...errors, company: "" });
                        }}
                      />
                      <BuildingIcon />
                    </div>
                    {errors.company && <span className="error-message">{errors.company}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Job Title *</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className={`input-field ${errors.jobTitle ? "error" : ""}`}
                        placeholder="What's your Job Title?"
                        value={form.jobTitle}
                        onChange={e => {
                          setForm({ ...form, jobTitle: e.target.value });
                          if (errors.jobTitle) setErrors({ ...errors, jobTitle: "" });
                        }}
                      />
                      <BriefcaseIcon />
                    </div>
                    {errors.jobTitle && <span className="error-message">{errors.jobTitle}</span>}
                  </div>

                  {/* Consent checkbox */}
                  <div
                    className="consent-container"
                    onClick={() => {
                      setForm({ ...form, consent: !form.consent });
                      if (errors.consent) setErrors({ ...errors, consent: "" });
                    }}
                  >
                    <div className={`consent-checkbox ${form.consent ? "checked" : ""}`}>
                      <CheckIcon />
                    </div>
                    <span className="consent-text">
                      By signing up, I agree to the company's{" "}
                      <a href="https://www.visme.co/forms/" target="_blank" rel="noreferrer noopener" onClick={e => e.stopPropagation()}>
                        Privacy Policy
                      </a>.
                    </span>
                  </div>
                  {errors.consent && <span className="error-message" style={{ display: "block", marginBottom: "15px" }}>{errors.consent}</span>}

                  {errors.submit && <span className="error-message" style={{ display: "block", marginBottom: "15px", textAlign: "center" }}>{errors.submit}</span>}

                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? <div className="spinner"></div> : "Claim Your FREE Report"}
                  </button>

                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* STEP 3: Thank you Screen */
            <div className="thank-you-screen">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: "700", marginBottom: "12px" }}>Thank you!</h1>
              <p style={{ color: "#8892b0", fontSize: "15px", lineHeight: "1.6", maxWidth: "380px", margin: "0 auto 8px" }}>
                Your request has been registered successfully.
              </p>
              <p style={{ color: "#8892b0", fontSize: "15px", lineHeight: "1.6", maxWidth: "380px", margin: "0 auto" }}>
                You can now download your <a href="https://www.visme.co/ebook-creator/" target="_blank" rel="noreferrer noopener" className="success-link">report here</a>. Enjoy!
              </p>
              <a
                href="https://www.visme.co/ebook-creator/"
                target="_blank"
                rel="noreferrer noopener"
                className="btn-download"
              >
                Click here to download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
