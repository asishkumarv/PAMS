import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import QRCode from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import TokenReceipt from "../components/TokenReceipt";

export default function BookToken() {
  const [form, setForm] = useState({
    patient_name: "",
    mobile: "",
    department: "",
    doctor: "",
    time_slot: "",
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

  // 🟢 Fetch Doctors when department changes
  const handleDepartment = async (deptId) => {
    setForm({ ...form, department: deptId, doctor: "", time_slot: "" });

    const res = await API.get(`/api/doctors/${deptId}`);
    setDoctors(res.data);
    setSlots([]);
  };

  // 🟢 Fetch Slots when doctor changes
  const handleDoctor = async (doctorId) => {
    setForm({ ...form, doctor: doctorId, time_slot: "" });

    const res = await API.get(`/api/appointments/${doctorId}`);
    setSlots(res.data);
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

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

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

        {/* Slots */}
        <select
          className="input mb-4"
          onChange={(e)=>setForm({...form,time_slot:e.target.value})}
        >
          <option>Select Time Slot</option>
          {slots.map(s => (
            <option key={s.id} value={`${s.start_time}-${s.end_time}`}>
              {s.start_time} - {s.end_time}
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

          <p><b>Token No:</b> {token.token_number}</p>
          <p><b>Name:</b> {token.patient_name}</p>
          <p><b>Time Slot:</b> {token.time_slot}</p>

          <QRCode value={JSON.stringify(token)} />

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