const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPrescriptionMail = async (to, name, prescription, doctorName) => {
  const html = `
  <div style="font-family: Arial; background:#f4f6f9; padding:20px;">
    
    <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:20px;box-shadow:0 5px 20px rgba(0,0,0,0.1)">
      
      <h2 style="color:#2563eb;">🩺 Prescription</h2>

      <p>Hello <b>${name}</b>,</p>

      <p>Your doctor <b>Dr. ${doctorName}</b> has provided a prescription.</p>

      <div style="background:#f1f5f9;padding:15px;border-radius:8px;margin:15px 0;white-space:pre-line;">
        ${prescription}
      </div>

      <p style="color:#555;">Follow instructions carefully.</p>

      <hr/>

      <p style="font-size:12px;color:#888;">
        PAMS - Patient Appointment System
      </p>

    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"PAMS Hospital" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Prescription 🩺",
    html,
  });
};

module.exports = sendPrescriptionMail;