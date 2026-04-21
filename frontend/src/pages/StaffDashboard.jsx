import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { Html5QrcodeScanner } from "html5-qrcode";

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
const [scanOpen, setScanOpen] = useState(false);
const [scannedToken, setScannedToken] = useState(null);
const [lastScannedId, setLastScannedId] = useState(null);
const [scanSuccess, setScanSuccess] = useState(false);
const [scannedSet, setScannedSet] = useState(new Set());
  const fetchData = async () => {
    const res1 = await API.get("/api/staff/dashboard");
    const res2 = await API.get("/api/tokens/today");

    setStats(res1.data);
    setTokens(res2.data);
  };

const updateStatus = async (id, status, skipConfirm = false) => {
  const actionText =
    status === "ARRIVED"
      ? "mark as ARRIVED"
      : "cancel this token";

  // ✅ Only confirm if NOT from QR scan
  if (!skipConfirm) {
    const confirmAction = window.confirm(
      `Are you sure you want to ${actionText}?`
    );
    if (!confirmAction) return;
  }

  try {
    await API.put("/api/tokens/update", { id, status });

    alert(
      status === "CANCELLED"
        ? "Token marked as CANCELLED ✅"
        : "Token marked as ARRIVED ✅"
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

  const res = await API.get(`/api/slots/next/${token.id}`);
  console.log("SLOTS:", res.data);
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
const playBeep = () => {
  const audio = new Audio(
    "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
  );
  audio.play();
};
useEffect(() => {
  if (scanOpen) {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

scanner.render(
  (decodedText) => {
    try {
      const data = JSON.parse(decodedText);

      if (!data.token_id) {
        alert("Invalid QR ❌");
        return;
      }

      if (scannedSet.has(data.token_id)) {
        console.log("Already scanned");
        return;
      }

      playBeep();

      const token = tokens.find(t => t.id === data.token_id);

      if (token) {
        setScannedToken(token); // ✅ FIXED
      }

      setScannedSet(prev => new Set(prev).add(data.token_id));
      setLastScannedId(data.token_id);
      setScanSuccess(true);

      updateStatus(data.token_id, "ARRIVED", true);

      setTimeout(() => setScanSuccess(false), 2000);

      setScanOpen(false);

    } catch (err) {
      alert("Invalid QR format ❌");
    }
  },
  () => {}
);
    return () => {
      scanner.clear().catch(err => console.log(err));
    };
  }
}, [scanOpen]);

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
{scanSuccess && (
  <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce">
    ✅ Patient Marked as Arrived
  </div>
)}
    <div className="w-full min-h-screen bg-gray-50 px-4 md:px-6">
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 overflow-hidden">
    
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
<p className="font-medium">
  {new Date(slot.date).toLocaleDateString()}
</p>
<p className="text-sm text-gray-600">
  {slot.start_time} - {slot.end_time}
</p>
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
<button
  onClick={() => setScanOpen(true)}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
>
  📷 Scan QR
</button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow p-4 w-full overflow-hidden">

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
        <table className="w-full text-sm">

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
  className={`border-t transition ${
    lastScannedId === t.id
      ? "bg-green-100 animate-pulse"
      : "hover:bg-gray-50"
  }`}
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
</div>
{scanOpen && (
  <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
    
    <div className="bg-white p-4 rounded-xl w-[95%] max-w-md">

      <h2 className="text-lg font-bold text-center mb-2">
        📷 Scan QR Code
      </h2>

      <div className="relative">
        <div id="qr-reader" className="rounded-lg overflow-hidden" />

        {/* Overlay box */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-green-400 rounded-lg animate-pulse"></div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-2">
        Align QR inside the box
      </p>

      <button
        onClick={() => setScanOpen(false)}
        className="w-full mt-3 bg-gray-300 py-2 rounded"
      >
        Close
      </button>

    </div>
  </div>
)}
{scannedToken && (
  <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">

    <div className="bg-white p-5 rounded-xl w-[90%] max-w-md text-center">

      <h2 className="text-xl font-bold text-green-600 mb-3">
        ✅ Token Arrived
      </h2>

      <p><b>Token:</b> #{scannedToken.token_number}</p>
      <p><b>Name:</b> {scannedToken.patient_name}</p>
      <p><b>Department:</b> {scannedToken.dept_name}</p>
      <p><b>Doctor:</b> {scannedToken.doc_name}</p>
      <p><b>Time:</b> {scannedToken.time_slot}</p>

      <button
        onClick={() => setScannedToken(null)}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        OK
      </button>

    </div>

  </div>
)}
    </Layout>
    
  );
}
