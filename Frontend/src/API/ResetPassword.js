import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true
});

export const ResetPassword = () => {
  const resetPassword = async (token, newPassword) => {
    console.log("Fe token",token )
    try {
      const response = await api.post('/user/reset-password', { 
        token, 
        newPassword 
      });
      
      if (response.status === 200) {
        return {
          success: true,
          message: 'Password reset successfully'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to reset password'
      };
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        switch (error.response.data.code) {
          case 'INVALID_RESET_TOKEN':
            errorMessage = 'Invalid or expired reset link';
            break;
          case 'EXPIRED_RESET_TOKEN':
            errorMessage = 'This reset link has expired';
            break;
          case 'USER_NOT_FOUND':
            errorMessage = 'User account not found';
            break;
          case 'PASSWORD_RESET_ERROR':
            errorMessage = 'Failed to reset password';
            break;
          default:
            errorMessage = error.response.data.message || errorMessage;
        }
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  return { resetPassword };
};