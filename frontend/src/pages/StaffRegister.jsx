import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function StaffRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    secretKey: "",
  });

  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleRegister = async () => {
    try {
      setLoading(true);

      await API.post("/api/staff/register", form);

      localStorage.setItem("staffEmail", form.email); // fallback storage

      alert("OTP sent to email ✅");

      nav("/staffverify", { state: { email: form.email } });
    } catch (err) {
      alert(err.response?.data?.msg || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 px-4">

      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Staff Registration 🏥
          </h2>
          <p className="text-gray-500 text-sm">
            Create staff account securely
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
            placeholder="Email Address"
            onChange={(e)=>setForm({...form,email:e.target.value})}
          />

          <input
            type="password"
            className="input md:col-span-2"
            placeholder="Password"
            onChange={(e)=>setForm({...form,password:e.target.value})}
          />

          {/* Secret Key Section */}
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">
              Secret Key
            </label>
            <input
              className="input mt-1"
              placeholder="Enter admin secret key"
              onChange={(e)=>setForm({...form,secretKey:e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">
              Required for authorized staff registration
            </p>
          </div>

        </div>

        {/* Button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className={`w-full mt-6 py-3 rounded-xl font-semibold transition ${
            loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered?{" "}
          <span
            onClick={() => nav("/stafflogin")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}