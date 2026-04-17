import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function StaffVerify() {
  const [otp, setOtp] = useState("");
  const location = useLocation();
  const nav = useNavigate();

  const email = location.state?.email;

  const verify = async () => {
    try {
      await API.post("/api/staff/verify-otp", { email, otp });

      alert("Registered successfully ✅");
      nav("/staff");

    } catch (err) {
      alert("Invalid OTP ❌");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <div className="bg-white p-6 rounded-2xl shadow w-full max-w-md text-center">

        <h2 className="text-xl mb-4">Verify OTP</h2>

        <input
          className="input mb-4 text-center"
          placeholder="Enter OTP"
          onChange={(e)=>setOtp(e.target.value)}
        />

        <button onClick={verify} className="btn-primary w-full">
          Verify
        </button>

      </div>
    </div>
  );
}