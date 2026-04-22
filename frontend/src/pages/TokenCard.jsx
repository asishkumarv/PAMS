import { useState } from "react";
import API from "../services/api";

export default function TokenCard({ token }) {
  const [text, setText] = useState(token.prescription || "");
  const [listening, setListening] = useState(false);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;

  recognition.onresult = (e) => {
    let transcript = "";
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    setText(transcript);
  };

  const start = () => {
    setListening(true);
    recognition.start();
  };

  const stop = () => {
    setListening(false);
    recognition.stop();
  };

  const save = async () => {
    await API.put("/api/tokens/prescription", {
      tokenId: token.id,
      prescription: text
    });
    alert("Prescription Saved ✅");
  };

  return (
  <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-xl transition border border-gray-100">

    {/* HEADER */}
    <div className="flex justify-between items-center mb-3">

      <div>
        <h3 className="font-semibold text-lg text-gray-800">
          👤 {token.patient_name}
        </h3>

        <p className="text-xs text-gray-500">
          Token #{token.token_number}
        </p>
      </div>

      <div className="text-right">
        <span className="block text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded mb-1">
          {new Date(token.date).toLocaleDateString()}
        </span>
        <span className="text-xs text-gray-500">
          ⏰ {token.time_slot}
        </span>
      </div>
    </div>

    {/* TEXTAREA */}
    <div className="relative">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
        placeholder="🧾 Write or dictate prescription..."
        rows={3}
      />

      {listening && (
        <span className="absolute top-2 right-3 text-red-500 text-xs animate-pulse">
          🎙 Listening...
        </span>
      )}
    </div>

    {/* ACTION BUTTONS */}
    <div className="flex justify-between items-center mt-4">

      <div className="flex gap-2">

        <button
          onClick={start}
          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm shadow"
        >
          🎤 Start
        </button>

        <button
          onClick={stop}
          className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm shadow"
        >
          ⏹ Stop
        </button>

      </div>

      <button
        onClick={save}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm shadow"
      >
        💾 Save
      </button>

    </div>

  </div>
);
}