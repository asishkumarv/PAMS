import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function StaffLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await API.post("/api/staff/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      nav("/sdashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Staff Login 🏥
          </h2>
          <p className="text-gray-500 text-sm">
            Access your dashboard
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">Email</label>
          <input
            className="input mt-1"
            placeholder="Enter email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-sm text-gray-600">Password</label>
          <input
            type="password"
            className="input mt-1"
            placeholder="Enter password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold transition ${
            loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          New staff?{" "}
          <span
            onClick={() => nav("/staffregister")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Register here
          </span>
        </p>

      </div>
    </div>
  );
}