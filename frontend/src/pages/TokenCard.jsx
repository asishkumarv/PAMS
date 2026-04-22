import { useState, useRef } from "react";
import API from "../services/api";
import jsPDF from "jspdf";

export default function TokenCard({ token }) {
  const [text, setText] = useState(token.prescription || "");
  const [generated, setGenerated] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const [listening, setListening] = useState(false);
  const [showMic, setShowMic] = useState(false);

  const [lang, setLang] = useState("en-IN");

  const recognitionRef = useRef(null);

  // INIT
  if (!recognitionRef.current) {
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

    recognitionRef.current = recognition;
  }

  const recognition = recognitionRef.current;
  recognition.lang = lang;

  const toggleMic = () => {
    if (!listening) {
      setShowMic(true);
      setListening(true);
      recognition.start();
    } else {
      setListening(false);
      recognition.stop();
    }
  };

  const generate = async () => {
    try {
      setLoadingAI(true);
      const res = await API.post("/api/prescription/preview", { text });
      setGenerated(res.data.formatted);
    } catch {
      alert("AI failed ❌");
    } finally {
      setLoadingAI(false);
    }
  };

  const save = async () => {
    const finalText = generated || text;

    await API.put("/api/tokens/prescription", {
      tokenId: token.id,
      prescription: finalText,
    });

    alert("Saved & Sent ✅");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    const content = `
PAMS Hospital

Patient: ${token.patient_name}
Doctor: ${token.doc_name}
Department: ${token.dept_name}

Date: ${new Date(token.date).toLocaleDateString()}
Time: ${token.time_slot}

----------------------

Prescription:

${generated || text}
`;

    doc.text(content, 10, 10);
    doc.save(`${token.patient_name}_Prescription.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border hover:shadow-xl transition">

      {/* HEADER */}
      <h3 className="font-semibold text-lg text-gray-800 mb-3">
        👤 {token.patient_name}
      </h3>

      {/* LANGUAGE */}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-400"
      >
        <option value="en-IN">English</option>
        <option value="hi-IN">Hindi</option>
        <option value="te-IN">Telugu</option>
        <option value="ta-IN">Tamil</option>
        <option value="kn-IN">Kannada</option>
        <option value="ml-IN">Malayalam</option>
        <option value="mr-IN">Marathi</option>
      </select>

      {/* TEXT AREA */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="🧾 Speak or type prescription..."
        className="w-full border rounded-xl p-3 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none mb-3"
        rows={3}
      />

      {/* GENERATE */}
      <button
        onClick={generate}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 rounded-lg shadow mb-3 hover:opacity-90"
      >
        {loadingAI ? "Generating..." : "🤖 Generate Prescription"}
      </button>

      {/* GENERATED */}
      {generated && (
        <textarea
          value={generated}
          onChange={(e) => setGenerated(e.target.value)}
          className="w-full border rounded-xl p-3 text-sm bg-green-50 text-gray-800 mb-3"
          rows={4}
        />
      )}

      {/* BUTTONS */}
      <div className="flex flex-wrap gap-2 justify-between">

        <button
          onClick={toggleMic}
          className={`flex-1 py-2 rounded-lg text-white shadow ${
            listening
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {listening ? "⏹ Stop" : "🎤 Start"}
        </button>

        <button
          onClick={downloadPDF}
          className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-lg shadow"
        >
          📄 PDF
        </button>

        <button
          onClick={save}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg shadow"
        >
          💾 Save
        </button>

      </div>

      {/* 🎤 MODERN POPUP */}
      {showMic && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">

          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl text-center">

            <h3 className="text-xl font-semibold mb-4">
              🎤 Voice Assistant
            </h3>

            <div className="bg-gray-100 p-4 rounded-xl min-h-[120px] text-gray-700 mb-5">
              {text || "Start speaking..."}
            </div>

            <div className="flex gap-3">

              <button
                onClick={toggleMic}
                className={`flex-1 py-3 rounded-lg text-white text-sm ${
                  listening
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              >
                {listening ? "Stop" : "Start"}
              </button>

              <button
                onClick={() => {
                  recognition.stop();
                  setListening(false);
                  setShowMic(false);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}