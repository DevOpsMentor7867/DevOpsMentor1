const { registration_queue, verification_queue, login_queue, logout_queue } = require('./authQueues');
const { deleteUser } = require('./delete-user');
const { login } = require('./login');
const { logout } = require('./logout');
const { forgotPassword, resetPassword } = require('./password-reset');
const { register } = require('./register');
const { setUserInformation } = require('./user-info');
const { verifyOtp } = require('./verify-otp');

// Simple utility functions can be defined here
const welcomeMessage = (req, res) => {
  try {
    res.status(200).json({ message: 'Welcome', code: 'WELCOME' });
  } catch (error) {
    console.error('Error in welcomeMessage:', error);
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message || 'Unknown error',
      code: 'SYSTEM_ERROR'
    });
  }
};

const checkAuthentication = async (req, res) => {
  try {
    res.status(200).json({
      user: req.user
    });
  } catch (error) {
    console.error('Error in checkAuthentication:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Export everything as a single object
module.exports = {
  // Auth queues
  registration_queue,
  verification_queue,
  login_queue,
  logout_queue,
  
  // Auth controllers
  deleteUser,
  login,
  logout,
  forgotPassword,
  resetPassword,
  register,
  setUserInformation,
  verifyOtp,
  
  // Utility functions
  welcomeMessage,
  checkAuthentication
};

