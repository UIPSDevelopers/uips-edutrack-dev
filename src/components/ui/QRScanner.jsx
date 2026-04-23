"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const QRScanner = forwardRef(({ onScan }, ref) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    startCamera: () => {
      if (scannerRef.current) {
        scannerRef.current.getState();
      }
    },
    stopCamera: () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    },
  }));

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        aspectRatio: 1.0,
      },
      false
    );

    try {
      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          scanner.clear().catch(() => {});
        },
        (errorMessage) => {
          // Log camera errors
          if (
            errorMessage &&
            !errorMessage.includes("TrackNotStartedError") &&
            !errorMessage.includes("NotAllowedError")
          ) {
            console.warn("QR Scan Error:", errorMessage);
          }
        }
      );
    } catch (err) {
      console.error("QRScanner initialization error:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please enable camera in your browser settings."
          : err.message || "Failed to initialize camera"
      );
    }

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScan]);

  if (error) {
    return (
      <div className="w-full p-4 text-center text-red-600">
        <p className="font-semibold">📷 Camera Error</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div id="qr-reader" style={{ width: "100%", height: "100%" }} />
    </div>
  );
});

QRScanner.displayName = "QRScanner";

export default QRScanner;
