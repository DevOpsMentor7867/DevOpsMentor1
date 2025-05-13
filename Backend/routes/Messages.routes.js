const express = require('express');
const router = express.Router();
const userMessageController = require("../controllers/Message");
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

// These routes are currently commented out, but I'm including them for future use
router.post('/sendMessage/:recipientId', authMiddleware, asyncHandler(userMessageController.sendMessage));
router.get('/conversation/:id', authMiddleware, asyncHandler(userMessageController.getConversation));

module.exports = router;

