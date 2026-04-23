"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://uips-edutrack-backend-dev.onrender.com";

export default function PrintQRModal({ isOpen, onClose, ids = [] }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !ids.length) return;

    const fetchAssets = async () => {
      try {
        setLoading(true);

        const results = await Promise.allSettled(
          ids.map((id) => axiosInstance.get(`/asset/assets/${id}`))
        );

        const valid = results
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value?.data?.asset)
          .filter(Boolean);

        setAssets(valid);
      } catch (err) {
        console.error(err);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [isOpen, ids]);

  useEffect(() => {
    if (!loading && assets.length > 0 && isOpen) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [loading, assets, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-5xl p-6 rounded-lg relative">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 no-print">
          Print QR Codes
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div
                key={asset._id}
                className="border p-4 flex flex-col items-center"
              >
                <img
                  src={`${API_BASE}/api/asset/assets/${asset._id}/qrcode`}
                  className="w-40 h-40"
                  alt="QR"
                />

                <p className="text-sm font-bold mt-2">
                  {asset.assetName}
                </p>
                <p className="text-xs text-gray-500">
                  {asset.serialNo}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4 gap-2 no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button onClick={() => window.print()}>
            Print
          </Button>
        </div>

        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }

            body {
              background: white;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
