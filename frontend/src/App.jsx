import { BrowserRouter, Routes, Route } from "react-router-dom";

import PatientLogin from "./pages/PatientLogin";
import PatientRegister from "./pages/PatientRegister";
import OTPVerify from "./pages/OTPVerify";
import StaffLogin from "./pages/StaffLogin";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Patient */}
        <Route path="/" element={<PatientLogin />} />
        <Route path="/register" element={<PatientRegister />} />
        <Route path="/verify" element={<OTPVerify />} />

        {/* Staff */}
        <Route path="/staff" element={<StaffLogin />} />

        {/* Protected */}
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;