import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

export default function StaffDashboard() {
  const [stats, setStats] = useState({});
  const [tokens, setTokens] = useState([]);

  const fetchData = async () => {
    const res1 = await API.get("/api/staff/dashboard");
    const res2 = await API.get("/api/tokens/today");

    setStats(res1.data);
    setTokens(res2.data);
  };

  const updateStatus = async (id, status) => {
    await API.put("/api/tokens/update", { id, status });
    fetchData();
  };

  useEffect(() => {
    fetchData();

    // 🔥 Auto refresh every 5 sec (real-time feel)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Staff Dashboard
        </h1>
        <p className="text-gray-500 text-sm">
          Manage patient queue in real-time
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
          <p className="text-gray-500 text-sm">Total Tokens</p>
          <h2 className="text-3xl font-bold text-blue-600">
            {stats.total || 0}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
          <p className="text-gray-500 text-sm">Waiting</p>
          <h2 className="text-3xl font-bold text-yellow-500">
            {stats.waiting || 0}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
          <p className="text-gray-500 text-sm">Completed</p>
          <h2 className="text-3xl font-bold text-green-600">
            {stats.completed || 0}
          </h2>
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow p-4 overflow-x-auto">

        <h2 className="text-lg font-semibold mb-4">
          Live Queue
        </h2>

        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Patient</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Doctor</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {tokens.map((t, i) => (
              <tr
                key={t.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="p-3 font-medium">
                  {t.token_number}
                </td>

                <td className="p-3">
                  {t.patient_name}
                </td>

                <td className="p-3">
                  {t.department}
                </td>

                <td className="p-3">
                  {t.doctor}
                </td>

                {/* STATUS */}
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    t.status === "WAITING"
                      ? "bg-yellow-100 text-yellow-700"
                      : t.status === "ARRIVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {t.status}
                  </span>
                </td>

                {/* ACTIONS */}
                <td className="p-3 flex gap-2 flex-wrap">

                  <button
                    onClick={() => updateStatus(t.id, "ARRIVED")}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs"
                  >
                    Arrived
                  </button>

                  <button
                    onClick={() => updateStatus(t.id, "CANCELLED")}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs"
                  >
                    Cancel
                  </button>

                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </Layout>
  );
}