const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userChatBotController = require("../controllers/chatbot");
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

router.get('/conversation', authMiddleware, asyncHandler(userChatBotController.getConversationHistory));
router.post('/chat', authMiddleware, [
  body('message').notEmpty().withMessage('Message cannot be empty')
], asyncHandler(userChatBotController.chat));

module.exports = router;

