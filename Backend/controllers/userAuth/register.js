const { registration_queue } = require('./authQueues');
const User = require('../../models/userModel');
const { sendOtpEmail, generateOtp } = require('../../email/send-otp');
const redisClientPool = require('../../redis/redis-server');
const bcrypt = require('bcrypt');

// Registration queue process
registration_queue.process(async (job) => {
  const { email, password, username, gender } = job.data;
  let redisClient = await redisClientPool.borrowClient();
  try {
    console.log(`Debug: Starting registration process for email: ${email}`);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`Debug: User already exists for email: ${email}`);
      return { 
        success: false, 
        message: 'An account with this email already exists. Please login or register with a different email.',
        code: 'ALREADY_REGISTERED'
      };
    }

    const otp = generateOtp();
    console.log(`Debug: Generated OTP for ${email}: ${otp}`);

    const registrationKey = `registration:${email}`;
    let retries = 5;
    while (retries > 0) {
      await redisClient.watch(registrationKey);
      const registrationExists = await redisClient.get(registrationKey);

      if (registrationExists) {
        await redisClient.unwatch();
        console.log(`Debug: Registration already in progress for ${email}`);
        return { 
          success: false, 
          message: 'Registration already in progress. Please check your email for OTP or try again later.',
          code: 'REGISTRATION_IN_PROGRESS'
        };
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      console.log(`Debug: Storing hashed password for OTP verification: ${hashedPassword.substring(0, 10)}...`);

      const multi = redisClient.multi();
      multi.set(registrationKey, JSON.stringify({ 
        name: '*', // Default name value
        password: hashedPassword, 
        otp,
        username: username || email.split('@')[0], // User provided username or default to email prefix
        gender: gender || '*' // User provided gender or default to '*'
      }), {
        EX: parseInt(process.env.OTP_EXPIRY) || 300 // Default to 5 minutes
      });
      const results = await multi.exec();

      if (results) {
        console.log(`Debug: Registration data set successfully for ${email}`);
        break;
      } else {
        console.log(`Debug: Race condition detected for ${email}, retrying...`);
        retries--;
        if (retries === 0) {
          return { 
            success: false, 
            message: 'Registration failed due to a conflict. Please try again.',
            code: 'REGISTRATION_CONFLICT'
          };
        }
      }
    }
    
    try {
      await sendOtpEmail(email, otp);
      console.log(`Debug: OTP sent to ${email}`);
    } catch (emailError) {
      console.error(`Error sending OTP email: ${emailError.message}`);
      throw emailError;
    }
    
    return { 
      success: true, 
      message: 'OTP sent to email. Please verify within 2 minutes.',
      code: 'OTP_SENT'
    };

  } catch (error) {
    console.error(`Error in registration queue process: ${error.message}`);
    return { 
      success: false, 
      message: 'Registration failed',
      error: error.message,
      code: 'REGISTRATION_ERROR' 
    };
  } finally {
    if (redisClient) {
      await redisClientPool.returnClient(redisClient);
    }
  }
});

// Controller functions
const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Attempting to register user: ${email}`);

    const job = await registration_queue.add(
      { email, password },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );

    const result = await job.finished();
    console.log(`Registration job completed result: ${JSON.stringify(result)}`);

    if (result.success) {
      res.status(200).json(result);
    } else {
      const statusCodes = {
        ALREADY_REGISTERED: 400,
        REGISTRATION_IN_PROGRESS: 209,
        REGISTRATION_ERROR: 500,
        INVALID_PASSWORD_FORMAT: 400,
        REGISTRATION_CONFLICT: 409,
      };
      const statusCode = statusCodes[result.code] || 400;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
      code: "SYSTEM_ERROR",
    });
  }
};

module.exports = { register };

