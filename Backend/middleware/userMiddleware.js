const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const redisClientPool = require("../redis/redis-server");
const User = require("../models/userModel");

const authMiddleware = async (req, res, next) => {
  let redisClient;
  try {
    // Get token from Authorization header
    const token = 
      req.cookies.session || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        code: "NO_TOKEN",
      });
    }

    // Verify JWT token first
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
    }

    // Extract session and user info from token
    const { sessionId, email } = decoded;
    
    // Get Redis client
    redisClient = await redisClientPool.borrowClient();

    // Check session in Redis
    const sessionKey = `session:${sessionId}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      return res.status(401).json({
        success: false,
        message: "Session expired",
        code: "SESSION_EXPIRED",
      });
    }

    // Parse session data
    const session = JSON.parse(sessionData);

    // Verify session email matches token email
    if (session.email !== email) {
      return res.status(401).json({
        success: false,
        message: "Session user mismatch",
        code: "SESSION_USER_MISMATCH",
      });
    }

    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Attach user and session info to request
    req.user = user;
    req.session = session;

    // Check if the route is for sending a message
    if (req.path.startsWith('/user/sendMessage/')) {
      const recipientId = req.params.recipientId;

      // Validate recipientId format
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid recipient ID format'
        });
      }

      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Recipient not found'
        });
      }

      // Prevent sending message to self
      if (recipientId === user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot send message to yourself'
        });
      }

      // Attach recipient to request object for use in the controller
      req.recipient = recipient;
    }

    // Proceed to next middleware
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      code: "AUTH_ERROR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    if (redisClient) {
      await redisClientPool.returnClient(redisClient);
    }
  }
};

module.exports = authMiddleware;

