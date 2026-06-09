import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://uips-edutrack-backend-dev.onrender.com/api";


const TOKEN_KEY = "token";
const USER_KEY = "user";
const TOKEN_EXPIRES_AT_KEY = "tokenExpiresAt";


const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);

    
    if (token && expiresAt && Date.now() > parseInt(expiresAt)) {
      
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
      
      
      const params = new URLSearchParams({
        reason: "session_expired",
        msg: "Your session has expired. Please log in again.",
      });
      window.location.href = `/?${params.toString()}`;
      return config;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    
    if (!error.response) {
      console.error("Network or server error:", error.message);
      return Promise.reject(error);
    }

    if (status === 401) {
      const message =
        error.response.data?.message || "Session expired. Please log in again.";

      
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);

      
      const params = new URLSearchParams({
        reason: "session_expired",
        msg: message,
      });

      window.location.href = `/?${params.toString()}`;
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
