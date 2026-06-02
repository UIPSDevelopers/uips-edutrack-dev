// src/hooks/useAutoLogout.js
import { useEffect, useRef } from "react";

export default function useAutoLogout(idleMinutes = 15) {
  const lastResetRef = useRef(0);
  const throttleMs = 500; // Reduced from 1000 for better responsiveness
  const warningTimeMs = 60000; // Warn 1 minute before logout

  useEffect(() => {
    // Only run if user is logged in
    const token = localStorage.getItem("token");
    if (!token) return;

    const IDLE_TIME = idleMinutes * 60 * 1000; // minutes → ms
    let timeoutId;
    let warningTimeoutId;

    const logoutNow = async () => {
      // Call logout endpoint to notify backend
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
        // Continue with client-side logout anyway
      }

      // Clear auth info
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiresAt");

      // Redirect to login with reason
      const params = new URLSearchParams({
        reason: "session_expired",
        msg: "Your session expired due to inactivity. Please log in again.",
      });

      window.location.href = `/?${params.toString()}`;
    };

    const showWarning = () => {
      // Show 1-minute warning (optional enhancement)
      // You can emit a custom event here or show a toast
      const event = new CustomEvent("tokenExpiring", {
        detail: { message: "Your session will expire in 1 minute." },
      });
      window.dispatchEvent(event);
    };

    // Throttled reset to avoid excessive timeout clearing
    const resetTimer = () => {
      const now = Date.now();
      if (now - lastResetRef.current < throttleMs) return;

      lastResetRef.current = now;
      clearTimeout(timeoutId);
      clearTimeout(warningTimeoutId);

      // Set warning timeout (1 minute before logout)
      warningTimeoutId = setTimeout(showWarning, IDLE_TIME - warningTimeMs);

      // Set logout timeout
      timeoutId = setTimeout(logoutNow, IDLE_TIME);
    };

    // Monitor user activity
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart", "keyup"];

    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    // Start timer immediately
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      clearTimeout(timeoutId);
      clearTimeout(warningTimeoutId);
    };
  }, [idleMinutes]);
}
