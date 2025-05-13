const { login_queue } = require('./authQueues');
const User = require('../../models/userModel');
const jwt = require('jsonwebtoken');
const redisClientPool = require('../../redis/redis-server');
const crypto = require('crypto');
require('dotenv').config();


login_queue.process(async (job) => {
  const { email, password, userAgent } = job.data;
  let redisClient = await redisClientPool.borrowClient();
  try {
    console.log(`Debug: Starting login process for email: ${email}`);
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`Debug: User not found for email: ${email}`);
      return { 
        success: false, 
        message: 'Invalid email or password', 
        code: 'INVALID_CREDENTIALS' 
      };
    }

    console.log(`Debug: Found user password hash: ${user.password.substring(0, 10)}...`);
    
    const trimmedPassword = password.trim();
    const isMatch = await user.comparePassword(trimmedPassword);
    console.log(`Debug: Password comparison result: ${isMatch}`);
    
    if (!isMatch) {
      return { 
        success: false, 
        message: 'Invalid email or password', 
        code: 'INVALID_CREDENTIALS' 
      };
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionData = JSON.stringify({
      sessionId,
      userId: user._id,
      email: user.email,
      userAgent,
      createdAt: Date.now()
    });

    await redisClient.set(`session:${sessionId}`, sessionData, {
      EX: parseInt(process.env.SESSION_EXPIRY) || 86400
    });

    const token = jwt.sign(
      { sessionId, email }, 
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    return { 
      success: true, 
      message: 'Login successful',
      email: email,
      token: token
    };

  } catch (error) {
    console.error(`Debug: Login process error:`, error);
    return { 
      success: false, 
      message: 'Login failed', 
      error: error.message,
      code: 'LOGIN_ERROR' 
    };
  } finally {
    if (redisClient) {
      await redisClientPool.returnClient(redisClient);
    }
  }
});

const login = async (req, res) => {
  console.log("Request body in login:", req.body);
  try {
    const { email, password } = req.body;

    const job = await login_queue.add(
      {
        email,
        password,
        userAgent: req.headers["user-agent"],
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );

    const result = await job.finished();
    if (result.success) {
      res.cookie("session", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: parseInt(process.env.SESSION_EXPIRY) * 1000, // Ensure SESSION_EXPIRY is defined
      });
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }
      res.status(200).json({ user: user});
    } else {
      res.status(401).json({ message: result.message });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

module.exports = { login };

