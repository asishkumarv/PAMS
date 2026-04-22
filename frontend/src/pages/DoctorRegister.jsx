import { useState, useEffect } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function DoctorRegister() {
  const [form, setForm] = useState({});
  const [departments, setDepartments] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    API.get("/api/departments").then(res => setDepartments(res.data));
  }, []);

  const register = async () => {
    if (form.password !== form.confirmPassword)
      return alert("Passwords mismatch ❌");

    await API.post("/api/doctor/register", form);
    alert("Registered ✅");
    nav("/");
  };

  return (
    <div className="center-card">

      <input placeholder="Doctor Name"
        onChange={e=>setForm({...form,name:e.target.value})} />

      <select onChange={e=>setForm({...form,department_id:e.target.value})}>
        <option>Select Department</option>
        {departments.map(d=>(
          <option value={d.id}>{d.name}</option>
        ))}
      </select>

      <input placeholder="Email"
        onChange={e=>setForm({...form,email:e.target.value})} />

      <input type="password" placeholder="Password"
        onChange={e=>setForm({...form,password:e.target.value})} />

      <input type="password" placeholder="Confirm Password"
        onChange={e=>setForm({...form,confirmPassword:e.target.value})} />

      <button onClick={register}>Register</button>

    </div>
  );
}