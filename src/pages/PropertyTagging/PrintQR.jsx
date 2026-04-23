"use client";

import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "@/lib/axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL;

export default function PrintQR() {
  const location = useLocation();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     PARSE IDS (MEMOIZED TO AVOID RE-RUNS)
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
     FETCH ASSETS
  ========================================================= */
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);

        if (ids.length === 0) {
          setAssets([]);
          return;
        }

        const results = await Promise.all(
          ids.map((id) => axiosInstance.get(`/asset/assets/${id}`)),
        );

        const clean = results.map((res) => res?.data?.asset).filter(Boolean);

        setAssets(clean);
      } catch (error) {
        console.error(
          "PrintQR fetch error:",
          error?.response?.data || error.message,
        );
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [ids]);

  /* =========================================================
     AUTO PRINT AFTER IMAGES READY
  ========================================================= */
  useEffect(() => {
    if (!loading && assets.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loading, assets]);

  /* =========================================================
     LOADING
  ========================================================= */
  if (loading) {
    return <p className="p-6">Loading QR codes...</p>;
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */
  if (assets.length === 0) {
    return <p className="p-6">No assets found.</p>;
  }

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="no-print flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Print QR Codes</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>

          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      {/* GRID */}
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

      {/* PRINT STYLES */}
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
