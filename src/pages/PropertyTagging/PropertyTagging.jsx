"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Ban, Printer, ScanLine } from "lucide-react";

import PropertyTaggingTabs from "./PropertyTaggingTabs";
import axiosInstance from "@/lib/axios";
import PrintQRModal from "./PrintQRModal";
import QRScanner from "@/components/ui/QRScanner";

export default function PropertyTagging() {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssets, setSelectedAssets] = useState([]);

  const [showPrint, setShowPrint] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const scanLockRef = useRef(false);
  const scannerRef = useRef(null);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // =========================
  // VALIDATION
  // =========================
  const isValidObjectId = (id) =>
    typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

  // =========================
  // ROLE CHECK
  // =========================
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const role = user?.role;
  const canView = ["IT", "InventoryStaff", "InventoryAdmin"].includes(role);

  // =========================
  // FETCH ASSETS
  // =========================
  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const fetchAssets = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/asset/assets");
        setAssets(res.data.assets || []);
      } catch (error) {
        console.error(error);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [canView]);

  // =========================
  // FILTER
  // =========================
  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets;

    return assets.filter((a) =>
      `${a.assetName} ${a.serialNo} ${a.brand} ${a.model}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [assets, searchTerm]);

  // =========================
  // SORT
  // =========================
  const sortedAssets = useMemo(() => {
    if (!sortConfig.key) return filteredAssets;

    return [...filteredAssets].sort((a, b) => {
      const A = String(a[sortConfig.key] || "").toLowerCase();
      const B = String(b[sortConfig.key] || "").toLowerCase();

      if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
      if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredAssets, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // =========================
  // SELECT
  // =========================
  const toggleSelect = (id) => {
    if (!isValidObjectId(id)) return;

    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    const validIds = sortedAssets.map((a) => a._id);

    setSelectedAssets((prev) =>
      prev.length === validIds.length ? [] : validIds,
    );
  };

  // =========================
  // PRINT
  // =========================
  const handlePrintQR = () => {
    if (!selectedAssets.length) return;
    setShowPrint(true);
  };

  // =========================
  // SCANNER OPEN (AUTO CAMERA START)
  // =========================
  const openScanner = () => {
    setShowScanner(true);

    // small delay ensures camera initializes properly
    setTimeout(() => {
      if (scannerRef.current?.startCamera) {
        scannerRef.current.startCamera();
      }
    }, 200);
  };

  // =========================
  // SCAN HANDLER (INSTANT REDIRECT)
  // =========================
  const handleScan = (data) => {
    console.log("handleScan called with:", data);
    if (!data || scanLockRef.current) {
      console.log("handleScan blocked: data=", data, "lock=", scanLockRef.current);
      return;
    }

    scanLockRef.current = true;
    console.log("Navigating to /property-tagging/" + data);

    setShowScanner(false);
    navigate(`/property-tagging/${data}`);

    setTimeout(() => {
      scanLockRef.current = false;
    }, 800);
  };

  // =========================
  // ROW CLICK
  // =========================
  const handleRowClick = (e, id) => {
    if (e.target.type === "checkbox") return;
    navigate(`/property-tagging/${id}`);
  };

  // =========================
  // UNAUTHORIZED
  // =========================
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Ban className="mx-auto text-red-500 mb-2" />
          <p>Unauthorized Access</p>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Property Tagging</h1>

        <div className="flex gap-2">
          {/* SCAN BUTTON (AUTO CAMERA) */}
          <Button onClick={openScanner} className="bg-black text-white">
            <ScanLine className="w-4 h-4 mr-2" />
            Scan QR
          </Button>

          <Button
            onClick={handlePrintQR}
            disabled={!selectedAssets.length}
            className="bg-[#800000] hover:bg-[#a10000]"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print QR ({selectedAssets.length})
          </Button>
        </div>
      </div>

      <PropertyTaggingTabs />

      {/* SEARCH */}
      <div className="flex items-center gap-2 w-full md:w-1/3">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Assets List</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-center py-6">Loading...</p>
          ) : sortedAssets.length === 0 ? (
            <p className="text-center py-6">No assets found.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedAssets.length === sortedAssets.length &&
                        sortedAssets.length > 0
                      }
                      onChange={selectAll}
                    />
                  </th>

                  {[
                    { key: "serialNo", label: "Serial" },
                    { key: "assetName", label: "Name" },
                    { key: "categoryId", label: "Category" },
                    { key: "brand", label: "Brand" },
                    { key: "model", label: "Model" },
                    { key: "status", label: "Status" },
                    { key: "locationId", label: "Location" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="p-3 cursor-pointer"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedAssets.map((asset) => (
                  <tr
                    key={asset._id}
                    onClick={(e) => handleRowClick(e, asset._id)}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(asset._id)}
                        onChange={() => toggleSelect(asset._id)}
                      />
                    </td>

                    <td className="p-3 font-medium text-[#800000]">
                      {asset.serialNo}
                    </td>
                    <td className="p-3">{asset.assetName}</td>
                    <td className="p-3">{asset.categoryId?.name || "-"}</td>
                    <td className="p-3">{asset.brand || "-"}</td>
                    <td className="p-3">{asset.model || "-"}</td>
                    <td className="p-3">{asset.status}</td>
                    <td className="p-3">{asset.locationId?.name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* MODALS */}
      <PrintQRModal
        open={showPrint}
        onClose={() => setShowPrint(false)}
        assetIds={selectedAssets}
      />

      {showScanner && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full md:w-[90vw] md:h-[90vh] md:rounded-lg flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Scan QR Code</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScanner(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <QRScanner
                ref={scannerRef}
                onScan={handleScan}
              />
            </div>

            <div className="p-4 border-t">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setShowScanner(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
