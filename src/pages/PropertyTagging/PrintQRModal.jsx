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
     GENERATE PDF (50mm x 25mm)
  ========================= */
  const handleDownloadPDF = async () => {
    if (!assets.length) return;

    const pdf = new jsPDF({
      unit: "mm",
      format: [50, 25], // ✅ FINAL SIZE
    });

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];

      const imgUrl = `${API_BASE}/asset/assets/${asset._id}/qrcode`;
      const imgData = await toBase64(imgUrl);

      /* =========================
         QR (LEFT SIDE)
      ========================= */
      pdf.addImage(imgData, "PNG", 1.5, 3, 18, 18);

      /* =========================
         TEXT (RIGHT SIDE)
      ========================= */
      pdf.setFontSize(6);
      pdf.text("UIPS", 21, 6);

      pdf.setFontSize(5);
      pdf.text(`SN: ${asset.serialNo || "-"}`, 21, 11);

      const date = asset.purchaseDate
        ? new Date(asset.purchaseDate).toLocaleDateString()
        : "-";

      pdf.text(`PD: ${date}`, 21, 16);

      /* =========================
         NEXT LABEL PAGE
      ========================= */
      if (i !== assets.length - 1) {
        pdf.addPage([50, 25]);
      }
    }

    pdf.save("qr-labels-50x25mm.pdf");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] p-4 rounded-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-3">
          QR Label Export (50×25mm)
        </h2>

        {loading ? (
          <p>Loading assets...</p>
        ) : (
          <p>{assets.length} labels ready</p>
        )}

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
