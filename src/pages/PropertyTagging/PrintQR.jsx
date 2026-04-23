"use client";

import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "@/lib/axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://uips-edutrack-backend-dev.onrender.com/api";

export default function PrintQR() {
  const location = useLocation();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     EXTRACT + VALIDATE IDS
  ========================================================= */
  const ids = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("ids");

    if (!raw) return [];

    return raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^[a-fA-F0-9]{24}$/.test(id));
  }, [location.search]);

  /* =========================================================
     FETCH ASSETS (SAFE MODE - NO CRASH)
  ========================================================= */
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);

        if (!ids.length) {
          setAssets([]);
          setLoading(false);
          return;
        }

        // 🔥 IMPORTANT FIX: prevent one failure from breaking everything
        const responses = await Promise.allSettled(
          ids.map((id) => axiosInstance.get(`/asset/assets/${id}/qrcode`)),
        );

        const validAssets = responses
          .filter((res) => res.status === "fulfilled")
          .map((res) => res.value?.data?.asset)
          .filter(Boolean);

        console.log("Loaded assets:", validAssets);

        setAssets(validAssets);
      } catch (error) {
        console.error("PrintQR error:", error);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [ids]);

  /* =========================================================
     AUTO PRINT WHEN READY
  ========================================================= */
  useEffect(() => {
    if (!loading && assets.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [loading, assets]);

  /* =========================================================
     LOADING STATE
  ========================================================= */
  if (loading) {
    return <p className="p-6">Loading QR codes...</p>;
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */
  if (!assets.length) {
    return <p className="p-6 text-red-500">No assets found.</p>;
  }

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="p-6">
      {/* HEADER (hidden when printing) */}
      <div className="no-print flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Print QR Codes</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>

          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      {/* QR GRID */}
      <div className="grid grid-cols-3 gap-6 print:grid-cols-2">
        {assets.map((asset) => (
          <div
            key={asset._id}
            className="border p-4 flex flex-col items-center justify-center"
          >
            {/* QR CODE */}
            <img
              src={`${API_BASE}/api/asset/assets/${asset._id}/qrcode`}
              alt="QR Code"
              className="w-40 h-40"
              loading="eager"
            />

            {/* LABEL */}
            <div className="text-center mt-2">
              <p className="font-bold text-sm">{asset.assetName}</p>
              <p className="text-xs text-gray-600">{asset.serialNo}</p>
            </div>
          </div>
        ))}
      </div>

      {/* PRINT STYLE */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white;
          }

          @page {
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
