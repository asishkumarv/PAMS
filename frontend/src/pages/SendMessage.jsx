import { useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

export default function SendMessage() {
  const [msg, setMsg] = useState("");
  const [type, setType] = useState("GENERAL");
  const [loading, setLoading] = useState(false);

  const sendBulk = async () => {
    if (!msg.trim()) {
      alert("Enter message ❌");
      return;
    }

    try {
      setLoading(true);

      await API.post("/api/bulk-sms", {
        message: msg,
        type: type,
      });

      alert("Messages sent successfully ✅");
      setMsg("");

    } catch (err) {
      alert("Failed to send ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
  <Layout>
    <div className="p-6 flex justify-center items-center min-h-[80vh]">

      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-6 border">

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          📢 Send Message
        </h1>
        <p className="text-gray-500 mb-5 text-sm">
          Send announcements, greetings, or reminders to patients
        </p>

        {/* Message Type */}
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Message Type
        </label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-3 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="GENERAL">General</option>
          <option value="GREETING">Greeting 🎉</option>
          <option value="REMINDER">Reminder ⏰</option>
          <option value="ADVERTISEMENT">Advertisement 📢</option>
        </select>

        {/* Message Box */}
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Message Content
        </label>

        <textarea
          rows="5"
          placeholder="Type your message here..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="w-full p-3 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Quick Templates */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setMsg("Good Morning 🌞 Stay healthy!")}
            className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
          >
            Morning Wish
          </button>

          <button
            onClick={() =>
              setMsg("Reminder: Your appointment is tomorrow. Please be on time.")
            }
            className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
          >
            Reminder
          </button>

          <button
            onClick={() =>
              setMsg("Free health checkup camp this Sunday! Visit us.")
            }
            className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
          >
            Promotion
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={sendBulk}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {loading ? "Sending Messages..." : "🚀 Send Message"}
        </button>

      </div>

    </div>
  </Layout>
);
}