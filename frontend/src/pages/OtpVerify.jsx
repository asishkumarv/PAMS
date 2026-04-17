export default function OTPVerify() {
  const [otp, setOtp] = useState("");
  const location = useLocation();
  const email = location.state?.email;

  const verify = async () => {
    await API.post("/api/patient/verify-otp", { email, otp });
    alert("Verified!");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-2xl shadow w-full max-w-md">

        <h2 className="text-lg mb-4">Enter OTP</h2>

        <input
          className="input mb-3"
          placeholder="OTP"
          onChange={(e) => setOtp(e.target.value)}
        />

        <button onClick={verify} className="btn-primary w-full">
          Verify
        </button>

      </div>
    </div>
  );
}