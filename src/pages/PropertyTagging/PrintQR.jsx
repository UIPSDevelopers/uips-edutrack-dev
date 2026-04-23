"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL;

export default function PrintQR() {
  const location = useLocation();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readyToPrint, setReadyToPrint] = useState(false);

  // =========================
  // FETCH + PARSE IDS SAFELY
  // =========================
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        setReadyToPrint(false);

        const params = new URLSearchParams(location.search);
        const idsParam = params.get("ids");

        console.log("ID BEING SENT:", id);


        if (!idsParam) {
          setAssets([]);
          setLoading(false);
          return;
        }

        const ids = idsParam
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length === 24); // valid MongoDB ObjectId safety

        if (ids.length === 0) {
          setAssets([]);
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          ids.map((id) => axiosInstance.get(`/api/assets/assets/${id}`)),
        );

        const data = results.map((res) => res.data.asset);

        setAssets(data);
      } catch (error) {
        console.error("Error fetching assets:", error);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [location.search]);

  // =========================
  // TRIGGER PRINT AFTER LOAD
  // =========================
  useEffect(() => {
    if (!loading && assets.length > 0) {
      const timer = setTimeout(() => {
        setReadyToPrint(true);
        window.print();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loading, assets]);

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return <p className="p-6">Loading QR codes...</p>;
  }

  if (!assets.length) {
    return <p className="p-6">No assets found.</p>;
  }

  // =========================
  // UI
  // =========================
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
              src={`${API_BASE}/api/assets/assets/${asset._id}/qrcode`}
              alt="QR Code"
              className="w-40 h-40"
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
      <style>
        {`
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
        `}
      </style>
    </div>
  );
}
