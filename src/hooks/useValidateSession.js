import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";

export function useValidateSession() {
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    async function validateSession() {
      const token = localStorage.getItem("token");

      // No token = not logged in, skip validation
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        // Call a protected endpoint to verify session is still valid on backend
        // This endpoint should return 401 if token is expired/invalid
        await axiosInstance.get("/me");
        setIsValidating(false);
      } catch (error) {
        // 401 = token expired, axios interceptor will handle cleanup & redirect
        // Other errors = network issue, clear storage and redirect to be safe
        if (error.response?.status !== 401) {
          console.error("Session validation failed:", error?.message);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/?reason=session_invalid";
        }
        setIsValidating(false);
      }
    }

    validateSession();
  }, []);

  return { isValidating };
}
