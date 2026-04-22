require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const app = express();
const jwt = require("jsonwebtoken");
const transporter = require("./mailer");
const QRCode = require("qrcode");
const cron = require("node-cron");
const twilio = require("twilio");

const gTTS = require("gtts");
const fs = require("fs");
const path = require("path");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
app.use(cors());
app.use(express.json());

function generateHindiAudio(text, filename) {
  return new Promise((resolve, reject) => {

    const dir = path.join(__dirname, "public/audio");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, filename);

    const gtts = new gTTS(text, "hi");

    gtts.save(filePath, (err) => {
      if (err) {
        console.log("TTS ERROR ❌", err);
        return reject(err);
      }

      console.log("Audio generated at:", filePath);
      resolve(`/audio/${filename}`);
    });
  });
}
app.use("/audio", express.static("public/audio"));

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

app.post("/api/doctor/register", async (req, res) => {
  const { name, email, password, department_id } = req.body;

  const hash = await bcrypt.hash(password, 10);

  await db.query(
    "INSERT INTO doctors(name,email,password,department_id) VALUES($1,$2,$3,$4)",
    [name, email, hash, department_id]
  );

  res.json({ msg: "Doctor created ✅" });
});

app.post("/api/doctor/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await db.query(
    "SELECT * FROM doctors WHERE email=$1",
    [email]
  );

  const doctor = result.rows[0];

  if (!doctor || !(await bcrypt.compare(password, doctor.password)))
    return res.status(401).json({ msg: "Invalid ❌" });

  res.json(doctor);
});

app.get("/api/doctor/tokens/:id", async (req, res) => {
  const { id } = req.params;

  const result = await db.query(`
    SELECT 
      t.id,
      t.token_number,
      t.time_slot,
      t.date,
      t.prescription,
      p.name AS patient_name
    FROM tokens t
    JOIN patients p ON t.patient_id = p.id
    WHERE t.doctor_id = $1
    ORDER BY t.date, t.time_slot
  `, [id]);

  res.json(result.rows);
});

app.put("/api/tokens/prescription", async (req, res) => {
  const { tokenId, prescription } = req.body;

  await db.query(
    "UPDATE tokens SET prescription=$1 WHERE id=$2",
    [prescription, tokenId]
  );

  res.json({ msg: "Saved ✅" });
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
async function sendSMS(to, message) {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_NUMBER,
      to: `+91${to}`,
    });

    console.log("SMS SENT ✅");
  } catch (err) {
    console.log("SMS ERROR ❌", err.message);
  }
}
async function sendEmail(to, subject, message) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `
        <div style="font-family:Arial;padding:20px">
          <h2>📢 Notification</h2>
          <p>${message}</p>
        </div>
      `,
    });

    console.log("EMAIL SENT ✅");
  } catch (err) {
    console.log("EMAIL ERROR ❌", err.message);
  }
}
app.post("/api/bulk-sms", async (req, res) => {
  const { message } = req.body;

  const users = await db.query(
    "SELECT mobile, email, name FROM patients"
  );

  await Promise.all(
    users.rows.map(async (user) => {
      // 📲 SMS
      if (user.mobile) {
        await sendSMS(user.mobile, message);
      }

      // 📧 EMAIL
      if (user.email) {
        await sendEmail(
          user.email,
          "PAMS Notification",
          `Hello ${user.name || ""},<br/><br/>${message}`
        );
      }
    })
  );

  res.json({ msg: "Bulk SMS + Email sent ✅" });
});

app.post("/api/tokens/create", async (req, res) => {
  try {
    const { patient_name, mobile,email, department, doctor, date,time_slot, appointment_id } = req.body;

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
      "SELECT COUNT(*) FROM tokens WHERE date=$1 AND doctor=$2",
      [date, doctor]
    );

    const token_number = parseInt(count.rows[0].count) + 1;

    // 🧾 Insert token
    const result = await db.query(
      `INSERT INTO tokens 
      (patient_name, mobile, department, doctor, date,time_slot, token_number,doc_name, dept_name, email)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [patient_name, mobile, department, doctor, date, time_slot, token_number, doctor_name, department_name, email]
    );
const token = result.rows[0];
 const qrData = JSON.stringify({
  token_id: token.id,
  token_number: token.token_number,
  patient_id: token.patient_id
});

const qrImage = await QRCode.toDataURL(qrData);
    // 🔥 Update slot status
    await db.query(
      "UPDATE appointments SET status='BOOKED' WHERE id=$1",
      [appointment_id]
    );
if (email) {
  await transporter.sendMail({
    from: "yourgmail@gmail.com",
    to: email,
    subject: "Appointment Confirmation ✅",

    attachments: [
      {
        filename: "qr.png",
        path: qrImage,
        cid: "qrimage@pams"
      }
    ],

    html: `
      <div style="background:#f4f6f8;padding:20px;font-family:Arial,sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" 
          style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

          <!-- HEADER (BLUE) -->
          <tr>
            <td style="background:linear-gradient(90deg,#2563eb,#4f46e5);color:white;padding:20px;text-align:center;">
              <h2 style="margin:0;">🏥 Appointment Confirmed</h2>
              <p style="margin:5px 0 0;font-size:14px;">
                Your booking is successful
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:20px;color:#333;">

              <p>Dear <b>${token.patient_name}</b>,</p>

              <p style="margin-bottom:15px;">
                Your appointment has been successfully booked.
              </p>

              <table width="100%" cellpadding="8" style="font-size:14px;">
                
                <tr>
                  <td style="font-weight:bold;">Token</td>
                  <td style="color:#2563eb;font-weight:bold;">
                    #${token.token_number}
                  </td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Department</td>
                  <td>${token.dept_name}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Doctor</td>
                  <td>${token.doc_name}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Date</td>
                  <td>${new Date(token.date).toDateString()}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Time</td>
                  <td>${token.time_slot}</td>
                </tr>

              </table>

              <!-- QR -->
              <div style="text-align:center;margin-top:20px;">
                <img src="cid:qrimage@pams" width="150" />
                <p style="font-size:12px;color:#666;margin-top:5px;">
                  Scan this QR at hospital
                </p>
              </div>

              <!-- NOTE -->
              <div style="margin-top:15px;padding:12px;background:#eff6ff;border-radius:6px;">
                Please arrive 10 minutes before your scheduled time.
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="text-align:center;padding:15px;font-size:12px;color:#888;">
              Thank you for choosing our service 🙏
            </td>
          </tr>

        </table>
      </div>
    `
  });
}
await sendSMS(token.mobile, `
Hello ${token.patient_name},
Your appointment is confirmed.
Doctor: ${token.doc_name}
Department: ${token.dept_name}
Date: ${token.date}
Time: ${token.time_slot}
Token: ${token.token_number}
`);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
const hindiNumbersFull = {
  1:"एक",2:"दो",3:"तीन",4:"चार",5:"पांच",6:"छह",7:"सात",8:"आठ",9:"नौ",10:"दस",
  11:"ग्यारह",12:"बारह",13:"तेरह",14:"चौदह",15:"पंद्रह",16:"सोलह",17:"सत्रह",18:"अठारह",19:"उन्नीस",20:"बीस",
  21:"इक्कीस",22:"बाईस",23:"तेइस",24:"चौबीस",25:"पच्चीस",26:"छब्बीस",27:"सत्ताईस",28:"अट्ठाईस",29:"उनतीस",30:"तीस",
  31:"इकतीस",32:"बत्तीस",33:"तैंतीस",34:"चौंतीस",35:"पैंतीस",36:"छत्तीस",37:"सैंतीस",38:"अड़तीस",39:"उनतालीस",40:"चालीस",
  41:"इकतालीस",42:"बयालीस",43:"तैंतालीस",44:"चवालीस",45:"पैंतालीस",46:"छियालीस",47:"सैंतालीस",48:"अड़तालीस",49:"उनचास",50:"पचास",
  51:"इक्यावन",52:"बावन",53:"तिरपन",54:"चौवन",55:"पचपन",56:"छप्पन",57:"सत्तावन",58:"अट्ठावन",59:"उनसठ",60:"साठ"
};

function numberToHindi(num) {
  return hindiNumbersFull[parseInt(num)] || num;
}

function numberToHindi(num) {
  return hindiNumbersFull[num] || num;
}

const monthsHindi = [
  "जनवरी","फरवरी","मार्च","अप्रैल","मई","जून",
  "जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"
];

function formatDateHindi(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${monthsHindi[d.getMonth()]} ${d.getFullYear()}`;
}
function formatTimeHindi(timeRange) {
  const start = timeRange.split("-")[0]; // "12:30:00"

  let [hour, minute] = start.split(":").map(Number);

  let period = hour >= 12 ? "दोपहर" : "सुबह";

  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  const hourHindi = numberToHindi(hour);
  const minuteHindi = minute === 0 ? "" : numberToHindi(minute);

  if (minute === 0) {
    return `${period} ${hourHindi} बजे`;
  }

  return `${period} ${hourHindi} बजकर ${minuteHindi} मिनट`;
}
async function makeCall(to, messageType, data) {
  try {
    const url = `https://pams-phuv.onrender.com/voice?type=${encodeURIComponent(messageType)}&token=${encodeURIComponent(data.token)}&date=${encodeURIComponent(data.date)}&time=${encodeURIComponent(data.time)}&name=${encodeURIComponent(data.name)}`;

    await client.calls.create({
      url: url,
      to: `+91${to}`,
      from: process.env.TWILIO_NUMBER,
    });

    console.log("CALL INITIATED ✅");
  } catch (err) {
    console.log("CALL ERROR ❌", err.message);
  }
}

app.post("/voice", async (req, res) => {
  const name = decodeURIComponent(req.query.name || "");
  const token = req.query.token;
  const date = decodeURIComponent(req.query.date || "");
  const time = decodeURIComponent(req.query.time || "");
  const type = req.query.type;

  const tokenHindi = numberToHindi(token);
  const dateHindi = formatDateHindi(date);
  const timeHindi = formatTimeHindi(time);
  let messageEN = "";
  let hindiMessage = "";

  // BOOKING
  if (type === "booking") {
    messageEN = `
Hello ${name}.
Your appointment is confirmed.
On date ${date}.
Time ${time}.
Token number ${token}.
    `;

    hindiMessage = `
नमस्ते ${name}.
आपकी अपॉइंटमेंट कन्फर्म हो गई है।
तारीख ${dateHindi}.
समय ${timeHindi}.
टोकन नंबर ${tokenHindi}.
    `;
  }

  // POSTPONE
  if (type === "postpone") {
    messageEN = `
Hello ${name}.
Your appointment has been rescheduled.
To date ${date}.
New time is ${time}.
Token number ${token}.
    `;

    hindiMessage = `
नमस्ते ${name}.
आपकी अपॉइंटमेंट बदल दी गई है।
नई तारीख ${dateHindi}.
समय ${timeHindi}.
टोकन नंबर ${tokenHindi}.
    `;
  }

  // 🔥 GENERATE AUDIO HERE
  const audioFile = await generateHindiAudio(
    hindiMessage,
    `call_${token}.mp3`
  );

  // 🔥 SEND RESPONSE
  res.type("text/xml");
  res.send(`
<Response>

  <!-- English -->
  <Say voice="alice">
    ${messageEN}
  </Say>

  <Pause length="1"/>

  <!-- Hindi Audio -->
  <Play>
    https://pams-phuv.onrender.com${audioFile}
  </Play>

</Response>
  `);
});

app.post("/api/tokens/pcreate", async (req, res) => {
  try {
    const { patient_name, mobile, department, doctor, date,time_slot, appointment_id,patient_id ,email} = req.body;

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
      "SELECT COUNT(*) FROM tokens WHERE date=$1 AND doctor=$2",
      [date, doctor]
    );

    const token_number = parseInt(count.rows[0].count) + 1;

    // 🧾 Insert token
    const result = await db.query(
      `INSERT INTO tokens 
      (patient_name, mobile, department, doctor, date,time_slot, token_number,doc_name, dept_name,patient_id, email)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [patient_name, mobile, department, doctor, date, time_slot, token_number, doctor_name, department_name, patient_id, email]
    );
const token = result.rows[0];


// 🔥 Generate QR inside async route
const qrData = JSON.stringify({
  token_id: token.id,
  token_number: token.token_number,
  patient_id: token.patient_id
});

const qrImage = await QRCode.toDataURL(qrData);
    // 🔥 Update slot status
    await db.query(
      "UPDATE appointments SET status='BOOKED' WHERE id=$1",
      [appointment_id]
    );
if (email) {
  await transporter.sendMail({
    from: "yourgmail@gmail.com",
    to: email,
    subject: "Appointment Confirmation ✅",

    attachments: [
      {
        filename: "qr.png",
        path: qrImage,
        cid: "qrimage@pams"
      }
    ],

    html: `
      <div style="background:#f4f6f8;padding:20px;font-family:Arial,sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" 
          style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

          <!-- HEADER (BLUE) -->
          <tr>
            <td style="background:linear-gradient(90deg,#2563eb,#4f46e5);color:white;padding:20px;text-align:center;">
              <h2 style="margin:0;">🏥 Appointment Confirmed</h2>
              <p style="margin:5px 0 0;font-size:14px;">
                Your booking is successful
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:20px;color:#333;">

              <p>Dear <b>${token.patient_name}</b>,</p>

              <p style="margin-bottom:15px;">
                Your appointment has been successfully booked.
              </p>

              <table width="100%" cellpadding="8" style="font-size:14px;">
                
                <tr>
                  <td style="font-weight:bold;">Token</td>
                  <td style="color:#2563eb;font-weight:bold;">
                    #${token.token_number}
                  </td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Department</td>
                  <td>${token.dept_name}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Doctor</td>
                  <td>${token.doc_name}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Date</td>
                  <td>${new Date(token.date).toDateString()}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Time</td>
                  <td>${token.time_slot}</td>
                </tr>

              </table>

              <!-- QR -->
              <div style="text-align:center;margin-top:20px;">
                <img src="cid:qrimage@pams" width="150" />
                <p style="font-size:12px;color:#666;margin-top:5px;">
                  Scan this QR at hospital
                </p>
              </div>

              <!-- NOTE -->
              <div style="margin-top:15px;padding:12px;background:#eff6ff;border-radius:6px;">
                Please arrive 10 minutes before your scheduled time.
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="text-align:center;padding:15px;font-size:12px;color:#888;">
              Thank you for choosing our service 🙏
            </td>
          </tr>

        </table>
      </div>
    `
  });
}

await makeCall(token.mobile, "booking", {
  token: token.token_number,
  date: new Date(token.date).toDateString(),
  time: token.time_slot,
  name: token.patient_name,
});
await sendSMS(token.mobile, `
Hello ${token.patient_name},
Your appointment is confirmed.
Doctor: ${token.doc_name}
Department: ${token.dept_name}
Date: ${token.date}
Time: ${token.time_slot}
Token: ${token.token_number}
`);
    // res.json(token);
    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/tokens/patient/:id", async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT *
     FROM tokens
     WHERE patient_id = $1
     ORDER BY date DESC`,
    [id]
  );

  res.json(result.rows);
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

app.get("/api/slots/next/:tokenId", async (req, res) => {
  const { tokenId } = req.params;

  const tokenRes = await db.query(
    "SELECT doctor, date, time_slot FROM tokens WHERE id=$1",
    [tokenId]
  );

  const token = tokenRes.rows[0];

  const result = await db.query(
    `SELECT * FROM appointments
     WHERE doctor_id=$1
     AND status='available'
     AND date > $2
     ORDER BY date, start_time
     LIMIT 20`,
    [token.doctor, token.date]
  );

  res.json(result.rows);
});

app.put("/api/tokens/postpone", async (req, res) => {
  try {
    const { tokenId, appointmentId, date, time_slot } = req.body;

    // 🔥 update token
    await db.query(
      `UPDATE tokens SET date=$1, time_slot=$2 WHERE id=$3`,
      [date, time_slot, tokenId]
    );

    // 🔥 update appointment
    await db.query(
      "UPDATE appointments SET status='BOOKED' WHERE id=$1",
      [appointmentId]
    );

    // 🔥 get token directly (NO JOIN)
    const result = await db.query(
      `SELECT * FROM tokens WHERE id=$1`,
      [tokenId]
    );

    const token = result.rows[0];

    if (!token) {
      return res.status(404).json({ msg: "Token not found ❌" });
    }

    console.log("EMAIL:", token.email); // debug

    // 🔥 QR
    const qrData = JSON.stringify({
      token_id: token.id,
      token_number: token.token_number,
      patient_id: token.patient_id
    });

    const qrImage = await QRCode.toDataURL(qrData);

    // 🔥 EMAIL
    if (token.email) {
      try {
        await transporter.sendMail({
          from: "yourgmail@gmail.com",
          to: token.email,
          subject: "Appointment Rescheduled 🔄",
            attachments: [
    {
      filename: "qr.png",
      path: qrImage,        // base64 works here
      cid: "qrimage@pams"   // unique id
    }
  ],
          html: `
            <div style="padding:20px;font-family:Arial">
              <h2>🔄 Appointment Rescheduled</h2>

              <p>Dear ${token.patient_name},</p>
              <p>Your appointment has been updated:</p>
              <p><b>Token:</b> #${token.token_number}</p>
              <p><b>Department:</b> ${token.dept_name}</p>
              <p><b>Doctor:</b> ${token.doc_name}</p>
              <p><b>Date:</b> ${new Date(token.date).toDateString()}</p>
              <p><b>Time:</b> ${token.time_slot}</p>

            <div style="text-align:center;margin-top:20px;">
              <img src="cid:qrimage@pams" width="150" />
            </div>
              <p style="margin-top:10px;">
                Please arrive 10 minutes early.
              </p>
            </div>
          `
        });

        console.log("MAIL SENT ✅");

      } catch (err) {
        console.log("MAIL ERROR:", err.message);
      }
    } else {
      console.log("No email found ❌");
    }


await makeCall(token.mobile, "postpone", {
  token: token.token_number,
  date: new Date(token.date).toDateString(),
  time: token.time_slot,
  name: token.patient_name,
});

await sendSMS(token.mobile, `
Hello ${token.patient_name},
Your appointment is rescheduled.
Doctor: ${token.doc_name}
Department: ${token.dept_name}
New Date: ${token.date}
Time: ${token.time_slot}
Token: ${token.token_number}
`);

    res.json({ msg: "Token postponed & mail handled ✅" });

  } catch (err) {
    console.log("POSTPONE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

cron.schedule("*/5 * * * *", async () => {
  console.log("⏰ Checking appointments...");

  try {
    const result = await db.query(`
      SELECT * FROM tokens WHERE status='WAITING' AND reminder_sent='FALSE'
    `);

    const now = new Date();

// convert to IST manually
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const nowIST = new Date(now.getTime() + IST_OFFSET);

    for (let token of result.rows) {

      // 🔥 extract start time
      const startTime = token.time_slot.split("-")[0]; // 17:20:00

      // 🔥 split date & time manually (IMPORTANT)
      
      const [hour, minute, second] = startTime.split(":");
const year = token.date.getFullYear();
const month = token.date.getMonth();
const day = token.date.getDate();
      // ✅ LOCAL TIME (NO timezone issue)
 const appointmentTime = new Date(
  year,
  month,
  day,
  hour,
  minute,
  second
);
      const diff = appointmentTime - nowIST;

      const diffHours = diff / (1000 * 60 * 60);

      // console.log("NOW:", nowIST);
      // console.log("APPT:", appointmentTime);
      // console.log("DIFF HOURS:", diffHours);
      // console.log("----------------");

      const FOUR_HOURS = 4 * 60 * 60 * 1000;

      // ✅ YOUR CONDITION (LESS THAN 4 HOURS)
      if (diff > 0 && diff <= FOUR_HOURS && !token.reminder_sent) {

        console.log("🔥 Sending reminder to:", token.email);

        // 🔥 SEND EMAIL
const qrData = JSON.stringify({
  token_id: token.id,
  token_number: token.token_number,
  patient_id: token.patient_id
});

const qrImage = await QRCode.toDataURL(qrData);

await transporter.sendMail({
  from: "yourgmail@gmail.com",
  to: token.email,
  subject: "⏰ Appointment Reminder",

  attachments: [
    {
      filename: "qr.png",
      path: qrImage,
      cid: "qrimage@pams"
    }
  ],

  html: `
    <div style="background:#f4f6f8;padding:20px;font-family:Arial,sans-serif;">
      
      <table width="100%" cellpadding="0" cellspacing="0" 
        style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(90deg,#f59e0b,#f97316);color:white;padding:20px;text-align:center;">
            <h2 style="margin:0;">⏰ Appointment Reminder</h2>
            <p style="margin:5px 0 0;font-size:14px;">
              Your appointment is coming soon
            </p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:20px;color:#333;">

            <p>Dear <b>${token.patient_name}</b>,</p>

            <p style="margin-bottom:15px;">
              This is a reminder for your upcoming appointment.
            </p>

            <table width="100%" cellpadding="8" style="font-size:14px;">
              <tr>
                <td style="font-weight:bold;">Token</td>
                <td>#${token.token_number}</td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Department</td>
                <td>${token.dept_name}</td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Doctor</td>
                <td>${token.doc_name}</td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Date</td>
                <td>${new Date(token.date).toDateString()}</td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Time</td>
                <td>${token.time_slot}</td>
              </tr>
            </table>

            <!-- QR -->
            <div style="text-align:center;margin-top:20px;">
              <img src="cid:qrimage@pams" width="150" />
              <p style="font-size:12px;color:#666;margin-top:5px;">
                Scan this QR at hospital
              </p>
            </div>

            <!-- NOTE -->
            <div style="margin-top:15px;padding:12px;background:#fff7ed;border-radius:6px;">
              Please arrive 10 minutes before your scheduled time.
            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="text-align:center;padding:15px;font-size:12px;color:#888;">
            Thank you for choosing our service 🙏
          </td>
        </tr>

      </table>
    </div>
  `
});

        // mark sent
        await db.query(
          "UPDATE tokens SET reminder_sent=true WHERE id=$1",
          [token.id]
        );
      }
    }

  } catch (err) {
    console.log("CRON ERROR:", err.message);
  }
});

app.get("/", (req, res) => {
  res.send("API Running ✅");
});
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});