import { useState } from "react";
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true 
});

export const VerifyOTP = () => {
  const [verifyOtpError, setError] = useState(null);

  const PostSignup = async (email, otp) => {
    setError(null);  
    console.log("FE otp", email, otp);

    try {
      const response = await api.post('/user/verify', { email, otp });

      if (response.status >= 200 && response.status < 300) {
        console.log("Signup successful", response.data.message);
        return { success: response.data.message, error: null };
      } else {
        setError(response.data.message); 
        console.error("Signup failed", response.data);
        return { success: null, error: response.data.message };
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message); 
        console.error("Error:", error.response.data.message);
        return { success: null, error: error.response.data.message };
      } else {
        setError("An unexpected error occurred");
        console.error("Error:", error);
        return { success: null, error: "An unexpected error occurred" };
      }
    }
  };

  return { PostSignup, verifyOtpError };  
};
