const { admin, db } = require('./firebase');
const { sendPasswordResetEmail } = require('./mailService');

//
// ✅ REGISTER WITH EMAIL & PASSWORD
//
async function registerUser(req, res) {
  const { name, email, password, phone, profileImage } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Name, email, password, phone required.' });
  }

  try {
    // Check if user already exists
    let existingUser;
    try {
      existingUser = await admin.auth().getUserByEmail(email);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // ✅ Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone,
      photoURL: profileImage || '', // If you want, Firebase Auth me bhi add ho sakta hai
    });

    // ✅ Firestore: store user data
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      await userDocRef.set({
        name,
        email,
        phone,
        profileImage: profileImage || '', // ✅ New field added
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json({
      message: 'User registered!',
      uid: userRecord.uid,
      email
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Register failed: ' + err.message });
  }
}

//
// ✅ GOOGLE LOGIN HANDLER
//
async function googleLogin(req, res) {
  const { idToken } = req.body;

  if (!idToken) return res.status(400).json({ error: 'ID token required.' });

  try {
    // ✅ Verify ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      await userDocRef.set({
        name: name || '',
        email: email || '',
        profileImage: picture || '', // ✅ New field added for Google photo
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ message: 'Google login successful', uid });

  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ error: 'Google login failed: ' + err.message });
  }
}

//
// ✅ PASSWORD RESET
//
async function sendPasswordReset(req, res) {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email required.' });

  try {
    const resetLink = await admin.auth().generatePasswordResetLink(email);
    await sendPasswordResetEmail(email, resetLink);

    res.json({ message: 'Password reset link sent to email.' });

  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Reset failed: ' + err.message });
  }
}

module.exports = {
  registerUser,
  googleLogin,
  sendPasswordReset,
};
