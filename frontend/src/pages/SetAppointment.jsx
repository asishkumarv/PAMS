import { useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

export default function SetupAppointments() {
  const [form, setForm] = useState({
    department: "",
    doctor: "",
    date: "",
  });

  const generateSlots = () => {
    const slots = [];
    let start = 10 * 60; // 10:00 in minutes

    for (let i = 0; i < 6; i++) {
      let end = start + 30;

      slots.push({
        start: `${Math.floor(start/60)}:${start%60 === 0 ? "00" : "30"}`,
        end: `${Math.floor(end/60)}:${end%60 === 0 ? "00" : "30"}`
      });

      start = end;
    }

    return slots;
  };

  const slots = generateSlots();

  const handleSave = async () => {
    for (let slot of slots) {
      await API.post("/api/appointments/create", {
        doctor_id: form.doctor,
        date: form.date,
        start_time: slot.start,
        end_time: slot.end,
        max_tokens: 5,
      });
    }

    alert("Slots Created ✅");
  };

  return (
    <Layout>

      <h1 className="text-xl font-bold mb-4">Setup Appointments</h1>

      <input
        type="date"
        className="input mb-3"
        onChange={(e)=>setForm({...form,date:e.target.value})}
      />

      <button
        onClick={handleSave}
        className="btn-primary"
      >
        Generate Slots
      </button>

      <div className="mt-6">
        {slots.map((s, i) => (
          <div key={i} className="p-2 border mb-2 rounded">
            {s.start} - {s.end}
          </div>
        ))}
      </div>

    </Layout>
  );
}