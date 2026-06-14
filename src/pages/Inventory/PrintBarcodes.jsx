import { useEffect, useState } from "react";
import JsBarcode from "jsbarcode";

function BarcodeImage({ value, scale }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;

    const canvas = document.createElement("canvas");
    const barWidth = Math.max(1, Math.round(2 * scale));
    const barHeight = Math.max(45, Math.round(45 * scale));
    const fontSize = Math.max(10, Math.round(10 * scale));

    JsBarcode(canvas, value, {
      format: "CODE128",
      width: barWidth,
      height: barHeight,
      displayValue: true,
      fontSize,
      margin: 10,
      textMargin: 2,
      background: "#ffffff",
      lineColor: "#000000",
    });

    setSrc(canvas.toDataURL("image/png"));
  }, [value, scale]);

  return (
    <div className="flex justify-center mt-2">
      {src ? (
        <img
          src={src}
          alt={value}
          style={{
            width: "100%",
            maxWidth: `${280 * scale}px`,
            height: "auto",
          }}
        />
      ) : null}
    </div>
  );
}

export default function PrintBarcodes() {
  const [items, setItems] = useState([]);
  const [scale, setScale] = useState(1);

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
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="mb-6">
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <span className="font-medium">Barcode scale:</span>
          <span className="text-xs text-gray-500">{Math.round(scale * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.7"
          max="1.8"
          step="0.05"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.itemId}
            className="border border-gray-300 rounded-lg bg-white p-4 text-center break-inside-avoid shadow-sm"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 truncate">
              {item.itemName || item.itemId}
            </div>
            <BarcodeImage value={item.barcode || item.itemId} scale={scale} />
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
          }

          button,
          input[type='range'] {
            display: none;
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
