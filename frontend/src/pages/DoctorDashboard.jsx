import { useEffect, useState } from "react";
import API from "../services/api";

export default function DoctorDashboard() {
  const [tokens, setTokens] = useState([]);
  const doctor = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    API.get(`/api/doctor/tokens/${doctor.id}`)
      .then(res => setTokens(res.data));
  }, []);

  return (
    <div className="p-6">

      <h2 className="text-xl font-bold mb-4">My Patients</h2>

      {tokens.map(t => (
        <TokenCard token={t} key={t.id} />
      ))}

    </div>
  );
}