import { useEffect, useState, useRef } from "react";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";

// (old image-based preview removed)

function BarcodeImage({ value, scaleWidth, scaleHeight }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const displayWidth = 280 * scaleWidth; // CSS px
    const displayHeight = 80 * scaleHeight; // CSS px

    const RENDER_MULT = 3; // supersample multiplier for HD output
    const pixelWidth = Math.max(1200, Math.ceil(displayWidth * DPR * RENDER_MULT));
    const pixelHeight = Math.max(240, Math.ceil(displayHeight * DPR * RENDER_MULT));

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    // set CSS size for canvas to control visible size
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const moduleWidth = Math.max(1, Math.round(1.2 * DPR * RENDER_MULT * scaleWidth));
    // Use a fixed base font for the serial (not scaled by user controls)
    const BASE_FONT = 12;
    const fontSize = Math.round(BASE_FONT * DPR * RENDER_MULT);
    // reserve a portion of the canvas for the serial text using fontSize
    const reservedTextPx = Math.min(Math.max(Math.round(fontSize * 1.6), Math.round(pixelHeight * 0.12)), Math.round(pixelHeight * 0.35));
    const barHeight = Math.max(24, Math.round(pixelHeight - reservedTextPx - Math.round(6 * DPR * RENDER_MULT)));

    // Render barcode only (no human-readable text inside barcode)
    JsBarcode(canvas, value, {
      format: "CODE128",
      width: moduleWidth,
      height: barHeight,
      displayValue: false,
      margin: Math.round(6 * DPR),
      background: "#ffffff",
      lineColor: "#000000",
    });
  }, [value, scaleWidth, scaleHeight]);

  return (
    <div className="flex justify-center mt-2">
      <canvas ref={canvasRef} />
    </div>
  );
}

// Serial text below barcode (fixed size, independent of sliders)
function SerialText({ value }) {
  return (
    <div className="mt-2 text-gray-700" style={{ fontSize: 12 }}>
      {value}
    </div>
  );
}
export default function PrintBarcodes() {
  const [items, setItems] = useState([]);
  const [scaleWidth, setScaleWidth] = useState(1);
  const [scaleHeight, setScaleHeight] = useState(1);
  
  const handlePrintPDF = async () => {
    if (!items.length) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28; // pts
    const gap = 10; // pts between labels

    // convert CSS px to points (1pt = 1.333px at 96dpi) -> pt = px * 72/96
    const pxToPt = (px) => (px * 72) / 96;

    let x = margin;
    let y = margin;

    for (const item of items) {
      // create high-res canvas for barcode
      const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;
      const RENDER_MULT = 3;
      const displayW = 280 * scaleWidth; // CSS px
      const displayH = 80 * scaleHeight; // CSS px
      const pixelW = Math.max(1200, Math.ceil(displayW * DPR * RENDER_MULT));
      const pixelH = Math.max(240, Math.ceil(displayH * DPR * RENDER_MULT));

      const canvas = document.createElement("canvas");
      canvas.width = pixelW;
      canvas.height = pixelH;

      const moduleWidth = Math.max(1, Math.round(1.2 * DPR * RENDER_MULT * scaleWidth));
      const BASE_FONT = 12;
      const fontSize = Math.round(BASE_FONT * DPR * RENDER_MULT);
      const reservedTextPx = Math.min(Math.max(Math.round(fontSize * 1.6), Math.round(pixelH * 0.12)), Math.round(pixelH * 0.35));
      const barHeight = Math.max(24, Math.round(pixelH - reservedTextPx - Math.round(6 * DPR * RENDER_MULT)));


      // Render barcode only; serial will be written separately (fixed size)
      JsBarcode(canvas, item.barcode || item.itemId, {
        format: "CODE128",
        width: moduleWidth,
        height: barHeight,
        displayValue: false,
        margin: Math.round(6 * DPR),
        background: "#ffffff",
        lineColor: "#000000",
      });

      const dataUrl = canvas.toDataURL("image/png");

      const imgW = pxToPt(displayW);
      const imgH = pxToPt(displayH);
      const serialFontPt = 9; // fixed serial font in PDF (points)
      const serialGapPt = 6; // gap between image and serial text
      const totalImgH = imgH + serialGapPt + serialFontPt;

      if (x + imgW > pageWidth - margin) {
        x = margin;
        y += totalImgH + gap;
      }

      if (y + totalImgH > pageHeight - margin) {
        doc.addPage();
        x = margin;
        y = margin;
      }

      doc.addImage(dataUrl, "PNG", x, y, imgW, imgH);
      // draw serial text centered below image (fixed size)
      doc.setFontSize(serialFontPt);
      doc.text(item.barcode || item.itemId, x + imgW / 2, y + imgH + serialGapPt + serialFontPt, { align: "center" });

      x += imgW + gap;
    }

    const url = doc.output("bloburl");
    window.open(url, "_blank");
  };

  useEffect(() => {
    const stored = localStorage.getItem("printBarcodes");
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  if (!items.length) {
    return (
      <div className="p-10 text-center text-gray-500">
        No barcodes to print.
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Barcode Print Preview
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Resize the barcode image then click Print to generate the labels.x
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrintPDF}
          className="inline-flex items-center rounded bg-[#800000] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#a10000]"
        >
          Generate PDF
        </button>
      </div>

      <div className="mb-6 space-y-4 print:hidden">
        <div>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <span className="font-medium">Width scale:</span>
            <span className="text-xs text-gray-500">{Math.round(scaleWidth * 100)}%</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.05"
            value={scaleWidth}
            onChange={(e) => setScaleWidth(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>
        <div>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <span className="font-medium">Height scale:</span>
            <span className="text-xs text-gray-500">{Math.round(scaleHeight * 100)}%</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.05"
            value={scaleHeight}
            onChange={(e) => setScaleHeight(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.itemId}
            className="border border-gray-300 rounded-lg bg-white p-4 text-center break-inside-avoid shadow-sm"
          >
            <BarcodeImage value={item.barcode || item.itemId} scaleWidth={scaleWidth} scaleHeight={scaleHeight} />
            <SerialText value={item.barcode || item.itemId} />
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .print\:hidden {
            display: none !important;
          }

          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
