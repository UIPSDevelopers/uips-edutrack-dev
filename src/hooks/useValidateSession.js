import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";

export function useValidateSession() {
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    async function validateSession() {
      const token = localStorage.getItem("token");

      
      if (!token) {
        setIsValidating(false);
        return;
      }

      
      const expiresAt = localStorage.getItem("tokenExpiresAt");
      if (expiresAt && Date.now() > parseInt(expiresAt)) {
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("tokenExpiresAt");
        window.location.href = "/?reason=session_expired&msg=Your%20session%20has%20expired.%20Please%20log%20in%20again.";
        return;
      }

      try {
        
        
        await axiosInstance.get("/auth/me");
        setIsValidating(false);
      } catch (error) {
        const status = error.response?.status;

        
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("tokenExpiresAt");
          window.location.href = "/?reason=session_expired&msg=Your%20session%20has%20expired.%20Please%20log%20in%20again.";
        } else {
          
          
          
          console.warn("Session validation error:", error?.message);
          setIsValidating(false);
        }
      }
    }

    validateSession();
  }, []);

  return { isValidating };
}
