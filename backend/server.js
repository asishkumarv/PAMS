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
    const { name, email, password, secretKey } = req.body;

    // ✅ Secret Key Check
    if (secretKey !== "PAMS1234") {
      return res.status(403).json({ msg: "Invalid Secret Key ❌" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store temp (you can later move to DB)
    await db.query(
      `INSERT INTO staff (name, email, password, otp, is_verified)
       VALUES ($1,$2,$3,$4,false) RETURNING *`,
      [name, email, hashed, otp]
    );

    // ✅ Send Email
    await transporter.sendMail({
      to: email,
      subject: "Staff Registration OTP",
      html: `<h2>Your OTP: ${otp}</h2>`,
    });

    res.json({ msg: "OTP sent to email ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/staff/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const result = await db.query(
    "SELECT * FROM staff WHERE email=$1",
    [email]
  );

  const user = result.rows[0];

  // ✅ FIXED HERE
  if (!user || String(user.otp) !== String(otp)) {
    return res.status(400).json({ msg: "Invalid OTP ❌" });
  }

  await db.query(
    "UPDATE staff SET is_verified=true, otp=NULL WHERE email=$1",
    [email]
  );

  res.json({ msg: "Staff registered successfully ✅" });
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
    const { identifier, password } = req.body;

    const isEmail = identifier.includes("@");

    const query = isEmail
      ? "SELECT * FROM patients WHERE email=$1"
      : "SELECT * FROM patients WHERE mobile=$1";

    const result = await db.query(query, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "User not found ❌" });
    }

    const user = result.rows[0];

    // check password
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ msg: "Invalid password ❌" });
    }

    if (!user.is_verified) {
      return res.status(403).json({ msg: "Verify OTP first" });
    }

    res.json({ msg: "Login success", user });

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
app.get("/api/staff/dashboard", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const total = await db.query(
      "SELECT COUNT(*) FROM tokens WHERE date=$1",
      [today]
    );

    const waiting = await db.query(
      "SELECT COUNT(*) FROM tokens WHERE status='WAITING' AND date=$1",
      [today]
    );

    const completed = await db.query(
      "SELECT COUNT(*) FROM tokens WHERE status='ARRIVED' AND date=$1",
      [today]
    );

    res.json({
      total: total.rows[0].count,
      waiting: waiting.rows[0].count,
      completed: completed.rows[0].count,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/tokens/today", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM tokens WHERE date=CURRENT_DATE ORDER BY token_number ASC"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/tokens/update", async (req, res) => {
  const { id, status } = req.body;

  await db.query(
    "UPDATE tokens SET status=$1 WHERE id=$2",
    [status, id]
  );

  res.json({ msg: "Updated ✅" });
});

app.post("/api/tokens/create", async (req, res) => {
  try {
    const { patient_name, mobile, department, doctor, date,time_slot, appointment_id } = req.body;

        // 🔥 get doctor + department names
    const docRes = await db.query(
      "SELECT name, department_id FROM doctors WHERE id=$1",
      [doctor]
    );

    const doctor_name = docRes.rows[0].name;
    const department_id = docRes.rows[0].department_id;

    const deptRes = await db.query(
      "SELECT name FROM departments WHERE id=$1",
      [department]
    );

    const department_name = deptRes.rows[0].name;

    // 🔴 Check if slot already booked
    const slot = await db.query(
      "SELECT * FROM appointments WHERE id=$1",
      [appointment_id]
    );

    if (slot.rows[0].status === "BOOKED") {
      return res.status(400).json({ msg: "Slot already booked ❌" });
    }

    // 🔢 token number
    const count = await db.query(
      "SELECT COUNT(*) FROM tokens WHERE date=$1",
      [date]
    );

    const token_number = parseInt(count.rows[0].count) + 1;

    // 🧾 Insert token
    const result = await db.query(
      `INSERT INTO tokens 
      (patient_name, mobile, department, doctor, date,time_slot, token_number,doc_name, dept_name)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_name, mobile, department, doctor, date, time_slot, token_number, doctor_name, department_name]
    );

    // 🔥 Update slot status
    await db.query(
      "UPDATE appointments SET status='BOOKED' WHERE id=$1",
      [appointment_id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/departments", async (req, res) => {
  const result = await db.query("SELECT * FROM departments");
  res.json(result.rows);
});
app.get("/api/doctors/:deptId", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM doctors WHERE department_id=$1",
    [req.params.deptId]
  );
  res.json(result.rows);
});


app.get("/api/appointments/:doctorId/:date", async (req, res) => {
  const { doctorId, date } = req.params;

  const result = await db.query(
    `SELECT * FROM appointments 
     WHERE doctor_id=$1 AND date=$2 AND status='available'
     ORDER BY start_time` ,
    [doctorId, date]
  );

  res.json(result.rows);
});


app.post("/api/appointments/create", async (req, res) => {
  try {
    const { doctor_id, date, start_time, end_time, slot_count } = req.body;

    if (!doctor_id || !date || !start_time || !end_time || !slot_count) {
      return res.status(400).json({ msg: "Missing fields ❌" });
    }

    // 🔹 helper functions
    const timeToMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const minutesToTime = (m) => {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return `${h}:${min === 0 ? "00" : min}`;
    };

    const start = timeToMinutes(start_time);
    const end = timeToMinutes(end_time);

    if (end <= start) {
      return res.status(400).json({ msg: "Invalid time range ❌" });
    }

    const total = end - start;
    const slotDuration = Math.floor(total / slot_count);

    let current = start;
    const createdSlots = [];

    for (let i = 0; i < slot_count; i++) {
      let next = current + slotDuration;

      const s_time = minutesToTime(current);
      const e_time = minutesToTime(next);

      // 🔥 prevent duplicates
      const exists = await db.query(
        `SELECT * FROM appointments 
         WHERE doctor_id=$1 AND date=$2 
         AND start_time=$3 AND end_time=$4` ,
        [doctor_id, date, s_time, e_time]
      );

      if (exists.rows.length === 0) {
        
         const result = await db.query(
  `INSERT INTO appointments 
   (doctor_id, date, start_time, end_time, status)
   VALUES ($1,$2,$3,$4,$5)
   RETURNING *`,
  [doctor_id, date, s_time, e_time, "available"]
);
        

        createdSlots.push(result.rows[0]);
      }

      current = next;
    }

    return res.json({
      msg: "Slots created successfully ✅",
      slots: createdSlots,
    });

  } catch (err) {
    console.error("APPOINTMENT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("API Running ✅");
});
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});