"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

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
     IMAGE TO BASE64
  ========================= */
  const toBase64 = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = reject;
      img.src = url;
    });

  /* =========================
     GENERATE PDF (MAX DENSITY LABEL)
  ========================= */
  const handleDownloadPDF = async () => {
    if (!assets.length) return;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [50, 25],
    });

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];

      const imgUrl = `${API_BASE}/asset/assets/${asset._id}/qrcode`;
      const imgData = await toBase64(imgUrl);

      /* =========================
       LEFT AREA (QR CENTERED FULLY)
    ========================= */

      const pageW = 50;
      const pageH = 25;

      const leftAreaW = 22; // reserved space for QR
      const qrSize = 21; // MAX SAFE SIZE for clean margin

      const qrX = (leftAreaW - qrSize) / 2; // 🔥 horizontal center in left area
      const qrY = (pageH - qrSize) / 2; // 🔥 vertical center

      pdf.addImage(imgData, "PNG", qrX, qrY, qrSize, qrSize);

      /* =========================
       RIGHT AREA (TEXT COLUMN)
    ========================= */

      const leftBoundary = 24;
      const rightBoundary = 49;
      const centerX = (leftBoundary + rightBoundary) / 2;

      // UIPS (CENTERED BRAND)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);

      const brand = "UIPS";
      const brandWidth = pdf.getTextWidth(brand);
      pdf.text(brand, centerX - brandWidth / 2, 8);

      // Divider line (corporate structure)
      pdf.setDrawColor(210);
      pdf.line(leftBoundary, 9.5, rightBoundary, 9.5);

      // SERIAL (PRIMARY DATA)
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`${asset.serialNo || "-"}`, leftBoundary, 14);

      // PURCHASE DATE (BLACK AS REQUESTED)
      const date = asset.purchaseDate
        ? new Date(asset.purchaseDate).toLocaleDateString()
        : "-";

      pdf.setFontSize(8);
      pdf.setTextColor(0);
      pdf.text(`PD  ${date}`, leftBoundary, 19);

      /* reset */
      pdf.setTextColor(0);

      /* =========================
       PAGE BREAK
    ========================= */
      if (i !== assets.length - 1) {
        pdf.addPage([50, 25], "landscape");
      }
    }

    pdf.save("uips-corporate-labels.pdf");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] p-4 rounded-lg relative">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500"
        >
          ✕
        </button>

        {/* HEADER */}
        <h2 className="text-lg font-semibold mb-3">UIPS QR Label Export</h2>

        {/* STATUS */}
        {loading ? (
          <p>Loading assets...</p>
        ) : (
          <p className="text-sm text-gray-600">{assets.length} labels ready</p>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button onClick={handleDownloadPDF} disabled={!assets.length}>
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
