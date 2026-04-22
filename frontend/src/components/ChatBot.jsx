import { useState, useEffect, useRef } from "react";
import API from "../services/api";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState("START");
  const [options, setOptions] = useState([]);
  const [data, setData] = useState({});
  const [user, setUser] = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("patient"));
    setUser(stored);

    restartChat();
  }, []);

  // ✅ AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 RESTART CHAT
  const restartChat = () => {
    setMessages([{ from: "bot", text: "Hi 👋 How can I help you?" }]);
    setData({});
    showMainMenu();
  };

  // 🔥 MAIN MENU
  const showMainMenu = () => {
    setOptions([
      { label: "📅 Book Appointment", value: "BOOK" },
      { label: "🔄 Postpone", value: "POSTPONE" },
      { label: "❌ Cancel", value: "CANCEL" }
    ]);
    setStep("START");
  };

  const handleSelect = async (val) => {

    // ================= MENU =================
    if (val === "BOOK") {
      const res = await API.get("/api/departments");

      setMessages(prev => [
        ...prev,
        { from: "user", text: "Book Appointment" },
        { from: "bot", text: "Select Department" }
      ]);

      setOptions(res.data.map(d => ({ label: d.name, value: d })));
      setStep("DEPT");
      return;
    }

    else if (val === "POSTPONE") {
      const res = await API.get(`/api/tokens/patient/${user.id}`);
      const booked = res.data.filter(t => t.status === "WAITING");

      setMessages(prev => [
        ...prev,
        { from: "user", text: "Postpone" },
        { from: "bot", text: "Select Appointment" }
      ]);

      setOptions(booked.map(t => ({
        label: `📋 Token #${t.token_number}
📅 ${t.date}
⏰ ${t.time_slot}
🩺 ${t.doc_name || "Doctor"}
🏥 ${t.dept_name || "Department"}`,
        value: t
      })));

      setStep("POSTPONE_SELECT");
      return;
    }

    else if (val === "CANCEL") {
      const res = await API.get(`/api/tokens/patient/${user.id}`);

      setMessages(prev => [
        ...prev,
        { from: "user", text: "Cancel" },
        { from: "bot", text: "Select Appointment to Cancel" }
      ]);

      setOptions(res.data.map(t => ({
        label: `📋 Token #${t.token_number}
📅 ${t.date}
⏰ ${t.time_slot}
🩺 ${t.doc_name || "Doctor"}
🏥 ${t.dept_name || "Department"}`,
        value: t
      })));

      setStep("CANCEL_SELECT");
      return;
    }

    // ================= BOOK =================
    if (step === "DEPT") {
      const res = await API.get(`/api/doctors/${val.id}`);

      setData({ dept: val.id, dept_name: val.name });

      setMessages(prev => [
        ...prev,
        { from: "user", text: val.name },
        { from: "bot", text: "Select Doctor" }
      ]);

      setOptions(res.data.map(d => ({ label: d.name, value: d })));
      setStep("DOCTOR");
    }

    else if (step === "DOCTOR") {
      setData(prev => ({
        ...prev,
        doctor: val.id,
        doctor_name: val.name
      }));

      const dates = [...Array(5)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
      });

      setMessages(prev => [
        ...prev,
        { from: "user", text: val.name },
        { from: "bot", text: "Select Date" }
      ]);

      setOptions(dates.map(d => ({ label: d, value: d })));
      setStep("DATE");
    }

    else if (step === "DATE") {
      const res = await API.get(`/api/appointments/${data.doctor}/${val}`);

      setData(prev => ({ ...prev, date: val }));

      setMessages(prev => [
        ...prev,
        { from: "user", text: val },
        { from: "bot", text: "Select Slot" }
      ]);

      setOptions(res.data.map(s => ({
        label: `${s.start_time} - ${s.end_time}`,
        value: s
      })));

      setStep("SLOT");
    }

    else if (step === "SLOT") {
      try {
        await API.post("/api/tokens/pcreate", {
          patient_name: user.name,
          patient_id: user.id,
          mobile: user.mobile,
          email: user.email,
          department: data.dept,
          doctor: data.doctor,
          date: data.date,
          time_slot: `${val.start_time} - ${val.end_time}`,
          appointment_id: val.id
        });

        setMessages(prev => [
          ...prev,
          { from: "user", text: `${val.start_time} - ${val.end_time}` },
          {
            from: "bot",
            text: `✅ Appointment Booked!

📋 Details:
👤 ${user.name}
📅 ${data.date}
⏰ ${val.start_time} - ${val.end_time}
🩺 ${data.doctor_name}
🏥 ${data.dept_name}

Need further help?`
          }
        ]);

      } catch {
        setMessages(prev => [...prev, { from: "bot", text: "❌ Booking failed" }]);
      }

      showMainMenu();
    }

    // ================= CANCEL =================
    else if (step === "CANCEL_SELECT") {
      setData({ token: val });

      setMessages(prev => [
        ...prev,
        { from: "user", text: `#${val.token_number}` },
        { from: "bot", text: "Confirm Cancel?" }
      ]);

      setOptions([
        { label: "Yes", value: "YES" },
        { label: "No", value: "NO" }
      ]);

      setStep("CONFIRM_CANCEL");
    }

    else if (step === "CONFIRM_CANCEL") {
      if (val === "YES") {
        await API.put("/api/tokens/update", {
          id: data.token.id,
          status: "CANCELLED"
        });

        setMessages(prev => [
          ...prev,
          {
            from: "bot",
            text: `❌ Appointment Cancelled!

📋 Token #${data.token.token_number}
📅 ${data.token.date}
⏰ ${data.token.time_slot}
You can also see your appointment history in the My Tokens section.
Need further help?`
          }
        ]);
      }

      showMainMenu();
    }
  };

 return (
  <>
    {/* Floating Button */}
    <button
      onClick={() => setOpen(!open)}
      className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition duration-300 z-50"
    >
      💬
    </button>

    {open && (
      <div className="fixed bottom-16 right-4 sm:right-6 w-[95%] sm:w-96 max-w-md h-[75vh] bg-white rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex justify-between items-center shadow-md">
          <div>
            <h2 className="font-semibold text-lg">Assistant 🤖</h2>
            <p className="text-xs opacity-80">Online • Ready to help</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={restartChat}
              className="bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30 transition"
            >
              🔄
            </button>
            <button
              onClick={() => setOpen(false)}
              className="bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30 transition"
            >
              ✖
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100">

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm whitespace-pre-line shadow-md transition-all ${
                  m.from === "user"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* OPTIONS */}
          <div className="space-y-2">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(opt.value)}
                className="w-full text-left bg-white border rounded-2xl p-3 shadow-sm hover:shadow-md hover:bg-blue-50 transition whitespace-pre-line flex items-start gap-2"
              >
                <span className="text-blue-500">➤</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          <div ref={bottomRef} />
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs p-2 text-gray-400 border-t bg-white">
          PAMS Assistant • Online
        </div>
      </div>
    )}
  </>
);
}