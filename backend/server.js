require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const app = express();
const jwt = require("jsonwebtoken");
const transporter = require("./mailer");

app.use(cors());
app.use(express.json());


app.post("/api/staff/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const result = await db.query(
      "INSERT INTO staff (name, email, password) VALUES ($1,$2,$3) RETURNING *",
      [name, email, hashed]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/staff/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      "SELECT * FROM staff WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ msg: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/patient/login", async (req, res) => {
  try {
    const { name, mobile } = req.body;

    let result = await db.query(
      "SELECT * FROM patients WHERE mobile=$1",
      [mobile]
    );

    if (result.rows.length === 0) {
      result = await db.query(
        "INSERT INTO patients (name, mobile) VALUES ($1,$2) RETURNING *",
        [name, mobile]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
  console.error("LOGIN ERROR:", err);
  res.status(500).json({ error: err.message });
}
});

app.post("/api/patient/register", async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const result = await db.query(
      `INSERT INTO patients 
       (name, mobile, email, password, otp, otp_expiry)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, email`,
      [name, mobile, email, hashed, otp, expiry]
    );

    // Send OTP Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Verification Code",
      html: `
        <h2>Hospital Token System</h2>
        <p>Your OTP is:</p>
        <h1 style="color:#2563EB;">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    res.json({ msg: "OTP sent to email ✅" });

  } catch (err) {
    console.error("REGISTER ERROR:", err); // 🔥 VERY IMPORTANT
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/patient/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await db.query(
      "SELECT * FROM patients WHERE email=$1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.is_verified) {
      return res.json({ msg: "Already verified ✅" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP ❌" });
    }

    if (new Date() > user.otp_expiry) {
      return res.status(400).json({ msg: "OTP expired ❌" });
    }

    await db.query(
      "UPDATE patients SET is_verified=true, otp=NULL, otp_expiry=NULL WHERE email=$1",
      [email]
    );

    res.json({ msg: "Account verified successfully ✅" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/patient/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      "UPDATE patients SET otp=$1, otp_expiry=$2 WHERE email=$3",
      [otp, expiry, email]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Resend OTP",
      html: `<h2>Your new OTP: ${otp}</h2>`,
    });

    res.json({ msg: "OTP resent ✅" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patient/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Detect if identifier is email or mobile
    const isEmail = identifier.includes("@");

    const query = isEmail
      ? "SELECT * FROM patients WHERE email = $1"
      : "SELECT * FROM patients WHERE mobile = $1";

    const result = await db.query(query, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "User not found ❌" });
    }

    const user = result.rows[0];

    // 🔐 Check password
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ msg: "Invalid password ❌" });
    }

    // ✅ Check OTP verification
    if (!user.is_verified) {
      return res.status(403).json({
        msg: "Please verify OTP first ⚠️",
      });
    }

    // 🎟️ Generate JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      msg: "Login successful ✅",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("API Running ✅");
});
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});