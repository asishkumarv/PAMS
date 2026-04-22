import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [role, setRole] = useState("staff"); // staff | doctor
  const [form, setForm] = useState({ email: "", password: "" });
  const nav = useNavigate();

  const handleLogin = async () => {
    try {
      const url =
        role === "staff" ? "/api/staff/login" : "/api/doctor/login";

      const res = await API.post(url, form);

      localStorage.setItem("user", JSON.stringify(res.data));

      if (role === "staff") nav("/sdashboard");
      else nav("/doctor-dashboard");

    } catch {
      alert("Login failed ❌");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 px-4">

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">

        {/* SWITCH */}
        <div className="flex mb-6 bg-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setRole("staff")}
            className={`flex-1 py-2 font-semibold transition ${
              role === "staff"
                ? "bg-blue-600 text-white"
                : "text-gray-600"
            }`}
          >
            Reception
          </button>

          <button
            onClick={() => setRole("doctor")}
            className={`flex-1 py-2 font-semibold transition ${
              role === "doctor"
                ? "bg-blue-600 text-white"
                : "text-gray-600"
            }`}
          >
            Doctor
          </button>
        </div>

        {/* TITLE */}
        <h2 className="text-xl font-bold text-center mb-4">
          {role === "staff" ? "Reception Login 🏥" : "Doctor Login 👨‍⚕️"}
        </h2>

        {/* EMAIL */}
        <input
          placeholder="Email"
          className="input mb-3"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          className="input mb-4"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition"
        >
          Login
        </button>

        {/* REGISTER LINKS */}
        <div className="mt-6 text-center text-sm">

          {role === "doctor" && (
            <p
              onClick={() => nav("/doctor-register")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Register as Doctor 👨‍⚕️
            </p>
          )}

          {role === "staff" && (
            <p
              onClick={() => nav("/staffregister")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Register new staff 🧑‍💼
            </p>
          )}

        </div>

      </div>
    </div>
  );
}