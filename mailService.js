// mailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendPasswordResetEmail(to, resetLink) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Your Password Reset Link',
    html: `<p>Click the link below to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>`
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
