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

  const filtered = tokens.filter(t => {
    const tokenDate = new Date(t.date).toISOString().split("T")[0];

    return (
      t.patient_name.toLowerCase().includes(search.toLowerCase()) &&
      (dateFilter ? tokenDate === dateFilter : true)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 px-3 sm:px-6 py-4">

      {/* 🔵 HEADER */}
      <div className="bg-blue-600 text-white rounded-2xl shadow p-4 mb-5 flex flex-col sm:flex-row justify-between items-center gap-3 max-w-5xl mx-auto">

        <div>
          <h2 className="text-lg sm:text-2xl font-bold">
            👨‍⚕️ Doctor Dashboard
          </h2>
          <p className="text-sm opacity-90">
            Welcome Dr. {doctor?.name}
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl shadow w-full sm:w-auto"
        >
          Logout
        </button>
      </div>

      {/* 🔍 FILTERS */}
      <div className="bg-white p-4 rounded-2xl shadow mb-6 max-w-5xl mx-auto">

        <div className="flex flex-col sm:flex-row gap-3">

          <input
            placeholder="🔍 Search patient..."
            className="flex-1 px-4 py-3 border rounded-xl text-sm bg-white text-black focus:ring-2 focus:ring-blue-400 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            type="date"
            className="px-4 py-3 border rounded-xl text-sm bg-white text-black focus:ring-2 focus:ring-blue-400 outline-none"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

        </div>
      </div>

      {/* 📋 LIST */}
      <div className="max-w-5xl mx-auto space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No patients found 💤
          </div>
        ) : (
          filtered.map(t => (
            <TokenCard key={t.id} token={t} />
          ))
        )}
      </div>

    </div>
  );
}