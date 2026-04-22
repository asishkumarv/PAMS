import { useState } from "react";
import API from "../services/api";

export default function TokenCard({ token }) {
  const [text, setText] = useState("");

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

  return (
    <div className="border p-4 rounded-xl mb-4">

      <h3>{token.patient_name}</h3>
      <p>{token.time_slot}</p>

      <textarea
        value={text}
        onChange={(e)=>setText(e.target.value)}
        className="w-full border p-2 mt-2"
      />

      <div className="flex gap-2 mt-2">
        <button onClick={()=>recognition.start()}>🎤</button>
        <button onClick={()=>recognition.stop()}>⏹</button>

        <button onClick={async ()=>{
          await API.put("/api/tokens/prescription", {
            tokenId: token.id,
            prescription: text
          });
          alert("Saved ✅");
        }}>
          Save
        </button>
      </div>

    </div>
  );
}