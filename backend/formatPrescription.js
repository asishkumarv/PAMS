const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function formatPrescription(rawText) {
  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192", // 🔥 free fast model
    messages: [
      {
        role: "system",
        content: `
Convert doctor notes into structured prescription.

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