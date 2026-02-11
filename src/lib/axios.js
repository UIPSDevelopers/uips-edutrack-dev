import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// 🔑 Storage keys (so it's consistent everywhere)
const TOKEN_KEY = "token";
const USER_KEY = "user";

// ✅ Create Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach token if it exists
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle expired/unauthorized token globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // No response at all = network / server down
    if (!error.response) {
      console.error("Network or server error:", error.message);
      // here you could trigger a toast if you have a global handler
      return Promise.reject(error);
    }

    if (status === 401) {
      const message =
        error.response.data?.message || "Session expired. Please log in again.";

      // Clear auth info
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // Optional: pass reason/message to login via query string
      const params = new URLSearchParams({
        reason: "session_expired",
        msg: message,
      });

      window.location.href = `/?${params.toString()}`; // change to "/" if your login route is "/"
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
