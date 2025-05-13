import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL || "http://localhost:8000/api",
  withCredentials: true,
});

// API function to fetch progress data
export const fetchProgressData = async () => {
  try {
    const response = await api.get("/analytics/progress");
    return response.data;
  } catch (error) {
    console.error("Error fetching progress data:", error);
    throw error;
  }
};
