import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function PatientRegister() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleRegister = async () => {
    try {
      setLoading(true);
      await API.post("/api/patient/register", form);

      alert("OTP sent to email ✅");
      nav("/verify", { state: { email: form.email } });
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 px-4">

      {/* Card */}
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-3xl p-8">

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Create Account
          </h1>
          <p className="text-gray-500 text-sm">
            Register to book your token
          </p>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            className="input"
            placeholder="Full Name"
            onChange={(e)=>setForm({...form,name:e.target.value})}
          />

          <input
            className="input"
            placeholder="Mobile Number"
            onChange={(e)=>setForm({...form,mobile:e.target.value})}
          />

          <input
            className="input md:col-span-2"
            placeholder="Email Address"
            onChange={(e)=>setForm({...form,email:e.target.value})}
          />

          <input
            type="password"
            className="input md:col-span-2"
            placeholder="Password"
            onChange={(e)=>setForm({...form,password:e.target.value})}
          />
        </div>

        {/* Button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className={`w-full mt-6 py-3 rounded-xl font-medium transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => nav("/")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}