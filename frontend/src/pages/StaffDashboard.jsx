import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

export default function StaffDashboard() {
  const [stats, setStats] = useState({});
  const [tokens, setTokens] = useState([]);
const [departments, setDepartments] = useState([]);
const [doctors, setDoctors] = useState([]);

const [selectedDept, setSelectedDept] = useState("");
const [selectedDoctor, setSelectedDoctor] = useState("");
const [search, setSearch] = useState("");
const [selectedDate, setSelectedDate] = useState("");
const [showModal, setShowModal] = useState(false);
const [selectedToken, setSelectedToken] = useState(null);
const [availableSlots, setAvailableSlots] = useState([]);
const [selectedSlot, setSelectedSlot] = useState(null);
  const fetchData = async () => {
    const res1 = await API.get("/api/staff/dashboard");
    const res2 = await API.get("/api/tokens/today");

    setStats(res1.data);
    setTokens(res2.data);
  };

const updateStatus = async (id, status) => {
  const actionText = status === "ARRIVED" ? "mark as ARRIVED" : "cancel this token";

  const confirmAction = window.confirm(
    `Are you sure you want to ${actionText}?`
  );

  if (!confirmAction) return;

  try {
    await API.put("/api/tokens/update", { id, status });

    alert(
      status === "ARRIVED"
        ? "Token marked as ARRIVED ✅"
        : "Token cancelled successfully ❌"
    );

    fetchData();
  } catch (err) {
    alert("Update failed ❌");
  }
};

useEffect(() => {
  fetchData();

  API.get("/api/departments").then(res => {
    setDepartments(res.data);
  });

  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, []);
const handleDeptChange = async (deptId) => {
  setSelectedDept(deptId);
  setSelectedDoctor("");

  if (deptId) {
    const res = await API.get(`/api/doctors/${deptId}`);
    setDoctors(res.data);
  } else {
    setDoctors([]);
  }
};
const openPostpone = async (token) => {
  setSelectedToken(token);
  setShowModal(true);

  const res = await API.get(`/api/slots/next/${token.doctor}`);
  setAvailableSlots(res.data);
};
const handlePostpone = async () => {
  if (!selectedSlot) {
    alert("Select a slot ❌");
    return;
  }

  try {
    await API.put("/api/tokens/postpone", {
      tokenId: selectedToken.id,
      appointmentId: selectedSlot.id,
      date: selectedSlot.date,
      time_slot: `${selectedSlot.start_time}-${selectedSlot.end_time}`
    });

    alert("Token postponed successfully ✅");

    setShowModal(false);
    setSelectedSlot(null);

    fetchData(); // refresh table

  } catch (err) {
    alert("Postpone failed ❌");
  }
};
const filteredTokens = tokens.filter(t => {
  return (
    (!selectedDept || t.department == selectedDept) &&
    (!selectedDoctor || t.doctor == selectedDoctor) &&
    (!selectedDate || t.date?.slice(0, 10) === selectedDate) &&
    (!search || t.patient_name.toLowerCase().includes(search.toLowerCase()))
  );
});
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">

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

<h2 className="text-lg font-bold mb-4 text-gray-800 bg-gray-100 px-3 py-2 rounded-lg">
  Live Queue
</h2>
    <div className="bg-white p-4 rounded-xl shadow mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

  {/* Department Filter */}
  <select
    className="input"
    value={selectedDept}
    onChange={(e) => handleDeptChange(e.target.value)}
  >
    <option value="">All Departments</option>
    {departments.map(d => (
      <option key={d.id} value={d.id}>{d.name}</option>
    ))}
  </select>

  {/* Doctor Filter */}
  <select
    className="input w-full"
    value={selectedDoctor}
    onChange={(e) => setSelectedDoctor(e.target.value)}
  >
    <option value="">All Doctors</option>
    {doctors.map(doc => (
      <option key={doc.id} value={doc.id}>{doc.name}</option>
    ))}
    
  </select>

  {/* Search */}
  <input
    type="text"
    placeholder="Search patient name..."
    // className="input"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="input w-full"
  />
{/* <input
  type="date"
  className="input w-full"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
/> */}
</div>
<div className="hidden md:block">
        <table className="min-w-[600px] w-full text-sm">

          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Patient</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Doctor</th>
              <th className="p-3 text-left">Slot time</th>
              <th className="p-3 text-left">Status</th>
              
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

<tbody>
  {filteredTokens.map((t, i) => {
    const isDisabled =
      t.status === "ARRIVED" || t.status === "CANCELLED";

    return (
      <tr
        key={t.id}
        className="border-t hover:bg-gray-50 transition"
      >
        <td className="p-3 font-medium">
          {t.token_number}
        </td>

        <td className="p-3">{t.patient_name}</td>
        <td className="p-3">{t.dept_name}</td>
        <td className="p-3">{t.doc_name}</td>
        <td className="p-3">{t.time_slot}</td>

        <td className="p-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              t.status === "WAITING"
                ? "bg-yellow-100 text-yellow-700"
                : t.status === "ARRIVED"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {t.status}
          </span>
        </td>

        {/* ✅ FIXED ACTIONS CELL */}
        <td className="p-3 flex gap-2">
          <button
            disabled={isDisabled}
            onClick={() => updateStatus(t.id, "ARRIVED")}
            className={`px-3 py-1 rounded-lg text-xs text-white ${
              isDisabled
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            Arrived
          </button>

          <button
            disabled={isDisabled}
            onClick={() => updateStatus(t.id, "CANCELLED")}
            className={`px-3 py-1 rounded-lg text-xs text-white ${
              isDisabled
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  })}
</tbody>
        </table>
</div>
<div className="md:hidden space-y-3">
  {filteredTokens.map((t) => {
    const isDisabled =
      t.status === "ARRIVED" || t.status === "CANCELLED";

    return (
      <div
        key={t.id}
        className="bg-white p-4 rounded-xl shadow border"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-blue-600">
            Token #{t.token_number}
          </h3>

          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              t.status === "WAITING"
                ? "bg-yellow-100 text-yellow-700"
                : t.status === "ARRIVED"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {t.status}
          </span>
        </div>

        <p className="text-sm"><b>👤</b> {t.patient_name}</p>
        <p className="text-sm"><b>🏥</b> {t.dept_name}</p>
        <p className="text-sm mb-3"><b>👨‍⚕️</b> {t.doc_name}</p>

        <div className="flex gap-2">
          <button
            disabled={isDisabled}
            onClick={() => updateStatus(t.id, "ARRIVED")}
            className={`flex-1 py-2 rounded-lg text-xs text-white ${
              isDisabled ? "bg-gray-300" : "bg-green-500"
            }`}
          >
            Arrived
          </button>
<button
  disabled={isDisabled}
  onClick={() => openPostpone(t)}
  className={`px-3 py-1 rounded-lg text-xs text-white ${
    isDisabled
      ? "bg-gray-300"
      : "bg-blue-500 hover:bg-blue-600"
  }`}
>
  Postpone
</button>
          <button
            disabled={isDisabled}
            onClick={() => updateStatus(t.id, "CANCELLED")}
            className={`flex-1 py-2 rounded-lg text-xs text-white ${
              isDisabled ? "bg-gray-300" : "bg-red-500"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  })}
</div>     
 </div>

    </Layout>
    
  );
}
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    
    <div className="bg-white p-5 rounded-xl w-[90%] max-w-md">
      
      <h2 className="text-lg font-bold mb-3">
        Select New Slot
      </h2>

      <div className="space-y-2 max-h-60 overflow-y-auto">

        {availableSlots.map(slot => (
          <div
            key={slot.id}
            onClick={() => setSelectedSlot(slot)}
            className={`p-3 border rounded-lg cursor-pointer ${
              selectedSlot?.id === slot.id
                ? "bg-blue-100 border-blue-500"
                : ""
            }`}
          >
            <p>{slot.date}</p>
            <p>{slot.start_time} - {slot.end_time}</p>
          </div>
        ))}

      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 mt-4">

        <button
          onClick={() => setShowModal(false)}
          className="flex-1 bg-gray-300 py-2 rounded"
        >
          Cancel
        </button>

        <button
          onClick={handlePostpone}
          className="flex-1 bg-blue-600 text-white py-2 rounded"
        >
          Confirm
        </button>

      </div>

    </div>
  </div>
)}