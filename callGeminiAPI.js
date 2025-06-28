// callGeminiAPI.js
const axios = require('axios');

async function callGeminiAPI(transcript) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in env");

  const prompt = `
Please summarize the following transcript in 2-3 lines, then generate 3 simple flashcards with questions and answers. Separate summary and flashcards by ###.

Transcript:
"${transcript}"
  `;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Split summary and flashcards by "###"
    const [summary, ...flashcardsParts] = text.split('###');

    return {
      summary: summary.trim(),
      flashcards: flashcardsParts.join('\n').trim()
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error.response?.data || error.message);
    throw new Error('Gemini API call failed');
  }
}

module.exports = callGeminiAPI;
