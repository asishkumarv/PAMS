import { useEffect, useState } from "react";
import API from "../services/api";
import PatientLayout from "../components/PatientLayout";

export default function MyTokens() {
  const [tokens, setTokens] = useState([]);
  const [user, setUser] = useState(null);

  // ✅ Load user from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("patient"));
    setUser(stored);
  }, []);

  // ✅ Fetch tokens
  const fetchTokens = async (patientId) => {
    try {
      const res = await API.get(`/api/tokens/patient/${patientId}`);
      setTokens(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Load tokens when user available
  useEffect(() => {
    if (user?.id) {
      fetchTokens(user.id);
    }
  }, [user]);

  // ✅ Cancel token
  const cancelToken = async (id) => {
    try {
      await API.put("/api/tokens/update", {
        id,
        status: "CANCELLED",
      });

      fetchTokens(user.id); // refresh
    } catch (err) {
      alert("Cancel failed ❌");
    }
  };

  return (
    <PatientLayout>
      <h1 className="text-xl font-bold mb-4">
        My Tokens
      </h1>

      {/* EMPTY STATE */}
      {tokens.length === 0 && (
        <p className="text-gray-500 text-center mt-6">
          No tokens found
        </p>
      )}

      {/* TOKEN CARDS */}
      <div className="space-y-4">
        {tokens.map((t) => {
          const isDisabled = t.status === "CANCELLED" || t.status === "ARRIVED";

          return (
            <div
              key={t.id}
              className="bg-white p-5 rounded-xl shadow border"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-blue-600">
                  Token #{t.token_number}
                </h2>

                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                  t.status === "WAITING"
                    ? "bg-yellow-100 text-yellow-700"
                    : t.status === "ARRIVED"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {t.status}
                </span>
              </div>

              <p className="text-sm">👤 {t.patient_name}</p>
              <p className="text-sm">🏥 {t.dept_name}</p>
              <p className="text-sm">👨‍⚕️ {t.doc_name}</p>
              <p className="text-sm">📅 {t.date}</p>
              <p className="text-sm mb-3">⏰ {t.time_slot}</p>

 <button
  disabled={t.status === "CANCELLED" || t.status === "ARRIVED"}
  onClick={() => cancelToken(t.id)}
  className={`w-full py-2 rounded-lg text-sm text-white ${
    t.status === "CANCELLED" || t.status === "ARRIVED"
      ? "bg-gray-300 cursor-not-allowed"
      : "bg-red-500 hover:bg-red-600"
  }`}
>
  {t.status === "CANCELLED"
    ? "Cancelled"
    : t.status === "ARRIVED"
    ? "Already Arrived"
    : "Cancel Token"}
</button>
            </div>
          );
        })}
      </div>
    </PatientLayout>
  );
}