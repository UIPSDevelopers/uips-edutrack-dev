import { useEffect, useState } from "react";
import JsBarcode from "jsbarcode";

function BarcodeImage({ value, scaleWidth, scaleHeight }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;
    const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    // target display size in CSS pixels (controls visible length)
    const displayWidth = 280 * scaleWidth;
    const displayHeight = 80 * scaleHeight;

    // render at higher pixel density so downscaling keeps crisp edges
    const pixelWidth = Math.max(200, Math.ceil(displayWidth * DPR));
    const pixelHeight = Math.max(40, Math.ceil(displayHeight * DPR));

    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const moduleWidth = Math.max(1, Math.round(1.2 * DPR * scaleWidth));
    const barHeight = Math.max(30, Math.round(pixelHeight - Math.round(18 * DPR)));
    const fontSize = Math.max(10, Math.round(12 * DPR * scaleHeight));

    JsBarcode(canvas, value, {
      format: "CODE128",
      width: moduleWidth,
      height: barHeight,
      displayValue: true,
      fontSize,
      margin: Math.round(6 * DPR),
      textMargin: Math.round(4 * DPR),
      background: "#ffffff",
      lineColor: "#000000",
    });

    setSrc(canvas.toDataURL("image/png"));
  }, [value, scaleWidth, scaleHeight]);

  return (
    <div className="flex justify-center mt-2">
      {src ? (
        <img
          src={src}
          alt={value}
          style={{
            width: "100%",
            maxWidth: `${280 * scaleWidth}px`,
            height: "auto",
          }}
        />
      ) : null}
    </div>
  );
}

export default function PrintBarcodes() {
  const [items, setItems] = useState([]);
  const [scaleWidth, setScaleWidth] = useState(1);
  const [scaleHeight, setScaleHeight] = useState(1);

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
          onClick={() => window.print()}
          className="inline-flex items-center rounded bg-[#800000] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#a10000]"
        >
          Print Labels
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
