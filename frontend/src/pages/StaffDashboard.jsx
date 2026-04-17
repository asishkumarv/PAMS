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
  }, []);

  return (
    <Layout>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-gray-500">Total Tokens</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-gray-500">Waiting</h3>
          <p className="text-2xl font-bold text-yellow-500">{stats.waiting}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-gray-500">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>

      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">

        <h2 className="text-lg font-semibold mb-4">Live Queue</h2>

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Token</th>
              <th className="p-2">Name</th>
              <th className="p-2">Department</th>
              <th className="p-2">Doctor</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {tokens.map((t) => (
              <tr key={t.id} className="border-t">

                <td className="p-2">{t.token_number}</td>
                <td className="p-2">{t.patient_name}</td>
                <td className="p-2">{t.department}</td>
                <td className="p-2">{t.doctor}</td>

                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-white text-xs ${
                    t.status === "WAITING" ? "bg-yellow-500" :
                    t.status === "ARRIVED" ? "bg-green-500" :
                    "bg-red-500"
                  }`}>
                    {t.status}
                  </span>
                </td>

                <td className="p-2 space-x-2">
                  <button
                    onClick={() => updateStatus(t.id, "ARRIVED")}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Arrived
                  </button>

                  <button
                    onClick={() => updateStatus(t.id, "CANCELLED")}
                    className="bg-red-500 text-white px-2 py-1 rounded"
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