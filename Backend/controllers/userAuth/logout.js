const { logout_queue } = require('./authQueues');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const redisClientPool = require('../../redis/redis-server');

logout_queue.process(async (job) => {
  let redisClient = await redisClientPool.borrowClient();
  const { sessionId, email } = job.data;
  try {
    console.log(`Debug: Starting logout process for email: ${email}`);
    const sessionKey = `session:${sessionId}`;
    const sessionData = await redisClient.get(sessionKey);
    if (!sessionData) {
      console.log(`Debug: Session not found for logout: ${sessionId}`);
      return { success: false, message: 'Session not found', code: 'SESSION_NOT_FOUND' };
    }

    await redisClient.del(sessionKey);
    
    console.log(`Debug: Logout successful for email: ${email}`);
    return { success: true, message: 'Logout successful', code: 'LOGOUT_SUCCESS' };
  } catch (error) {
    console.error(`Error in logout queue process: ${error.message}`);
    return { success: false, message: 'Logout failed', error: error.message, code: 'LOGOUT_ERROR' };
  } finally {
    if (redisClient) {
      await redisClientPool.returnClient(redisClient);
    }
  }
});

const logout = async (req, res) => {
  try {
    const token = req.cookies.session;
    if (!token) {
      return res.status(400).json({ message: 'No session found', code: 'NO_SESSION' });
    }

    let sessionId, email;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      sessionId = decoded.sessionId;
      email = decoded.email;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
    }

    const job = await logout_queue.add({ sessionId, email }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    const result = await job.finished();

    if (result.success) {
      res.clearCookie('session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.setHeader('Clear-Site-Data', '"cookies", "storage"');

      res.status(200).json({ message: result.message, code: result.code });
    } else {
      res.status(500).json({ message: 'Logout failed', code: result.code });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message, code: 'SYSTEM_ERROR' });
  }
};

module.exports = { logout };

