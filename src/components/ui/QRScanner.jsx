"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import jsQR from "jsqr";

const QRScanner = forwardRef(({ onScan }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef(null);

  useImperativeHandle(ref, () => ({
    startCamera: () => {
      setScanning(true);
    },
    stopCamera: () => {
      setScanning(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    },
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !scanning) return;

    const startCamera = async () => {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", 
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        video.srcObject = stream;
        setError(null);
      } catch (err) {
        console.error("Camera access error:", err);
        let errorMsg = "Failed to access camera";

        if (err.name === "NotAllowedError") {
          errorMsg =
            "Camera permission denied. Please enable camera access in your browser settings.";
        } else if (err.name === "NotFoundError") {
          errorMsg = "No camera device found on this device.";
        } else if (err.name === "NotReadableError") {
          errorMsg = "Camera is already in use by another application.";
        }

        setError(errorMsg);
        setScanning(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scanning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !scanning) return;

    const ctx = canvas.getContext("2d");
    let animationId;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          console.log("✅ QR Code detected!");
          console.log("  Data:", code.data);
          console.log("  Type:", typeof code.data);
          console.log("  Length:", code.data.length);
          onScan(code.data);
        }
      }

      animationId = requestAnimationFrame(scan);
    };

    animationId = requestAnimationFrame(scan);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [scanning, onScan]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 p-4">
        <div className="text-center">
          <p className="font-semibold text-red-700 mb-2">📷 Camera Error</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {!scanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3" />
            </div>
            <p className="text-white text-sm">Initializing camera...</p>
          </div>
        </div>
      )}

      {scanning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-4 border-green-500 rounded-lg opacity-50" />
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full inline-block">
              Point camera at QR code
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

QRScanner.displayName = "QRScanner";

export default QRScanner;
