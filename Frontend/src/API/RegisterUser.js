import { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

export const RegisterUser = () => {
  const [RegisterError, setError] = useState(null);
  const [RegisterCheck, setRegCheck] = useState(null);
  const [timerReset, setTimerReset] = useState(true);

  const signup = async (email, password) => {
    setError(null);
    setRegCheck(null);

    try {
      const response = await api.post("/user/register", { email, password });

      if (response.status >= 200 && response.status < 300) {

        console.log("Register User Successful", response.data);
        if (response.status === 209) {
          setRegCheck(response.data);
        }
        console.log("RDM", response.data.message)
        if(response.data.message ==="Registration already in progress. Please check your email for OTP or try again later" ) {
          setTimerReset(false);
        }
      } else {
        setError("Failed to register user.");
        console.error("Register User Failed", response.data);
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        setError("An error occurred during registration.");
      }
      console.error("Register User Error:", error);
    }
  };

  return { signup, RegisterError, RegisterCheck, timerReset };
};
