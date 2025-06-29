// // index.js
// require('dotenv').config();
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { exec, execFile } = require('child_process');
// const callGeminiAPI = require('./callGeminiAPI');
// const cloudinary = require('./cloudinary');
// const { admin, db } = require('./firebase');
// const { registerUser, googleLogin, sendPasswordReset } = require('./authController');
// const verifyToken = require('./middleware/verifyToken');

// const app = express();
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));

// // ✅ Public routes
// app.post('/register', registerUser);
// app.post('/forgot-password', sendPasswordReset);
// app.post('/google-login', googleLogin)

// // ✅ Multer setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const ext = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + uniqueSuffix + ext);
//   }
// });
// const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// // ✅ Protected upload route
// app.post('/upload-audio', verifyToken, upload.single('audio'), (req, res) => {
//   if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

//   const mp3Path = req.file.path;
//   const wavPath = mp3Path.replace(path.extname(mp3Path), '.wav');

//   console.log('🎙️ Received file:', mp3Path);

//   exec(`ffmpeg -y -i "${mp3Path}" "${wavPath}"`, (ffmpegErr) => {
//     if (ffmpegErr) {
//       console.error('❌ FFmpeg error:', ffmpegErr);
//       return res.status(500).json({ error: 'Audio conversion failed.' });
//     }
//     console.log('✅ FFmpeg conversion done.');

//     execFile('python', ['vosk_transcribe.py', wavPath], async (transErr, stdout) => {
//       if (transErr) {
//         console.error('❌ Transcription error:', transErr);
//         return res.status(500).json({ error: 'Transcription failed.' });
//       }

//       let transcript = '';
//       try {
//         transcript = JSON.parse(stdout).transcript || '';
//       } catch (e) {
//         console.error('❌ JSON parse error:', e);
//         return res.status(500).json({ error: 'Invalid transcription output.' });
//       }

//       try {
//         const result = await callGeminiAPI(transcript);
//         const summary = result.summary || 'No summary generated.';
//         const flashcards = result.flashcards?.length ? result.flashcards : [
//           { question: 'No flashcards generated.', answer: 'Not enough information.' }
//         ];
//         const conversationScript = result.conversationScript?.length
//           ? result.conversationScript
//           : [{ speaker: '', text: transcript }];

//         const cloudinaryResult = await cloudinary.uploader.upload(mp3Path, {
//           resource_type: 'auto'
//         });
//         console.log('✅ Cloudinary uploaded:', cloudinaryResult.secure_url);

//         await db
//           .collection('users')
//           .doc(req.user.uid)
//           .collection('transcripts')
//           .add({
//             audioUrl: cloudinaryResult.secure_url,
//             transcript,
//             summary,
//             conversationScript,
//             flashcards,
//             createdAt: new Date()
//           });
//         console.log('✅ Saved to Firestore.');

//         return res.json({
//           message: 'Audio processed & saved!',
//           transcript,
//           summary,
//           conversationScript,
//           flashcards,
//           audioUrl: cloudinaryResult.secure_url
//         });

//       } catch (apiErr) {
//         console.error('❌ Gemini API error:', apiErr);
//         return res.status(500).json({ error: 'Gemini summarization failed.' });
//       }
//     });
//   });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));



// index.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec, execFile } = require('child_process');
const callGeminiAPI = require('./callGeminiAPI');
const cloudinary = require('./cloudinary');
const { admin, db } = require('./firebase');
const { registerUser, googleLogin, sendPasswordReset } = require('./authController');
const verifyToken = require('./middleware/verifyToken');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Public routes
app.post('/register', registerUser);
app.post('/forgot-password', sendPasswordReset);
app.post('/google-login', googleLogin);

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ✅ Protected upload route — NOW SAVES `title` TOO
app.post('/upload-audio', verifyToken, upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

  const mp3Path = req.file.path;
  const wavPath = mp3Path.replace(path.extname(mp3Path), '.wav');

  console.log('🎙️ Received file:', mp3Path);

  exec(`ffmpeg -y -i "${mp3Path}" "${wavPath}"`, (ffmpegErr) => {
    if (ffmpegErr) {
      console.error('❌ FFmpeg error:', ffmpegErr);
      return res.status(500).json({ error: 'Audio conversion failed.' });
    }
    console.log('✅ FFmpeg conversion done.');

    execFile('python', ['vosk_transcribe.py', wavPath], async (transErr, stdout) => {
      if (transErr) {
        console.error('❌ Transcription error:', transErr);
        return res.status(500).json({ error: 'Transcription failed.' });
      }

      let transcript = '';
      try {
        transcript = JSON.parse(stdout).transcript || '';
      } catch (e) {
        console.error('❌ JSON parse error:', e);
        return res.status(500).json({ error: 'Invalid transcription output.' });
      }

      try {
        const result = await callGeminiAPI(transcript);
        const title = result.title || 'Untitled';
        const summary = result.summary || 'No summary generated.';
        const flashcards = result.flashcards?.length ? result.flashcards : [
          { question: 'No flashcards generated.', answer: 'Not enough information.' }
        ];
        const conversationScript = result.conversationScript?.length
          ? result.conversationScript
          : [{ speaker: '', text: transcript }];

        const cloudinaryResult = await cloudinary.uploader.upload(mp3Path, {
          resource_type: 'auto'
        });
        console.log('✅ Cloudinary uploaded:', cloudinaryResult.secure_url);

        await db
          .collection('users')
          .doc(req.user.uid)
          .collection('transcripts')
          .add({
            title,
            audioUrl: cloudinaryResult.secure_url,
            transcript,
            summary,
            conversationScript,
            flashcards,
            createdAt: new Date()
          });
        console.log('✅ Saved to Firestore.');

        return res.json({
          message: 'Audio processed & saved!',
          title,
          transcript,
          summary,
          conversationScript,
          flashcards,
          audioUrl: cloudinaryResult.secure_url
        });

      } catch (apiErr) {
        console.error('❌ Gemini API error:', apiErr);
        return res.status(500).json({ error: 'Gemini summarization failed.' });
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
