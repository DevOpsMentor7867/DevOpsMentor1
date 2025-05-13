const User = require('../../models/userModel');
const redisClientPool = require('../../redis/redis-server');

const deleteUser = async (req, res) => {
  let redisClient;
  try {
    const { email, password } = req.body;
    console.log(`Debug: Attempting to delete user: ${email}`);

    // Find the user in MongoDB
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Authenticate the user
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        code: 'INVALID_PASSWORD'
      });
    }

    // Delete user from MongoDB
    await User.findOneAndDelete({ email });

    // Delete user-related data from Redis
    redisClient = await redisClientPool.borrowClient();
    const registrationKey = `registration:${email}`;
    await redisClient.del(registrationKey);

    // Find and delete any active sessions for this user
    const sessionPattern = `session:*`;
    const sessionKeys = await redisClient.keys(sessionPattern);
    for (const key of sessionKeys) {
      const sessionData = await redisClient.get(key);
      const session = JSON.parse(sessionData);
      if (session.email === email) {
        await redisClient.del(key);
      }
    }

    // Delete any reset tokens for this user
    const resetTokenPattern = `resetToken:${email}:*`;
    const resetTokenKeys = await redisClient.keys(resetTokenPattern);
    for (const key of resetTokenKeys) {
      await redisClient.del(key);
    }

    console.log(`Debug: User deleted successfully: ${email}`);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      code: 'USER_DELETED'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
      code: 'DELETE_USER_ERROR'
    });
  } finally {
    if (redisClient) {
      await redisClientPool.returnClient(redisClient);
    }
  }
};

module.exports = { deleteUser };

