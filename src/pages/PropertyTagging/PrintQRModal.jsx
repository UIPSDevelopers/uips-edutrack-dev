"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://uips-edutrack-backend-dev.onrender.com";

export default function PrintQRModal({ open = false, onClose, assetIds = [] }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     FETCH ASSETS
  ========================= */
  useEffect(() => {
    if (!open || !assetIds.length) return;

    const fetchAssets = async () => {
      try {
        setLoading(true);

        const results = await Promise.allSettled(
          assetIds.map((id) => axiosInstance.get(`/asset/assets/${id}`)),
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
  }, [open, assetIds]);

  /* =========================
     AUTO PRINT
  ========================= */
  useEffect(() => {
    if (!loading && assets.length > 0 && open) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [loading, assets, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print">
      <div className="bg-white w-[95%] max-w-6xl p-4 rounded-lg relative">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-3">Print QR Labels</h2>

        {/* LOADING */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          /* =========================
             PRINT AREA (IMPORTANT)
          ========================= */
          <div className="print-area flex flex-wrap gap-0">
            {assets.map((asset) => (
              <div
                key={asset._id}
                className="flex border"
                style={{
                  width: "50mm",
                  height: "25mm",
                  pageBreakInside: "avoid",
                }}
              >
                {/* QR LEFT */}
                <div className="w-[45%] h-full flex items-center justify-center p-1">
                  <img
                    src={`${API_BASE}/asset/assets/${asset._id}/qrcode`}
                    className="w-full h-full object-contain"
                    alt="QR"
                  />
                </div>

                {/* TEXT RIGHT */}
                <div className="w-[55%] h-full flex flex-col justify-center px-1">
                  {/* TITLE */}
                  <div className="font-bold text-[8px] leading-tight">UIPS</div>

                  {/* SERIAL */}
                  <div className="text-[6px] leading-tight">
                    <span className="font-semibold">SN:</span>{" "}
                    {asset.serialNo || "-"}
                  </div>

                  {/* PURCHASE DATE */}
                  <div className="text-[6px] leading-tight">
                    <span className="font-semibold">PD:</span>{" "}
                    {asset.purchaseDate
                      ? new Date(asset.purchaseDate).toLocaleDateString()
                      : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end mt-4 gap-2 no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button onClick={() => window.print()}>Print</Button>
        </div>

        {/* =========================
           PRINT STYLES (CRITICAL)
        ========================= */}
        <style>{`
          @media print {
            @page {
              size: 50mm 25mm;
              margin: 0;
            }

            body {
              margin: 0;
              background: white;
            }

            .no-print {
              display: none !important;
            }

            .print-area {
              width: 50mm;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
