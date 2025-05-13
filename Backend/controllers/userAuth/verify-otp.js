const { verification_queue } = require('./authQueues');
const User = require('../../models/userModel');
const redisClientPool = require('../../redis/redis-server');
require('dotenv').config();

verification_queue.process(async (job) => {
  const { email, otp } = job.data;
  let redisClient = await redisClientPool.borrowClient();
  try {
    console.log(`Debug: Starting OTP verification for email: ${email}`);
    const stored_key = `registration:${email}`;
    const stored_data = await redisClient.get(stored_key);
    
    if (!stored_data) {
      console.log(`Debug: No stored data found for email: ${email}`);
      return { 
        success: false, 
        message: 'OTP has expired or is invalid. Please request a new OTP.',
        code: 'INVALID_OTP'
      };
    }

    const { name, password: storedHashedPassword, otp: storedOTP, username, gender } = JSON.parse(stored_data);
    
    if (otp !== storedOTP) {
      console.log(`Debug: Incorrect OTP for email: ${email}`);
      return { 
        success: false, 
        message: 'Incorrect OTP. Please try again.',
        code: 'WRONG_OTP'
      };
    }

    try {
      const existingUser = await User.findOne({ email }).select('+password');
      if (existingUser) {
        console.log(`Debug: User already exists for email: ${email}`);
        await redisClient.del(stored_key);
        return { 
          success: false, 
          message: 'An account with this email already exists. Please login or register with a different email.',
          code: 'ALREADY_REGISTERED'
        };
      }

      const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
      const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;
      const defaultProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;
      
      const newUser = new User({ 
        name,
        email,
        password: storedHashedPassword,
        username: username || email.split('@')[0],
        gender: gender || '*',
        ProfilePic: gender === 'male' ? boyProfilePic : (gender === 'female' ? girlProfilePic : defaultProfilePic)
      });
      console.log(`Debug: Decided ProfilePic for ${email}: ${newUser.ProfilePic}`);
      await newUser.save();
      console.log(`Debug: User saved successfully for email: ${email}`);
     
      await redisClient.del(stored_key);
      return { 
        success: true, 
        message: 'Registration completed successfully. You can now login.',
        code: 'SUCCESS'
      };
    } catch (error) {
      console.error(`Error saving user: ${error.message}`);
      if (error.code === 11000) {
        console.log(`Debug: Duplicate key error for email: ${email}`);
        await redisClient.del(stored_key);
        return { 
          success: false, 
          message: 'An account with this email already exists. Please login or register with a different email.',
          code: 'ALREADY_REGISTERED'
        };
      }
      return { 
        success: false, 
        message: 'An error occurred during registration. Please try again.',
        code: 'SAVE_ERROR',
        error: error.message 
      };
    }
  } catch (error) {
    console.error(`Error in verification queue process: ${error.message}`);
    return { 
      success: false, 
      message: 'Verification failed due to a system error. Please try again.',
      code: 'SYSTEM_ERROR',
      error: error.message 
    };
  } finally {
    if (redisClient) {
      await redisClientPool.returnClient(redisClient);
    }
  }
});

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const job = await verification_queue.add({ email, otp }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    const result = await job.finished();
    
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      const statusCodes = {
        'ALREADY_REGISTERED': 400,
        'INVALID_OTP': 400,
        'WRONG_OTP': 400,
        'SAVE_ERROR': 500,
        'SYSTEM_ERROR': 500
      };
      const statusCode = statusCodes[result.code] || 400;
      res.status(statusCode).json({ 
        message: result.message,
        code: result.code 
      });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      message: 'OTP verification failed', 
      error: error.message,
      code: 'SYSTEM_ERROR'
    });
  }
};

module.exports = { verifyOtp };

