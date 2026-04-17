import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
// import { QRCodeCanvas } from "qrcode.react";
// import { useReactToPrint } from "react-to-print";
import TokenReceipt from "./TokenReceipt";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

export default function BookToken() {
const [form, setForm] = useState({
  patient_name: "",
  mobile: "",
  department: "",
  doctor: "",
  date: "",
  time_slot: "",
  appointment_id: ""
  
});

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const receiptRef = useRef();

  // 🟢 Fetch Departments
  useEffect(() => {
    API.get("/api/departments").then(res => {
      setDepartments(res.data);
    });
  }, []);
useEffect(() => {
  if (form.doctor && form.date) {
    API.get(`/api/appointments/${form.doctor}/${form.date}`)
      .then(res => setSlots(res.data));
  }
}, [form.doctor, form.date]);
  // 🟢 Fetch Doctors when department changes
  const handleDepartment = async (deptId) => {
    setForm({ ...form, department: deptId, doctor: "", time_slot: "" });

    const res = await API.get(`/api/doctors/${deptId}`);
    setDoctors(res.data);
    setSlots([]);
  };

  // 🟢 Fetch Slots when doctor changes
 const handleDoctor = async (doctorId) => {
  const updatedForm = {
    ...form,
    doctor: doctorId,
    date: "",       
    time_slot: "",
    appointment_id: ""
  };

  setForm(updatedForm);

  if (updatedForm.date) {
    const res = await API.get(`/api/appointments/${doctorId}/${updatedForm.date}`);
    setSlots(res.data);
  }
};

  const handleBook = async () => {
    try {
      setLoading(true);

      const res = await API.post("/api/tokens/create", form);

      setToken(res.data);

    } catch (err) {
      alert("Booking failed ❌");
    } finally {
      setLoading(false);
    }
  };

//   const handlePrint = useReactToPrint({
//     content: () => receiptRef.current,
//   });
const handlePrint = () => {
  const printContent = receiptRef.current.innerHTML;

  const win = window.open("", "", "width=400,height=600");
  win.document.write(`
    <html>
      <head><title>Print</title></head>
      <body>${printContent}</body>
    </html>
  `);

  win.document.close();
  win.print();
};
  return (
    <Layout>

      <h1 className="text-2xl font-bold mb-6">Book Token</h1>

      {/* FORM */}
      <div className="bg-white p-6 rounded-xl shadow max-w-xl">

        <input
          className="input mb-3"
          placeholder="Patient Name"
          onChange={(e)=>setForm({...form,patient_name:e.target.value})}
        />

        <input
          className="input mb-3"
          placeholder="Mobile"
          onChange={(e)=>setForm({...form,mobile:e.target.value})}
        />

        {/* Department */}
        <select
          className="input mb-3"
          onChange={(e)=>handleDepartment(e.target.value)}
        >
          <option>Select Department</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Doctor */}
        <select
          className="input mb-3"
          onChange={(e)=>handleDoctor(e.target.value)}
        >
          <option>Select Doctor</option>
          {doctors.map(doc => (
            <option key={doc.id} value={doc.id}>{doc.name}</option>
          ))}
        </select>
<input
  type="date"
  className="input mb-3"
  onChange={async (e) => {
    const newDate = e.target.value;

    const updatedForm = { ...form, date: newDate };
    setForm(updatedForm);

    if (updatedForm.doctor) {
      const res = await API.get(`/api/appointments/${updatedForm.doctor}/${newDate}`);
      setSlots(res.data);
    }
  }}
/>
        {/* Slots */}
<select
  className="input mb-4"
  onChange={(e)=> {
    const selected = slots.find(s => s.id == e.target.value);

    setForm({
      ...form,
      appointment_id: selected.id,
      time_slot: `${selected.start_time}-${selected.end_time}`
    });
  }}
>
  <option>Select Time Slot</option>

  {slots.map(s => (
    <option
      key={s.id}
      value={s.id}
      disabled={s.status === "BOOKED"}
    >
      {s.start_time} - {s.end_time} {s.status === "BOOKED" ? "(Booked)" : ""}
    </option>
  ))}
</select>

        <button
          onClick={handleBook}
          className="btn-primary w-full"
        >
          {loading ? "Booking..." : "Book Token"}
        </button>

      </div>

      {/* RESULT */}
      {token && (
        <div className="mt-6 bg-green-100 p-6 rounded-xl shadow max-w-xl">

          <h2 className="text-xl font-bold mb-3">
            Token Generated ✅
          </h2>

<div className="mt-6 bg-white border border-green-200 p-6 rounded-2xl shadow max-w-xl mx-auto">

  <h2 className="text-lg font-semibold text-green-600 mb-3">
    Token Generated ✅
  </h2>

  <div className="grid grid-cols-2 gap-2 text-sm">
    <p><b>Token:</b> {token.token_number}</p>
    <p><b>Name:</b> {token.patient_name}</p>
    <p><b>Dept:</b> {token.dept_name}</p>
    <p><b>Doctor:</b> {token.doc_name}</p>
    <p><b>Time:</b> {token.time_slot}</p>
  </div>

</div>
          {/* <QRCodeCanvas value={JSON.stringify(token)} /> */}

          <TokenReceipt ref={receiptRef} token={token} />

          <button
            onClick={handlePrint}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Print Receipt 🖨️
          </button>

        </div>
      )}

    </Layout>
  );
}