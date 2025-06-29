// // middleware/verifyToken.js
// const { admin } = require('../firebase');  // firebase ka admin instance import karo

// async function verifyToken(req, res, next) {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.indexOf('Bearer ') !== 0) {
//       return res.status(401).json({ error: 'No token provided' });
//     }

//     const idToken = authHeader.split(' ')[1];

//     const decodedToken = await admin.auth().verifyIdToken(idToken);

//     req.user = decodedToken;  // user info attach ho gayi

//     next();  // agla middleware ya route handler chalao
//   } catch (error) {
//     console.error('Token verification failed:', error);
//     res.status(401).json({ error: 'Unauthorized, invalid token' });
//   }
// }

// module.exports = verifyToken;



const { admin } = require('../firebase');

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    console.log('AUTH HEADER:', authHeader); // Debug karo

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const idToken = authHeader.split(' ')[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Unauthorized, invalid token' });
  }
}

module.exports = verifyToken;
