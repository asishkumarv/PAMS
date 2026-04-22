const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPrescriptionMail = async (to, patientName, prescription) => {
  const html = `
  <div style="font-family: Arial; background:#f4f6f9; padding:20px;">
    
    <div style="max-width:600px;margin:auto;background:white;border-radius:10px;padding:20px;box-shadow:0 5px 15px rgba(0,0,0,0.1)">
      
      <h2 style="color:#2563eb;">🩺 Prescription Update</h2>

      <p>Hello <b>${patientName}</b>,</p>

      <p>Your doctor has added a prescription for your appointment.</p>

      <div style="background:#f1f5f9;padding:15px;border-radius:8px;margin:15px 0;">
        <p style="white-space:pre-line;">${prescription}</p>
      </div>

      <p style="color:#555;">Please follow the instructions carefully.</p>

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
    subject: "Your Prescription Details 🩺",
    html,
  });
};

module.exports = sendPrescriptionMail;