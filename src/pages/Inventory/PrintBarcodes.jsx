import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

function Barcode({ value }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!value || !ref.current) return;

    JsBarcode(ref.current, value, {
      format: "CODE128",
      width: 2,
      height: 45,
      displayValue: true,
      fontSize: 10,
    });
  }, [value]);

  return (
    <div className="flex justify-center mt-2">
      <svg ref={ref} />
    </div>
  );
}

export default function PrintBarcodes() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("printBarcodes");
    if (stored) {
      setItems(JSON.parse(stored));
    }

    setTimeout(() => window.print(), 500);
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
      <div className="grid grid-cols-2 gap-6">
        {items.map((item) => (
          <div
            key={item.itemId}
            className="border p-3 text-center break-inside-avoid"
          >
            <div className="text-xs font-semibold truncate">
              {item.itemName}
            </div>

            <Barcode value={item.barcode || item.itemId} />

            <div className="text-[10px] mt-1">
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
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
