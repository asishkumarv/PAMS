import { useState, useEffect } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function DoctorRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department_id: ""
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    API.get("/api/departments").then(res => setDepartments(res.data));
  }, []);

  const register = async () => {
    if (!form.name || !form.email || !form.password)
      return alert("Fill all fields ❌");

    if (form.password !== form.confirmPassword)
      return alert("Passwords mismatch ❌");

    try {
      setLoading(true);

      await API.post("/api/doctor/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        department_id: Number(form.department_id)
      });

      alert("Doctor Registered ✅");
      nav("/stafflogin");

    } catch (err) {
      alert(err.response?.data?.msg || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 px-4">

      {/* CARD */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

        {/* HEADER */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Doctor Registration 👨‍⚕️
          </h2>
          <p className="text-gray-500 text-sm">
            Create your account
          </p>
        </div>

        {/* NAME */}
        <input
          placeholder="Doctor Name"
          className="input mb-3"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        {/* DEPARTMENT */}
        <select
          className="input mb-3"
          value={form.department_id}
          onChange={(e) =>
            setForm({
              ...form,
              department_id: Number(e.target.value)
            })
          }
        >
          <option value="">Select Department</option>

          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* EMAIL */}
        <input
          placeholder="Email"
          className="input mb-3"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          className="input mb-3"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        {/* CONFIRM PASSWORD */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="input mb-5"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({
              ...form,
              confirmPassword: e.target.value
            })
          }
        />

        {/* BUTTON */}
        <button
          onClick={register}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold transition ${
            loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {/* LOGIN LINK */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already a doctor?{" "}
          <span
            onClick={() => nav("/staff-login")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Login here
          </span>
        </p>

      </div>
    </div>
  );
}