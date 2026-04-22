const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function formatPrescription(rawText) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // 🔥 free fast model
    messages: [
      {
        role: "system",
        content: `

 
Convert doctor speech into structured English prescription.

IMPORTANT:
- Input may be Hindi, Telugu, Tamil or mixed any indian language.
- Translate everything to English but dont change medicine names and dont put translation messgae like below in the result:
Translation:
Take Paracetamol 500 mg in the morning and evening. And take Cetirizine 5 mg tablet in the morning and evening. 
- Then format as:


Format:
Medicine - Dosage - Frequency - Time

Include:
- Tablets
- Syrups
- Injections
- Saline
- Instructions

Example:
Paracetamol - 500mg - 2 times/day - Morning & Night
`
      },
      {
        role: "user",
        content: rawText
      }
    ],
  });

  return response.choices[0].message.content;
}

module.exports = formatPrescription;