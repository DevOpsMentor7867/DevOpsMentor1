"use client";

import { createContext, useReducer, useEffect, useContext } from "react";
import axios from "axios";

// Create Axios instance for API calls
const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create AuthContext
export const AuthContext = createContext();

// AuthReducer to handle login, logout, and token management
export const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      if (action.payload.token) {
        localStorage.setItem("token", action.payload.token);
        api.defaults.headers.common["Authorization"] = `Bearer ${action.payload.token}`;
      }
      return {
        ...state,
        user: action.payload.user || action.payload,
        token: action.payload.token || null,
        loading: false,
      };
    case "LOGOUT":
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
      };
    case "UPDATE_USER":
       if (action.payload.token) {
         localStorage.setItem("authToken", action.payload.token);
         api.defaults.headers.common["Authorization"] = `Bearer ${action.payload.token}`;
        }
       return {
        ...state,
       user: { ...state.user, ...action.payload.user },
       token: action.payload.token || state.token,
  };

    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

// AuthContextProvider wraps the application and provides auth context globally
export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem("token"), // Get token from localStorage
    loading: true,
  });

  // Set Authorization header if token exists in state or localStorage
  useEffect(() => {
    const token = localStorage.getItem("token"); // Get token from localStorage on initial load
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      dispatch({
        type: "LOGIN",
        payload: { token, user: null }, // Set token and dispatch the LOGIN action
      });
    }
  }, []);

  // Check authentication status on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("*********** auth context", token)
        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        const response = await api.post("/user/auth");
        if (response.status === 200) {
          dispatch({
            type: "LOGIN",
            payload: {
              user: response.data.user,
              token: response.data.token || token, // Use token from response or localStorage
            },
          });
        }
      } catch (error) {
        console.error("Authentication error:", error.response?.data || error.message);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
        }
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkAuthStatus();
  }, []);
  console.log("AuthContext state:", state);

  return <AuthContext.Provider value={{ ...state, dispatch }}>{children}</AuthContext.Provider>;
};

// useAuthContext hook to access the auth context easily
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthContextProvider");
  }
  return context;
};
