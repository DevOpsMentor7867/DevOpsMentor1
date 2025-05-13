const OpenAI = require('openai');
const Message = require('../models/Messagedb');
const Conversation = require('../models/conversation');
require('dotenv').config();

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get conversation history
const getConversationHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    let conversation = await Conversation.findOne({ user: userId }).populate('messages');
    
    // If no conversation exists, create one
    if (!conversation) {
      console.log('Creating new conversation for user:', userId);
      conversation = new Conversation({ 
        user: userId, 
        messages: [] 
      });
      await conversation.save();
      if (conversation.messages.length === 0) {
        const welcomeMessage = new Message({
          content: "Hello! I am your DevOps mentor. How can I assist you today?",
          sender: 'AI_ASSISTANT',
          recipient: 'USER',
          userId: userId,
          timestamp: new Date()
        });
        await welcomeMessage.save();
        conversation.messages.push(welcomeMessage._id);
        await conversation.save();
      }
    }

    // Always return a success response with the conversation (empty or not)
    res.json({ 
      success: true, 
      conversation: await conversation.populate('messages')
    });

  } catch (error) {
    console.error('Error in conversation history:', {
      message: error.message,
      stack: error.stack,
      userId: req.user._id
    });
    res.status(500).json({ 
      success: false, 
      error: 'An error occurred while fetching the conversation.' 
    });
  }
};

// Post a new message and get AI response
const chat = async (req, res) => {
  try {
    console.log('Received chat request:', req.body);

    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
      console.error('Missing message in request body');
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({ user: userId });
    if (!conversation) {
      conversation = new Conversation({ user: userId, messages: [] });
      await conversation.save();
    }

    // Create user message
    const userMessage = new Message({
      content: message,
      sender: 'USER',
      recipient: 'AI_ASSISTANT',
      userId: userId,
      timestamp: new Date()
    });
    await userMessage.save();
    conversation.messages.push(userMessage._id);

    try {
      console.log('Sending request to OpenAI API...');
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a computer science and DevOps expert. Provide detailed and accurate answers to computer science-related questions and if someone ask for irrelevant question then reply please ask Questions related to Computer Science and DevOps."
          },
          { role: "user", content: message }
        ],
      });

      console.log('Received OpenAI response');
      const botResponse = completion.choices[0].message.content;

      // Create bot message
      const botMessage = new Message({
        content: botResponse,
        sender: 'AI_ASSISTANT',
        recipient: 'USER',
        userId: userId,
        timestamp: new Date()
      });
      await botMessage.save();
      conversation.messages.push(botMessage._id);

      // Save the updated conversation
      await conversation.save();

      return res.json({
        success: true,
        data: {
          userMessage: userMessage,
          botMessage: botMessage
        }
      });

    } catch (error) {
      console.error('OpenAI API Error Details:', {
        name: error.name,
        message: error.message,
        type: error.error?.type,
        status: error.status,
        stack: error.stack,
        fullError: JSON.stringify(error, null, 2)
      });

      let errorResponse;

      if (error.error?.type === 'insufficient_quota') {
        console.error('OpenAI API Quota Exceeded:', error);
        errorResponse = {
          status: 402,
          message: "I apologize, but I'm currently unable to process your request due to high demand. Please try again later.",
          code: 'insufficient_quota'
        };
      } else if (error.error?.type === 'rate_limit_exceeded') {
        console.error('OpenAI Rate Limit Exceeded:', error);
        errorResponse = {
          status: 429,
          message: 'Too many requests. Please try again later.',
          code: 'rate_limit_exceeded'
        };
      } else if (error.error?.type === 'invalid_request_error') {
        console.error('OpenAI Invalid Request:', error);
        errorResponse = {
          status: 401,
          message: 'Invalid API key or request.',
          code: 'invalid_request_error'
        };
      } else {
        errorResponse = {
          status: 500,
          message: 'An error occurred while processing your request with OpenAI.',
          code: error.error?.type || 'unknown_error'
        };
      }

      // Create error message
      const errorMessage = new Message({
        content: errorResponse.message,
        sender: 'AI_ASSISTANT',
        recipient: 'USER',
        userId: userId,
        timestamp: new Date()
      });
      await errorMessage.save();
      conversation.messages.push(errorMessage._id);
      await conversation.save();

      return res.status(errorResponse.status).json({
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
        data: {
          botMessage: errorMessage
        }
      });
    }

  } catch (error) {
    console.error('Unexpected Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      fullError: JSON.stringify(error, null, 2),
      userId: req.user._id,
      requestBody: req.body
    });

    res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred while processing your request.',
      code: 'general_error'
    });
  }
};

module.exports = {
  getConversationHistory,
  chat
};

console.log('Chatbot controller loaded successfully.');

