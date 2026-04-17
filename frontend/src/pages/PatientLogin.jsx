import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function PatientLogin() {
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const login = async () => {
    try {
      setLoading(true);
      const res = await API.post("/api/patient/login", form);

      localStorage.setItem("token", res.data.token);

      nav("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-8">

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome Back 👋
          </h1>
          <p className="text-gray-500 text-sm">
            Login to continue
          </p>
        </div>

        {/* Input: Email / Mobile */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">Email or Mobile</label>
          <input
            className="input mt-1"
            placeholder="Enter email or mobile"
            onChange={(e) =>
              setForm({ ...form, identifier: e.target.value })
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
          onClick={login}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-medium transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <span
            onClick={() => nav("/register")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Register
          </span>
        </p>

      </div>
    </div>
  );
}