import { useEffect, useState } from "react";
import JsBarcode from "jsbarcode";

function BarcodeImage({ value, scaleWidth, scaleHeight }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;

    const canvas = document.createElement("canvas");
    const barWidth = Math.max(1, Math.round(2 * scaleWidth));
    const barHeight = Math.max(45, Math.round(50 * scaleHeight));
    const fontSize = Math.max(12, Math.round(14 * scaleHeight));

    JsBarcode(canvas, value, {
      format: "CODE128",
      width: barWidth,
      height: barHeight,
      displayValue: true,
      fontSize,
      margin: 10,
      textMargin: 5,
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
            Resize the barcode image then click Print to generate the labels.
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
            min="0.5"
            max="2.5"
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
            min="0.5"
            max="2.5"
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
            <div className="mt-2 text-xs text-gray-700 break-words">
              {item.barcode || item.itemId}
            </div>
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
