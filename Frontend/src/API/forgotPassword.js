import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true
});

export const ForgotPassword = () => {
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/user/forgot-password', { email });
      
      if (response.status === 200) {
        return {
          success: true,
          message: 'Password reset link sent to your email'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to send reset link'
      };
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        switch (error.response.data.code) {
          case 'USER_NOT_FOUND':
            errorMessage = 'No account found with this email address';
            break;
          case 'FORGOT_PASSWORD_ERROR':
            errorMessage = 'Failed to process password reset request';
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

  return { forgotPassword };
};