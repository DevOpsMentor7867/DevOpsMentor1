import axios from "axios";
import { useAuthContext } from "../API/UseAuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true, // Ensure cookies are sent with requests
});

export const LoginUser = () => {
  const { dispatch } = useAuthContext();
  const [loginError, setError] = useState(null);
  const navigate = useNavigate();

  const login = async (email, password) => {
    setError(null); // Reset the error state before attempting login

    try {
      // Sending POST request to backend for login
      const response = await api.post("/user/login", { email, password });

      if (response.status >= 200 && response.status < 300) {
        console.log(response);

        // Assuming backend returns a token as part of response
        const { token, user } = response.data; 

        // Save token in localStorage (or sessionStorage)
        if (token) {
          localStorage.setItem("token", token); // Store token for future requests
          console.log("Token saved:", token);
        }

       dispatch({
    type: "LOGIN",
    payload: {
      user,
      token,
    },
  });

        // Navigate the user to the dashboard
        navigate("/Dashboard");
      } else {
        // Handle case when status code is not in the 200-299 range
        setError(response.data.message || "An error occurred during login.");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        // Handle known error message from the backend
        setError(error.response.data.message);
      } else {
        // Handle unexpected errors
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Login User Error:", error);
    }
  };

  return { login, loginError };
};
