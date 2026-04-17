import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function OTPVerify() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const nav = useNavigate();

  const email = location.state?.email;

  const verify = async () => {
    try {
      setLoading(true);

      await API.post("/api/patient/verify-otp", { email, otp });

      alert("Verified successfully ✅");
      nav("/");
    } catch (err) {
      alert(err.response?.data?.msg || "Invalid OTP ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Verify OTP 🔐
        </h2>

        <p className="text-gray-500 text-sm mb-6">
          Enter the 6-digit code sent to
          <br />
          <span className="font-medium text-gray-700">{email}</span>
        </p>

        {/* OTP Input */}
        <input
          className="w-full text-center text-2xl tracking-[0.5em] border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition mb-5"
          placeholder="------"
          maxLength={6}
          onChange={(e) => setOtp(e.target.value)}
        />

        {/* Button */}
        <button
          onClick={verify}
          disabled={loading || otp.length !== 6}
          className={`w-full py-3 rounded-xl font-semibold transition ${
            loading || otp.length !== 6
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          }`}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        {/* Resend */}
        <p className="text-sm text-gray-500 mt-6">
          Didn’t receive code?{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            Resend OTP
          </span>
        </p>

      </div>
    </div>
  );
}