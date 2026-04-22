import { BrowserRouter, Routes, Route } from "react-router-dom";

import PatientLogin from "./pages/PatientLogin";
import PatientRegister from "./pages/PatientRegister";
import OTPVerify from "./pages/OtpVerify";
import StaffRegister from "./pages/StaffRegister";
import StaffLogin from "./pages/StaffLogin";
import StaffVerify from "./pages/StaffVerify";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StaffDashboard from "./pages/StaffDashboard";
import BookToken from "./pages/BookToken";
import SetAppointment from "./pages/SetAppointment";
import PatientBookToken from "./pages/PatientBookToken";
import MyTokens from "./pages/MyTokens";
import SendMessage from "./pages/SendMessage";
import DoctorRegister from "./pages/DoctorRegister";
import DoctorDashboard from "./pages/DoctorDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Patient */}
        <Route path="/" element={<PatientLogin />} />
        <Route path="/register" element={<PatientRegister />} />
        <Route path="/verify" element={<OTPVerify />} />
        {/* <Route path="/patientdashboard" element={<Dashboard />} /> */}
<Route path="/patient/book" element={<PatientBookToken />} />

        {/* Staff */}
        <Route path="/staffregister" element={<StaffRegister />} />
        <Route path="/stafflogin" element={<StaffLogin />} />
        <Route path="/staffverify" element={<StaffVerify />} />
        <Route path="/sdashboard" element={<StaffDashboard />} />
        <Route path="/book-token" element={<BookToken />} />
        <Route path="/set-appointment" element={<SetAppointment />} />
        <Route path="/send-message" element={<SendMessage />} />
        <Route path="/doctor-register" element={<DoctorRegister />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        {/* Protected */}
<Route
  path="/dashboard"
  element={
   
      <Dashboard />
    
  }
/>
<Route path="/my-tokens" element={<MyTokens />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;