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

    {/* ✅ TOKEN DISPLAY (TOP) */}
    {token && (
      <div className="mb-6 bg-white border border-green-200 p-6 rounded-2xl shadow max-w-xl mx-auto animate-fade-in">

        <h2 className="text-lg font-semibold text-green-600 mb-3 text-center">
          Token Generated ✅
        </h2>

        <div className="grid grid-cols-2 gap-2 text-sm">

          <p><b>Token:</b> {token.token_number}</p>
          <p><b>Name:</b> {token.patient_name}</p>

          <p><b>Dept:</b> {token.dept_name}</p>
          <p><b>Doctor:</b> {token.doc_name}</p>

          <p className="col-span-2">
            <b>Date:</b> {token.date}
            <b>Time:</b> {token.time_slot}
          </p>

        </div>

        <button
          onClick={handlePrint}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Print Receipt 🖨️
        </button>
<button
  onClick={() => {
    setToken(null);
    setForm({
      patient_name: "",
      mobile: "",
      email: "",
      department: "",
      doctor: "",
      date: "",
      time_slot: "",
      appointment_id: ""
    });
    setDoctors([]);
    setSlots([]);
  }}
  className="mt-3 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
>
  Book Another Token ➕
</button>
      </div>
    )}

    {/* FORM */}
    {!token && (
    <div className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto">
<h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
  Book Token
</h1>
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
      <input
        className="input mb-3"
        placeholder="Email"
        onChange={(e)=>setForm({...form,email:e.target.value})}
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

      {/* Date */}
     {/* Date */}
<input
  type="date"
  className="input mb-3"
  onChange={(e) =>
    setForm({ ...form, date: e.target.value })
  }
/>

{/* Fetch Button */}
<button
  onClick={async () => {
    if (!form.doctor || !form.date) {
      alert("Select doctor and date first");
      return;
    }

    const res = await API.get(
      `/api/appointments/${form.doctor}/${form.date}`
    );
    setSlots(res.data);
  }}
  className="w-full mb-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
>
  Fetch Slots 🔍
</button>

      {/* Slots */}
 {/* Slots as Boxes */}
<div className="grid grid-cols-3 gap-3 mb-4">
  {slots.length === 0 && (
    <p className="col-span-3 text-center text-gray-500">
      No slots available
    </p>
  )}

  {slots.map((s) => {
    const isBooked = s.status === "BOOKED";

    return (
      <button
        key={s.id}
        disabled={isBooked}
        onClick={() =>
          setForm({
            ...form,
            appointment_id: s.id,
            time_slot: `${s.start_time}-${s.end_time}`,
          })
        }
        className={`p-3 rounded-lg text-sm font-medium border transition
          ${
            isBooked
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : form.appointment_id === s.id
              ? "bg-blue-600 text-white"
              : "bg-white hover:bg-blue-100"
          }
        `}
      >
        {s.start_time} - {s.end_time}
        {isBooked && <div className="text-xs">(Booked)</div>}
      </button>
    );
  })}
</div>

      <button
        onClick={handleBook}
        className="w-full py-3 rounded-xl font-semibold text-white 
                   bg-gradient-to-r from-blue-500 to-indigo-600 
                   hover:from-blue-600 hover:to-indigo-700 
                   active:scale-95 transition-all duration-200 shadow-md"
      >
        {loading ? "Booking..." : "Book Token 🚀"}
      </button>

    </div>
    )}
    {/* Hidden Receipt */}
 {token && (
  <div className="hidden">
    <TokenReceipt ref={receiptRef} token={token} />
  </div>
)}

  </Layout>
);
}