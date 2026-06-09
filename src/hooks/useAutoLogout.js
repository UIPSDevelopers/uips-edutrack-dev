
import { useEffect, useRef } from "react";

export default function useAutoLogout(idleMinutes = 15) {
  const lastResetRef = useRef(0);
  const throttleMs = 500; 
  const warningTimeMs = 60000; 

  useEffect(() => {
    
    const token = localStorage.getItem("token");
    if (!token) return;

    const IDLE_TIME = idleMinutes * 60 * 1000; 
    let timeoutId;
    let warningTimeoutId;

    const logoutNow = async () => {
      
      try {
        const token = localStorage.getItem("token");
        if (token) {
          await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "https://uips-edutrack-backend-dev.onrender.com/api"}/auth/logout`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
      } catch (error) {
        console.error("Logout API call failed:", error);
        
      }

      
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiresAt");

      
      const params = new URLSearchParams({
        reason: "session_expired",
        msg: "Your session expired due to inactivity. Please log in again.",
      });

      window.location.href = `/?${params.toString()}`;
    };

    const showWarning = () => {
      
      
      const event = new CustomEvent("tokenExpiring", {
        detail: { message: "Your session will expire in 1 minute." },
      });
      window.dispatchEvent(event);
    };

    
    const resetTimer = () => {
      const now = Date.now();
      if (now - lastResetRef.current < throttleMs) return;

      lastResetRef.current = now;
      clearTimeout(timeoutId);
      clearTimeout(warningTimeoutId);

      
      warningTimeoutId = setTimeout(showWarning, IDLE_TIME - warningTimeMs);

      
      timeoutId = setTimeout(logoutNow, IDLE_TIME);
    };

    
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart", "keyup"];

    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    
    resetTimer();

    
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      clearTimeout(timeoutId);
      clearTimeout(warningTimeoutId);
    };
  }, [idleMinutes]);
}
