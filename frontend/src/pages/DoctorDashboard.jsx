import { useEffect, useState } from "react";
import API from "../services/api";
import TokenCard from "../pages/TokenCard";
import { useNavigate } from "react-router-dom";

export default function DoctorDashboard() {
  const [tokens, setTokens] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const doctor = JSON.parse(localStorage.getItem("user"));
  const nav = useNavigate();

  useEffect(() => {
    API.get(`/api/doctor/tokens/${doctor.id}`)
      .then(res => setTokens(res.data));
  }, []);

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  // 🔍 FILTER LOGIC
  const filtered = tokens.filter(t => {
    return (
      t.patient_name.toLowerCase().includes(search.toLowerCase()) &&
      (dateFilter ? t.date === dateFilter : true)
    );
  });

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">

    {/* HEADER */}
    <div className="bg-white rounded-2xl shadow p-4 mb-6 flex justify-between items-center">

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          👨‍⚕️ Doctor Dashboard
        </h2>
        <p className="text-sm text-gray-500">
          Welcome Dr. {doctor?.name || "Doctor"}
        </p>
      </div>

      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl shadow transition"
      >
        Logout
      </button>
    </div>

    {/* FILTERS */}
    <div className="bg-white p-4 rounded-2xl shadow mb-6 flex flex-col sm:flex-row gap-3">

      <input
        placeholder="🔍 Search patient..."
        className="input flex-1 focus:ring-2 focus:ring-blue-400"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <input
        type="date"
        className="input focus:ring-2 focus:ring-blue-400"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
      />

    </div>

    {/* LIST */}
    {filtered.length === 0 ? (
      <div className="text-center text-gray-500 mt-10">
        No patients found 💤
      </div>
    ) : (
      <div className="grid gap-5">
        {filtered.map(t => (
          <TokenCard key={t.id} token={t} />
        ))}
      </div>
    )}

  </div>
);
}