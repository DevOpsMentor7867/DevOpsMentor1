const Message = require('../models/Messagedb');
const Conversation = require('../models/conversation');
require('dotenv').config();



exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const senderId = req.user._id;
    const recipientId = req.params.recipientId;

    // Create a new message
    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      content: content
    });

    // Find or create a conversation between the sender and recipient
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        messages: []
      });
    }

    // Add the new message to the conversation
    conversation.messages.push(newMessage._id);
    
    // Parallel message and conversation saving
    await Promise.all([conversation.save(), newMessage.save()]);

    // Send the response
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: newMessage._id,
        sender: senderId,
        recipient: recipientId,
        content: content,
        timestamp: newMessage.createdAt,
        conversationId: conversation._id
      }
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.id; // ID of the user we're chatting with
    const currentUserId = req.user._id; // ID of the authenticated user

    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] },
    }).populate('messages');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.status(200).json({
      success: true,
      data: conversation.messages
    });
  } catch (error) {
    console.error('Error in getConversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation',
      error: error.message
    });
  }
};

