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

      alert("OTP sent to email ✅");

      nav("/staffverify", { state: { email: form.email } });

    } catch (err) {
      alert(err.response?.data?.msg || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 px-4">

      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">

        <h2 className="text-2xl font-bold text-center mb-6">
          Staff Registration 🏥
        </h2>

        <input
          className="input mb-3"
          placeholder="Full Name"
          onChange={(e)=>setForm({...form,name:e.target.value})}
        />

        <input
          className="input mb-3"
          placeholder="Email"
          onChange={(e)=>setForm({...form,email:e.target.value})}
        />

        <input
          type="password"
          className="input mb-3"
          placeholder="Password"
          onChange={(e)=>setForm({...form,password:e.target.value})}
        />

        <input
          className="input mb-5"
          placeholder="Secret Key"
          onChange={(e)=>setForm({...form,secretKey:e.target.value})}
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold ${
            loading
              ? "bg-gray-300"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

      </div>
    </div>
  );
}