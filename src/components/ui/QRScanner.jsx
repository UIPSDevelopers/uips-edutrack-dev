"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        facingMode: "environment", // back camera
      },
      false,
    );

    const success = (decodedText) => {
      scanner.clear().then(() => {
        onScan(decodedText); // instant redirect trigger
      });
    };

    scanner.render(success, () => {});

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScan]);

  return <div id="qr-reader" className="w-full" />;
}
