import { useState, useEffect } from "react";
import API from "../services/api";
import PatientLayout from "../components/PatientLayout";

export default function PatientBookToken() {
  const [form, setForm] = useState({
    department: "",
    doctor: "",
    date: "",
    time_slot: "",
    appointment_id: ""
  });

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  const [user, setUser] = useState(null);
const [token, setToken] = useState(null);
const [loading, setLoading] = useState(false);

  // ✅ get patient from localStorage

// ✅ ADD THIS

  // departments
  useEffect(() => {
    API.get("/api/departments").then(res => setDepartments(res.data));
  }, []);

  // doctors
  const handleDepartment = async (id) => {
    setForm({ ...form, department: id, doctor: "", date: "" });

    const res = await API.get(`/api/doctors/${id}`);
    setDoctors(res.data);
  };

  // slots
  useEffect(() => {
    if (form.doctor && form.date) {
      API.get(`/api/appointments/${form.doctor}/${form.date}`)
        .then(res => setSlots(res.data));
    }
  }, [form.doctor, form.date]);

  // booking
const handleBook = async () => {
  if (!user) {
    alert("User not loaded. Please login again ❌");
    return;
  }

  if (!form.appointment_id) {
    alert("Please select slot ❌");
    return;
  }

  try {
    setLoading(true);

    const res = await API.post("/api/tokens/pcreate", {
      ...form,
      patient_name: user.name,
      mobile: user.mobile,
      patient_id: user.id
    });

    setToken(res.data); // ✅ store token
  } catch (err) {
    alert(err.response?.data?.msg || "Booking failed ❌");
  } finally {
    setLoading(false);
  }
};

  return (
    <PatientLayout>
{token && (
  <button
    onClick={() => setToken(null)}
    className="mb-4 text-sm text-blue-600 underline"
  >
    + Book Another Appointment
  </button>
)}
      <h1 className="text-xl font-bold mb-4">
        Book Appointment
      </h1>

      <div className="bg-white p-6 rounded-xl shadow max-w-xl space-y-3">

        {/* Department */}
        <select
          className="input"
          onChange={(e)=>handleDepartment(e.target.value)}
        >
          <option>Select Department</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Doctor */}
        <select
          className="input"
          onChange={(e)=>setForm({...form, doctor:e.target.value})}
        >
          <option>Select Doctor</option>
          {doctors.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Date */}
        <input
          type="date"
          className="input"
          onChange={(e)=>setForm({...form, date:e.target.value})}
        />

        {/* Slots */}
        <select
          className="input"
          onChange={(e)=>{
            const s = slots.find(x => x.id == e.target.value);

            setForm({
              ...form,
              appointment_id: s.id,
              time_slot: `${s.start_time}-${s.end_time}`
            });
          }}
        >
          <option>Select Slot</option>

          {slots.map(s => (
            <option key={s.id} value={s.id} disabled={s.status==="BOOKED"}>
              {s.start_time} - {s.end_time} {s.status==="BOOKED" && "(Full)"}
            </option>
          ))}
        </select>

<button
  onClick={handleBook}
  disabled={loading}
  className={`w-full py-3 rounded-xl font-medium transition ${
    loading
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
  }`}
>
  {loading ? "Booking..." : "Book Token"}
</button>

      </div>
{token && (
  <div className="mt-6 bg-white border border-green-200 p-6 rounded-2xl shadow max-w-xl">

    <h2 className="text-lg font-semibold text-green-600 mb-4">
      ✅ Booking Confirmed
    </h2>

    <div className="grid grid-cols-2 gap-3 text-sm">

      <p><b>Token No:</b> {token.token_number}</p>
      <p><b>Name:</b> {token.patient_name}</p>

      <p><b>Department:</b> {token.dept_name}</p>
      <p><b>Doctor:</b> {token.doc_name}</p>

      <p><b>Date:</b> {token.date}</p>
      <p><b>Time:</b> {token.time_slot}</p>

      <p className="col-span-2">
        <b>Status:</b>
        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
          {token.status}
        </span>
      </p>

    </div>

  </div>
)}
    </PatientLayout>
  );
}