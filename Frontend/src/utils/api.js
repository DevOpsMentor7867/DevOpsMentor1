import axios from "axios"

// Create a reusable axios instance with common configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to automatically add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if needed
      localStorage.removeItem("authToken")
      // You could also dispatch a logout action here if needed
      // window.location.href = '/login';
    }
    return Promise.reject(error)
  },
)

export default api
