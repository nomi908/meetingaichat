// // firebase.js
// const admin = require('firebase-admin');
// const serviceAccount = require('./firebase-key.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();

// module.exports = db;

// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };  // Export both admin and db
