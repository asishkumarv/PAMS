import { useState, useEffect } from "react";
import API from "../services/api";
import PatientLayout from "../components/PatientLayout";

export default function PatientBookToken() {
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
const [user, setUser] = useState(null);
const [token, setToken] = useState(null);
  // departments
  useEffect(() => {
    API.get("/api/departments").then(res => setDepartments(res.data));
  }, []);

useEffect(() => {
  const stored = JSON.parse(localStorage.getItem("patient"));
  setUser(stored);
}, []);
  // doctors
  const handleDepartment = async (id) => {
    setForm({ ...form, department: id, doctor: "", date: "", time_slot: "" });

    const res = await API.get(`/api/doctors/${id}`);
    setDoctors(res.data);
    setSlots([]);
  };

  // slots
  // useEffect(() => {
  //   if (form.doctor && form.date) {
  //     API.get(`/api/appointments/${form.doctor}/${form.date}`)
  //       .then(res => setSlots(res.data));
  //   }
  // }, [form.doctor, form.date]);

  // booking
const handleBook = async () => {
  if (!form.patient_name || !form.mobile || !form.appointment_id) {
    alert("Please fill all fields ❌");
    return;
  }

  if (!user) {
    alert("User not found. Please login again ❌");
    return;
  }

  try {
    const res = await API.post("/api/tokens/pcreate", {
      ...form,
      patient_id: user.id   // ✅ AUTO ADD
    });

    setToken(res.data);
    alert("Token Booked ✅");

  } catch (err) {
    alert(err.response?.data?.msg || "Booking failed ❌");
  }
};

  return (
    <PatientLayout>

      <h1 className="text-xl font-bold mb-4">
        Book Appointment
      </h1>
{token && (
  <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg max-w-xl mx-auto">

    <h2 className="text-xl font-bold text-center mb-4">
      🎉 Token Confirmed
    </h2>

    <div className="grid grid-cols-2 gap-3 text-sm">

      <p><b>Token:</b> #{token.token_number}</p>
      <p><b>Name:</b> {token.patient_name}</p>

      <p><b>Dept:</b> {token.dept_name}</p>
      <p><b>Doctor:</b> {token.doc_name}</p>

      <p><b>Date:</b> {token.date}</p>
      <p><b>Time:</b> {token.time_slot}</p>

      <p className="col-span-2 text-center mt-2 text-lg font-semibold">
        Status: {token.status}
      </p>

    </div>

    {/* 🔥 BOOK AGAIN BUTTON */}
    <button
      onClick={() => {
        setToken(null);
        setForm({
          patient_name: "",
          mobile: "",
          department: "",
          doctor: "",
          date: "",
          time_slot: "",
          appointment_id: ""
        });
        setDoctors([]);
        setSlots([]);
      }}
      className="mt-5 w-full bg-white text-green-600 py-2 rounded-lg font-semibold hover:bg-gray-100"
    >
      Book Another Token ➕
    </button>

  </div>
)}
{!token && (
      <div className="bg-white p-6 rounded-xl shadow max-w-xl space-y-3">
<h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
  Book Token
</h1>
        {/* 🔥 Name */}
        <input
          className="input"
          placeholder="Patient Name"
          onChange={(e)=>setForm({...form, patient_name:e.target.value})}
        />

        {/* 🔥 Mobile */}
        <input
          className="input"
          placeholder="Mobile Number"
          onChange={(e)=>setForm({...form, mobile:e.target.value})}
        />

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

<button
  onClick={async () => {
    if (!form.doctor || !form.date) {
      alert("Select doctor and date first ❌");
      return;
    }

    const res = await API.get(
      `/api/appointments/${form.doctor}/${form.date}`
    );
    setSlots(res.data);
  }}
  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
>
  Fetch Slots 🔍
</button>

        {/* Slots */}
<div className="grid grid-cols-3 gap-3">
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
            time_slot: `${s.start_time}-${s.end_time}`
          })
        }
        className={`p-3 rounded-lg border text-sm transition ${
          isBooked
            ? "bg-gray-200 text-gray-500"
            : form.appointment_id === s.id
            ? "bg-blue-600 text-white"
            : "bg-white hover:bg-blue-100"
        }`}
      >
        {s.start_time} - {s.end_time}
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
  Book Token 🚀
</button>

      </div>
)}
    </PatientLayout>
  );
}