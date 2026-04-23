"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://uips-edutrack-backend-dev.onrender.com";

export default function PrintQRModal({
  open = false,
  onClose,
  assetIds = [],
}) {
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
          assetIds.map((id) =>
            axiosInstance.get(`/asset/assets/${id}`)
          )
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
    if (open && !loading && assets.length > 0) {
      const t = setTimeout(() => {
        window.print();
      }, 600);

      return () => clearTimeout(t);
    }
  }, [open, loading, assets]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print">

      {/* MODAL (NOT PRINTED) */}
      <div className="bg-white w-[95%] max-w-6xl p-4 rounded-lg relative no-print">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-3">
          Print QR Labels
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <p>{assets.length} labels ready to print</p>
        )}

        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      {/* =========================
          PRINT ONLY AREA (IMPORTANT)
      ========================= */}
      <div className="print-sheet">
        {assets.map((asset) => (
          <div key={asset._id} className="label">
            <div className="qr">
              <img
                src={`${API_BASE}/asset/assets/${asset._id}/qrcode`}
                alt="QR"
              />
            </div>

            <div className="info">
              <div className="title">UIPS</div>

              <div className="text">
                SN: {asset.serialNo || "-"}
              </div>

              <div className="text">
                PD:{" "}
                {asset.purchaseDate
                  ? new Date(asset.purchaseDate).toLocaleDateString()
                  : "-"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =========================
          PRINT STYLES (FINAL FIX)
      ========================= */}
      <style>{`
        /* SCREEN: hide print sheet */
        .print-sheet {
          display: none;
        }

        /* LABEL DESIGN (50mm x 25mm) */
        .label {
          width: 50mm;
          height: 25mm;
          display: flex;
          border: 1px solid #000;
          box-sizing: border-box;
        }

        .qr {
          width: 45%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .info {
          width: 55%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-left: 2mm;
        }

        .title {
          font-size: 8px;
          font-weight: bold;
        }

        .text {
          font-size: 6px;
          line-height: 1.2;
        }

        /* =========================
           PRINT RULES (CRITICAL)
        ========================= */
        @media print {

          body * {
            display: none !important;
          }

          .print-sheet,
          .print-sheet * {
            display: block !important;
          }

          .print-sheet {
            display: flex !important;
            flex-wrap: wrap;
          }

          @page {
            size: 50mm 25mm;
            margin: 0;
          }

          body {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
