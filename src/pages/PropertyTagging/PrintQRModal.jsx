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
     GENERATE PROFESSIONAL PDF
  ========================= */
  const handleDownloadPDF = async () => {
    if (!assets.length) return;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [50, 25], // FINAL LABEL SIZE
    });

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];

      const imgUrl = `${API_BASE}/asset/assets/${asset._id}/qrcode`;
      const imgData = await toBase64(imgUrl);

      /* =========================
         LABEL BORDER (OPTIONAL VISUAL GUIDE)
      ========================= */
      pdf.setDrawColor(0);
      pdf.rect(0.5, 0.5, 49, 24); // subtle border for cutting alignment

      /* =========================
         QR CODE (PRIMARY ELEMENT)
         BIG + SCANNABLE
      ========================= */
      pdf.addImage(imgData, "PNG", 1.5, 2, 22, 22);

      /* =========================
         TEXT BLOCK (RIGHT SIDE)
      ========================= */

      // Brand / Title
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text("UIPS ASSET", 25, 7);

      // Serial Number
      pdf.setFontSize(5.5);
      pdf.setFont("helvetica", "normal");
      pdf.text(`SN: ${asset.serialNo || "-"}`, 25, 12);

      // Date
      const date = asset.purchaseDate
        ? new Date(asset.purchaseDate).toLocaleDateString()
        : "-";

      pdf.text(`PD: ${date}`, 25, 16);

      /* =========================
         PAGE BREAK
      ========================= */
      if (i !== assets.length - 1) {
        pdf.addPage([50, 25], "landscape");
      }
    }

    pdf.save("uips-qr-labels-50x25mm.pdf");
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

        <h2 className="text-lg font-semibold mb-3">
          Professional QR Label Export (50×25mm)
        </h2>

        {/* STATUS */}
        {loading ? (
          <p>Loading assets...</p>
        ) : (
          <p className="text-sm text-gray-600">
            {assets.length} labels ready for high-quality print
          </p>
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
