require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { execFile, exec } = require('child_process');
const axios = require('axios');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Multer storage with 50MB file size limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/upload-audio', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

  const mp3Path = req.file.path;
  const wavPath = mp3Path.replace(path.extname(mp3Path), '.wav');

  // 1) Convert mp3 to wav
  exec(`ffmpeg -y -i "${mp3Path}" "${wavPath}"`, (ffmpegErr) => {
    if (ffmpegErr) {
      console.error('FFmpeg error:', ffmpegErr);
      return res.status(500).json({ error: 'Audio conversion failed' });
    }

    // 2) Transcribe with Python script
    execFile('python', ['vosk_transcribe.py', wavPath], async (transErr, stdout) => {
      if (transErr) {
        console.error('Transcription error:', transErr);
        return res.status(500).json({ error: 'Transcription failed' });
      }

      let transcript = '';
      try {
        transcript = JSON.parse(stdout).transcript || '';
      } catch {
        return res.status(500).json({ error: 'Invalid transcription output' });
      }

      try {
        // 3) Call Gemini flash API for summary + flashcards
        const result = await callGeminiFlashAPI(transcript);

        return res.json({
          message: 'Audio processed, transcribed, and summarized successfully!',
          transcript,
          summary: result.summary,
          flashcards: result.flashcards
        });
      } catch (apiErr) {
        console.error('Gemini API error:', apiErr);
        return res.status(500).json({ error: 'Gemini summarization failed' });
      }
    });
  });
});

// Gemini flash REST API call
async function callGeminiFlashAPI(transcript) {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `
Please summarize the following transcript in 2-3 lines, then generate 3 simple flashcards with questions and answers. Separate summary and flashcards by ###.

Transcript:
"${transcript}"
`;

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

  // Split summary and flashcards by "###"
  const [summary, ...flashcardsParts] = text.split('###');
  return {
    summary: summary.trim(),
    flashcards: flashcardsParts.join('\n').trim()
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
