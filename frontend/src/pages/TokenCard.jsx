import { useState, useRef } from "react";
import API from "../services/api";
import jsPDF from "jspdf";

export default function TokenCard({ token }) {
  const [text, setText] = useState(token.prescription || "");
  const [listening, setListening] = useState(false);
  const [showMic, setShowMic] = useState(false);

  const recognitionRef = useRef(null);
  const [generated, setGenerated] = useState("");
const [loadingAI, setLoadingAI] = useState(false);

  // 🔥 INIT ONLY ONCE
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

  // 🔄 TOGGLE START/STOP
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

//   const save = async () => {
//     await API.put("/api/tokens/prescription", {
//       tokenId: token.id,
//       prescription: text
//     });
//     alert("Prescription Saved ✅");
//   };
const generate = async () => {
  try {
    setLoadingAI(true);

    const res = await API.post("/api/prescription/preview", {
      text
    });

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
    prescription: finalText
  });

  alert("Saved & Sent ✅");
};

const downloadPDF = () => {
  const doc = new jsPDF();

  const content = `
Hospital: PAMS

Patient: ${token.patient_name}
Doctor: ${token.doc_name}
Department: ${token.dept_name}

Date: ${token.date}
Time: ${token.time_slot}

----------------------------------

${generated || text}
  `;

  doc.text(content, 10, 10);
  doc.save(`Prescription_${token.token_number}.pdf`);
};

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-gray-100 hover:shadow-xl transition">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">

        <div>
          <h3 className="font-semibold text-base sm:text-lg text-gray-800">
            👤 {token.patient_name}
          </h3>
          <p className="text-xs text-gray-500">
            Token #{token.token_number}
          </p>
        </div>

        <div className="text-right text-xs">
          <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded mb-1">
            {new Date(token.date).toLocaleDateString()}
          </div>
          <div className="text-gray-500">
            ⏰ {token.time_slot}
          </div>
        </div>
      </div>

      {/* TEXTAREA */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border rounded-xl p-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none"
        rows={3}
      />
      {/* AI BUTTON */}
<button
  onClick={generate}
  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
>
  {loadingAI ? "Generating..." : "🤖 Generate Prescription"}
</button>

{/* GENERATED OUTPUT */}
{generated && (
  <div className="mt-4">

    <h4 className="font-semibold text-blue-600 mb-2">
      AI Generated (Editable)
    </h4>

    <textarea
      value={generated}
      onChange={(e) => setGenerated(e.target.value)}
      className="w-full border rounded-xl p-3 text-sm bg-green-50"
      rows={5}
    />

  </div>
)}

      {/* BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">

        <button
          onClick={toggleMic}
          className={`px-4 py-2 rounded-lg text-sm text-white ${
            listening
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {listening ? "⏹ Stop" : "🎤 Start"}
        </button>
<button
  onClick={downloadPDF}
  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
>
  📄 Download PDF
</button>
        <button
          onClick={save}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          💾 Save
        </button>

      </div>

      {/* 🎤 POPUP */}
      {showMic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">

          <div className="bg-white rounded-2xl p-5 w-full max-w-md text-center shadow-xl">

            <h3 className="font-semibold text-lg mb-3">
              🎤 {listening ? "Listening..." : "Paused"}
            </h3>

            <div className="bg-gray-100 p-3 rounded-lg min-h-[80px] text-sm mb-4">
              {text || "Speak now..."}
            </div>

            <div className="flex gap-3 justify-center">

              <button
                onClick={toggleMic}
                className={`px-4 py-2 rounded-lg text-white ${
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
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
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