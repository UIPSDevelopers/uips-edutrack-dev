// src/hooks/useAutoLogout.js
import { useEffect, useRef } from "react";

export default function useAutoLogout(idleMinutes = 15) {
  const lastResetRef = useRef(0);
  const throttleMs = 1000; // only reset timer max once per second

  useEffect(() => {
    // Only run if user is logged in
    const token = localStorage.getItem("token");
    if (!token) return;

    const IDLE_TIME = idleMinutes * 60 * 1000; // minutes → ms
    let timeoutId;

    const logoutNow = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const params = new URLSearchParams({
        reason: "session_expired",
        msg: "Session expired due to inactivity",
      });

      // Hard redirect – no React Router hook needed
      window.location.href = `/?${params.toString()}`;
    };

    // Throttled reset to avoid excessive timeout clearing
    const resetTimer = () => {
      const now = Date.now();
      if (now - lastResetRef.current < throttleMs) return;

      lastResetRef.current = now;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(logoutNow, IDLE_TIME);
    };

    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];

    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    // start timer immediately
    resetTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      clearTimeout(timeoutId);
    };
  }, [idleMinutes]);
}
