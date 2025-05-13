const { forgot_password_queue, reset_password_queue } = require('./authQueues');
const User = require('../../models/userModel');
const redisClientPool = require('../../redis/redis-server');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendResetPasswordEmail } = require('../../email/send-otp');

forgot_password_queue.process(async (job) => {
  const { email } = job.data;
  let redisClient;
  try {
    console.log(`Debug: Processing forgot password for: ${email}`);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`Debug: User not found for email: ${email}`);
      return { 
        success: false, 
        message: 'User not found', 
        code: 'USER_NOT_FOUND' 
      };
    }

    redisClient = await redisClientPool.borrowClient();

    // Generate a unique token
    const timestamp = Date.now();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 12);

    // Create Redis key with email and timestamp
    const redisKey = `resetToken:${email}:${timestamp}`;
    
    // Store token data
    const tokenData = {
      userId: user._id.toString(),
      email: user.email,
      hashedToken,
      expires: timestamp + 120000, 
      created: timestamp
    };

    // Set the token in Redis with proper structure
    await redisClient.set(redisKey, JSON.stringify(tokenData), 'EX', 3600);

    // Debug: Verify the key structure
    console.log(`Debug: Stored reset token with key structure:`, redisKey);
    
    // Clean up old tokens for this email
    const oldTokens = await redisClient.keys(`resetToken:${email}:*`);
    console.log(`Debug: Found ${oldTokens.length} existing tokens for ${email}`);
    
    for (const key of oldTokens) {
      if (key !== redisKey) {
        console.log(`Debug: Cleaning up old token:`, key);
        await redisClient.del(key);
      }
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendResetPasswordEmail(user.email, resetUrl);

    // Debug: Show current tokens
    const currentTokens = await redisClient.keys(`resetToken:${email}:*`);
    console.log(`Debug: Current tokens for ${email}:`, currentTokens);

    return { 
      success: true, 
      message: 'Password reset email sent reset your password within 2 minutes', 
      code: 'RESET_EMAIL_SENT',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      debug: {
        tokenKey: redisKey,
        currentTokens
      }
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return { 
      success: false, 
      message: 'Failed to process forgot password request', 
      error: error.message, 
      code: 'FORGOT_PASSWORD_ERROR' 
    };
  } finally {
    if (redisClient) {
      await redisClientPool.returnClient(redisClient);
    }
  }
});

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`Debug: Processing forgot password for: ${email}`);
    
    const job = await forgot_password_queue.add({ email });
    const result = await job.finished();

    if (result.success) {
      res.status(200).json({ 
        message: result.message, 
        code: result.code,
        resetToken: result.resetToken
      });
    } else {
      res.status(400).json({ 
        message: result.message, 
        code: result.code 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process forgot password request', error: error.message, code: 'FORGOT_PASSWORD_ERROR' });
  }
};

reset_password_queue.process(async (job) => {
  const { token, newPassword } = job.data;
  let redisClient;
  try {
    console.log(`Debug: Attempting to reset password for token: ${token.substring(0, 10)}...`);

    redisClient = await redisClientPool.borrowClient();
    
    const resetTokens = await redisClient.keys('resetToken:*');
    let resetData = null;
    let matchedTokenKey = null;

    for (const tokenKey of resetTokens) {
      const data = await redisClient.get(tokenKey);
      if (data) {
        const parsedData = JSON.parse(data);
        if (parsedData.hashedToken && await bcrypt.compare(token, parsedData.hashedToken)) {
          resetData = parsedData;
          matchedTokenKey = tokenKey;
          break;
        }
      }
    }

    if (!resetData) {
      console.log('Debug: No matching reset token found');
      return { 
        success: false, 
        message: 'Invalid or expired reset token', 
        code: 'INVALID_RESET_TOKEN' 
      };
    }

    const { userId, email, expires } = resetData;

    if (Date.now() > expires) {
      await redisClient.del(matchedTokenKey);
      console.log(`Debug: Token expired for email: ${email}`);
      return { 
        success: false, 
        message: 'Reset token has expired', 
        code: 'EXPIRED_RESET_TOKEN' 
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log(`Debug: User not found for userId: ${userId}`);
      return { 
        success: false, 
        message: 'User not found', 
        code: 'USER_NOT_FOUND' 
      };
    }

    user.password = await bcrypt.hash(newPassword.trim(), 12);
    await user.save();

    // Delete the used token
    await redisClient.del(matchedTokenKey);

    // Clean up any other reset tokens for this user
    const otherTokens = resetTokens.filter(t => t !== matchedTokenKey);
    for (const key of otherTokens) {
      const data = await redisClient.get(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.email === email) {
          await redisClient.del(key);
          console.log(`Cleaned up additional reset token for email: ${email}`);
        }
      }
    }

    console.log(`Debug: Password reset successfully for email: ${email}`);
    return { 
      success: true, 
      message: 'Password reset successfully', 
      code: 'PASSWORD_RESET_SUCCESS' 
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      message: 'Password reset failed', 
      error: error.message, 
      code: 'PASSWORD_RESET_ERROR' 
    };
  } finally {
    if (redisClient) {
      await redisClientPool.returnClient(redisClient);
    }
  }
});

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log(`Debug: Attempting to reset password for token: ${token.substring(0, 10)}...`);

    const job = await reset_password_queue.add({ token, newPassword });
    const result = await job.finished();

    if (result.success) {
      res.status(200).json({ 
        message: result.message, 
        code: result.code 
      });
    } else {
      res.status(400).json({ 
        message: result.message, 
        code: result.code 
      });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: 'Password reset failed', 
      error: error.message, 
      code: 'PASSWORD_RESET_ERROR' 
    });
  }
};

module.exports = { forgotPassword, resetPassword };

