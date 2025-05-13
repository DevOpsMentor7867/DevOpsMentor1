const nodemailer = require('nodemailer');
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send OTP email
const sendOtpEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Registration OTP',
      text: `Your OTP is ${otp}. It will expire in 2 minutes.`
    });
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    throw error;
  }
};

// Function to send reset password email
const sendResetPasswordEmail = async (email, resetUrl) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You have requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `
    });
    console.log(`Reset password email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send reset password email to ${email}:`, error);
    throw error;
  }
};

// OTP generation
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};



module.exports = { sendOtpEmail, sendResetPasswordEmail,generateOtp };

