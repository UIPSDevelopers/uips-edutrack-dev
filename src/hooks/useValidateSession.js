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

      // Check if token has already expired (offline mode)
      const expiresAt = localStorage.getItem("tokenExpiresAt");
      if (expiresAt && Date.now() > parseInt(expiresAt)) {
        // Token is expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("tokenExpiresAt");
        window.location.href = "/?reason=session_expired&msg=Your%20session%20has%20expired.%20Please%20log%20in%20again.";
        return;
      }

      try {
        // Call a protected endpoint to verify session is still valid on backend
        // This endpoint should return 401 if token is expired/invalid
        await axiosInstance.get("/auth/me");
        setIsValidating(false);
      } catch (error) {
        const status = error.response?.status;

        // 401 = token expired on backend, clear and redirect
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("tokenExpiresAt");
          window.location.href = "/?reason=session_expired&msg=Your%20session%20has%20expired.%20Please%20log%20in%20again.";
        } else {
          // For other errors (network issues, endpoint not found, etc)
          // just stop validating and let the rest of the app proceed
          // The axios interceptor will catch 401 on actual API calls
          console.warn("Session validation error:", error?.message);
          setIsValidating(false);
        }
      }
    }

    validateSession();
  }, []);

  return { isValidating };
}
