"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://uips-edutrack-backend-dev.onrender.com";

export default function PrintQRModal({ open, onClose, assetIds }) {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    if (!open || !assetIds?.length) return;

    const fetchData = async () => {
      try {
        const results = await Promise.all(
          assetIds.map((id) => axiosInstance.get(`/asset/assets/${id}`)),
        );

        setAssets(results.map((r) => r.data.asset));
      } catch (err) {
        console.error(err);
        setAssets([]);
      }
    };

    fetchData();
  }, [open, assetIds]);

  useEffect(() => {
    if (open && assets.length > 0) {
      setTimeout(() => window.print(), 400);
    }
  }, [open, assets]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-4xl p-6 rounded-lg relative">
        {/* CLOSE */}
        <div className="flex justify-between mb-4 no-print">
          <h2 className="text-lg font-bold">Print QR</h2>

          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-3 gap-4">
          {assets.map((a) => (
            <div key={a._id} className="border p-3 flex flex-col items-center">
              <img
                src={`${API_BASE}/api/asset/assets/${a._id}/qrcode`}
                className="w-40 h-40"
              />

              <p className="text-sm font-bold">{a.assetName}</p>
              <p className="text-xs">{a.serialNo}</p>
            </div>
          ))}
        </div>

        {/* PRINT STYLE */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
          }
        `}</style>
      </div>
    </div>
  );
}
