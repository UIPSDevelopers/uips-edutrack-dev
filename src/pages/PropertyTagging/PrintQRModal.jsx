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

      

      pdf.setFillColor(245, 245, 245);
      pdf.rect(23, 0, 27, 25, "F");

      

      
      pdf.setDrawColor(0, 0, 0); 
      pdf.setLineWidth(0.3); 
      pdf.line(22.5, 2, 22.5, 23);

      

      const qrSize = 21;
      const leftAreaW = 22;

      const qrX = (leftAreaW - qrSize) / 2;
      const qrY = (25 - qrSize) / 2;

      pdf.addImage(imgData, "PNG", qrX, qrY, qrSize, qrSize);

      

      const leftBoundary = 24;
      const rightBoundary = 49;
      const centerX = (leftBoundary + rightBoundary) / 2;

      
      const brandY = 11;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);

      const brand = "UIPS";
      const brandWidth = pdf.getTextWidth(brand);
      pdf.text(brand, centerX - brandWidth / 2, brandY);

      
      pdf.setDrawColor(0, 0, 0); 
      pdf.setLineWidth(0.3);
      pdf.line(leftBoundary, 13, rightBoundary, 13);

      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text(`${asset.serialNo || "-"}`, leftBoundary, 17);

      
      const date = asset.purchaseDate
        ? new Date(asset.purchaseDate).toLocaleDateString()
        : "-";

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(0);
      pdf.text(`PD  ${date}`, leftBoundary, 22);

      pdf.setTextColor(0);

      
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
        {}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500"
        >
          ✕
        </button>

        {}
        <h2 className="text-lg font-semibold mb-3">UIPS QR Label Export</h2>

        {}
        {loading ? (
          <p>Loading assets...</p>
        ) : (
          <p className="text-sm text-gray-600">{assets.length} labels ready</p>
        )}

        {}
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
