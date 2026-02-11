import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios"; // adjust if path is different

export function useWarmupServer(token) {
  const [isWarmingUp, setIsWarmingUp] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setIsWarmingUp(false);
      return;
    }

    let cancelled = false;

    async function warmup() {
      try {
        // call your /api/health endpoint on Render
        await axiosInstance.get("/health", { timeout: 30000 });
      } catch (err) {
        console.error("Warmup error:", err?.message || err);
      } finally {
        if (!cancelled) setIsWarmingUp(false);
      }
    }

    warmup();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { isWarmingUp };
}
