// // callGeminiAPI.js
// const axios = require('axios');

// async function callGeminiAPI(transcript) {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) throw new Error("GEMINI_API_KEY is not set in env");

//   const prompt = `
// Please summarize the following transcript in 2-3 lines, then generate as many simple flashcards with questions and answers as possible (up to 10). Separate summary and flashcards by ###.


// Transcript:
// "${transcript}"
//   `;

//   try {
//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
//       {
//         contents: [
//           {
//             parts: [{ text: prompt }]
//           }
//         ]
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

//     // Split summary and flashcards by "###"
//     const [summary, ...flashcardsParts] = text.split('###');

//     return {
//       summary: summary.trim(),
//       flashcards: flashcardsParts.join('\n').trim()
//     };
//   } catch (error) {
//     console.error('Error calling Gemini API:', error.response?.data || error.message);
//     throw new Error('Gemini API call failed');
//   }
// }

// module.exports = callGeminiAPI;



// const axios = require('axios');

// async function callGeminiAPI(transcript) {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) throw new Error("GEMINI_API_KEY is not set in env");

//   const prompt = `
// You are given the raw transcript of an audio conversation.

// Your tasks:
// 1) Write a clear summary in **3–5 sentences**.
// 2) Rewrite the conversation as a **strict JSON array** with **no extra text**. 
//    - Format: \`[\n  {"speaker": "Speaker 1", "text": "..."}, ...\n]\`
//    - Do not add any explanations or code blocks — output valid JSON only.
//    - If there is only one speaker, use "Speaker 1" for all lines.
//    - If speakers are unclear, break text naturally with "Speaker 1", "Speaker 2" as needed.
// 3) Create **1–10 important flashcards** with clear **Q & A**, formatted exactly as:
//    \`\`
//    1. Q: [question]
//       A: [answer]
//    \`\`
//    Do not include slashes or code blocks.

// **Output:**  
// - First, the summary.  
// - Then \`###\`  
// - Then only the JSON array (conversation script).  
// - Then \`###\`  
// - Then the list of flashcards.

// Transcript:
// "${transcript}"
// `;

//   try {
//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
//       {
//         contents: [
//           {
//             parts: [{ text: prompt }]
//           }
//         ]
//       },
//       {
//         headers: { 'Content-Type': 'application/json' }
//       }
//     );

//     const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
//     console.log("Raw Gemini API output:\n", text);

//     // Split output by "###"
//     const parts = text.split('###').map(s => s.trim());
//     const summary = parts[0] || '';

//     let conversationScript = [];
//     let flashcardsText = '';

//     if (parts.length >= 3) {
//       // 2nd part = JSON conversation script (string)
//       const scriptStr = parts[1];

//       // 3rd part = flashcards text
//       flashcardsText = parts[2];

//       try {
//         conversationScript = JSON.parse(scriptStr);
//       } catch (jsonErr) {
//         console.error("Failed to parse conversation script JSON:", jsonErr);
//         // fallback: keep as empty array
//         conversationScript = [];
//       }
//     } else {
//       // if no script or flashcards part, fallback:
//       flashcardsText = parts[1] || '';
//     }

//     // Parse flashcards from text (like "1. Q: ... A: ...")
//     const flashcardLines = flashcardsText.split(/\n(?=\d+\.)/);
//     const flashcards = flashcardLines.map(card => {
//       const qMatch = card.match(/Q:\s*(.+)/i);
//       const aMatch = card.match(/A:\s*([\s\S]+)/i);

//       return {
//         question: qMatch?.[1]?.trim() || '',
//         answer: aMatch?.[1]?.trim() || ''
//       };
//     }).filter(fc => fc.question && fc.answer);

//     // Ensure at least 1 flashcard
//     if (flashcards.length === 0) {
//       flashcards.push({
//         question: "No flashcards generated.",
//         answer: "The transcript did not provide enough information to create flashcards."
//       });
//     }

//     return { summary, conversationScript, flashcards };
//   } catch (error) {
//     console.error('Error calling Gemini API:', error.response?.data || error.message);
//     throw new Error('Gemini API call failed');
//   }
// }

// module.exports = callGeminiAPI;


const axios = require('axios');

async function callGeminiAPI(transcript) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in env");

  const prompt = `
You are given the raw transcript of an audio conversation.

Your tasks:
1) Write a short **title** (5–8 words) describing the main topic.
2) Write a clear **summary** in 3–5 sentences.
3) Rewrite the conversation as a **strict JSON array** with **no extra text**.
   - Format: \`[\n  {"speaker": "Speaker 1", "text": "..."}, ...\n]\`
   - Do not add any explanations or code blocks — output valid JSON only.
   - If there is only one speaker, use "Speaker 1" for all lines.
   - If speakers are unclear, break text naturally with "Speaker 1", "Speaker 2" as needed.
4) Create **1–10 important flashcards** with clear **Q & A**, formatted exactly as:
   \`\`
   1. Q: [question]
      A: [answer]
   \`\`
   Do not include slashes or code blocks.

**Output:**
- First, the title.
- Then \`###\`
- Then the summary.
- Then \`###\`
- Then only the JSON array (conversation script).
- Then \`###\`
- Then the list of flashcards.

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
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log("Raw Gemini API output:\n", text);

    // Split output by "###"
    const parts = text.split('###').map(s => s.trim());
    const title = parts[0] || '';
    const summary = parts[1] || '';

    let conversationScript = [];
    let flashcardsText = '';

    if (parts.length >= 4) {
      const scriptStr = parts[2];
      flashcardsText = parts[3];

      try {
        conversationScript = JSON.parse(scriptStr);
      } catch (jsonErr) {
        console.error("Failed to parse conversation script JSON:", jsonErr);
        conversationScript = [];
      }
    } else {
      flashcardsText = parts[2] || '';
    }

    // Parse flashcards from text (like "1. Q: ... A: ...")
    const flashcardLines = flashcardsText.split(/\n(?=\d+\.)/);
    const flashcards = flashcardLines.map(card => {
      const qMatch = card.match(/Q:\s*(.+)/i);
      const aMatch = card.match(/A:\s*([\s\S]+)/i);

      return {
        question: qMatch?.[1]?.trim() || '',
        answer: aMatch?.[1]?.trim() || ''
      };
    }).filter(fc => fc.question && fc.answer);

    if (flashcards.length === 0) {
      flashcards.push({
        question: "No flashcards generated.",
        answer: "The transcript did not provide enough information to create flashcards."
      });
    }

    return { title, summary, conversationScript, flashcards };
  } catch (error) {
    console.error('Error calling Gemini API:', error.response?.data || error.message);
    throw new Error('Gemini API call failed');
  }
}

module.exports = callGeminiAPI;
