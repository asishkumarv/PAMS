import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

export default function SetupAppointments() {
  const [form, setForm] = useState({
    department: "",
    doctor: "",
    date: "",
    start_time: "",
    end_time: "",
    slot_count: 6,
  });

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slotsPreview, setSlotsPreview] = useState([]);

  useEffect(() => {
    API.get("/api/departments").then(res => {
      setDepartments(res.data);
    });
  }, []);

  const handleDepartment = async (deptId) => {
    setForm({ ...form, department: deptId, doctor: "" });

    const res = await API.get(`/api/doctors/${deptId}`);
    setDoctors(res.data);
  };

  // 🔹 Time helpers
  const timeToMinutes = (t) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (m) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}:${min === 0 ? "00" : min}`;
  };

  // 🔹 Generate slots
  const generateSlots = () => {
    const start = timeToMinutes(form.start_time);
    const end = timeToMinutes(form.end_time);

    if (!start || !end || end <= start) return;

    const total = end - start;
    const slotDuration = Math.floor(total / form.slot_count);

    let current = start;
    const slots = [];

    for (let i = 0; i < form.slot_count; i++) {
      let next = current + slotDuration;

      slots.push({
        start: minutesToTime(current),
        end: minutesToTime(next),
      });

      current = next;
    }

    setSlotsPreview(slots);
  };

  const handleSave = async () => {
    try {
await API.post("/api/appointments/create", {
  doctor_id: form.doctor,
  date: form.date,
  start_time: form.start_time,
  end_time: form.end_time,
  slot_count: form.slot_count,
});

      alert("Appointments Created ✅");
    } catch {
      alert("Error ❌");
    }
  };

  return (
    <Layout>

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto p-4">

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">

 <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
  Setup Appointments
</h1>

          {/* GRID FORM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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
              onChange={(e)=>setForm({...form,doctor:e.target.value})}
            >
              <option>Select Doctor</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>

            {/* Date */}
            <input
              type="date"
              className="input"
              onChange={(e)=>setForm({...form,date:e.target.value})}
            />

            {/* Slot Count */}
            <input
              type="number"
              className="input"
              placeholder="Slots (e.g. 6)"
              onChange={(e)=>setForm({...form,slot_count:e.target.value})}
            />

            {/* Time Inputs Full Width */}
            <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2">
              <input
                type="time"
                className="input w-full"
                onChange={(e)=>setForm({...form,start_time:e.target.value})}
              />
              <input
                type="time"
                className="input w-full"
                onChange={(e)=>setForm({...form,end_time:e.target.value})}
              />
            </div>

          </div>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">

            <button
              onClick={generateSlots}
              className="w-full sm:w-auto bg-gray-600 text-white px-4 py-3 rounded-xl"
            >
              Preview Slots
            </button>

            <button
              onClick={handleSave}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 rounded-xl"
            >
              Save Slots
            </button>

          </div>

        </div>

        {/* SLOT PREVIEW */}
        {slotsPreview.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow p-4">

            <h2 className="font-semibold mb-3">
              Generated Slots
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slotsPreview.map((s, i) => (
                <div
                  key={i}
                  className="p-3 text-center border rounded-xl bg-gray-50 text-sm"
                >
                  {s.start} - {s.end}
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </Layout>
  );
}