const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userAuth = require("../controllers/userAuth");
const userInfo = require("../controllers/userAuth/user-info")
const authMiddleware = require('../middleware/userMiddleware');

const asyncHandler = fn => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

router.post('/register', asyncHandler(userAuth.register));
router.post('/verify', asyncHandler(userAuth.verifyOtp));
router.post('/login', asyncHandler(userAuth.login));
router.post('/logout', authMiddleware, asyncHandler(userAuth.logout));
router.post('/auth', authMiddleware, asyncHandler(userAuth.checkAuthentication));
router.post('/forgot-password', asyncHandler(userAuth.forgotPassword));
router.post('/reset-password', asyncHandler(userAuth.resetPassword));
router.post('/delete-user', authMiddleware, asyncHandler(userAuth.deleteUser));
router.post('/SetUserInformation', authMiddleware, asyncHandler(userInfo.SetUserInformation));

router.get('/verify-passwords', asyncHandler(async (req, res) => {
  await userAuth.verifyStoredPasswords();
  res.status(200).json({ message: 'Password verification complete. Check server logs.' });
}));

module.exports = router;

