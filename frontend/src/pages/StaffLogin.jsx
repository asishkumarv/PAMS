import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function StaffLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const nav = useNavigate();

  const handleLogin = async () => {
    const res = await API.post("/api/staff/login", form);
    localStorage.setItem("token", res.data.token);
    nav("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">Staff Login</h2>

        <input
          className="input mb-3"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          className="input mb-4"
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button onClick={handleLogin} className="btn-primary w-full">
          Login
        </button>
      </div>
    </div>
  );
}