const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function formatPrescription(rawText) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Convert doctor notes into structured prescription.

Format strictly like:
Medicine - Dosage - Frequency - Time

Also include:
- Tablets
- Syrups
- Injections
- Saline
- Instructions

Example:
Paracetamol - 500mg - 2 times/day - Morning & Night
Cough Syrup - 10ml - Once/day - Night
`
      },
      {
        role: "user",
        content: rawText
      }
    ]
  });

  return response.choices[0].message.content;
}

module.exports = formatPrescription;