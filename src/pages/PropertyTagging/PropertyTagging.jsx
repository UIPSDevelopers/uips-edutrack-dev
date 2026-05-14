"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Search,
  Ban,
  Printer,
  ScanLine,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronUpDown,
} from "lucide-react";

import PropertyTaggingTabs from "./PropertyTaggingTabs";
import axiosInstance from "@/lib/axios";
import PrintQRModal from "./PrintQRModal";
import QRScanner from "@/components/ui/QRScanner";

import * as XLSX from "xlsx";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const summary = useMemo(() => {
    const statusCounts = sortedAssets.reduce((acc, asset) => {
      const status = asset.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statuses = Object.entries(statusCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([status, count]) => ({ status, count }));

    const locationCount = new Set(
      sortedAssets.map((asset) => asset.locationId?.name || "Unknown"),
    ).size;

    return {
      total: assets.length,
      selected: selectedAssets.length,
      locationCount,
      statuses,
    };
  }, [assets, selectedAssets, sortedAssets]);

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
  // EXPORT EXCEL
  // =========================
  const exportExcel = () => {
    if (!sortedAssets.length) {
      return alert("No assets to export");
    }

    const excelData = sortedAssets.map((asset, index) => ({
      "#": index + 1,
      Serial: asset.serialNo || "-",
      Asset: asset.assetName || "-",
      Category: asset.categoryId?.name || "-",
      Brand: asset.brand || "-",
      Model: asset.model || "-",
      Status: asset.status || "-",
      Location: asset.locationId?.name || "-",
      Building: asset.locationId?.building || "-",
      Floor: asset.locationId?.floor || "-",
      PurchaseDate: asset.purchaseDate
        ? new Date(asset.purchaseDate).toLocaleDateString()
        : "-",
      Remarks: asset.remarks || "-",
      CreatedAt: asset.createdAt
        ? new Date(asset.createdAt).toLocaleString()
        : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Assets");

    XLSX.writeFile(
      wb,
      `ASSET_LIST_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // =========================
  // EXPORT PDF
  // =========================
  const exportPDF = () => {
    if (!sortedAssets.length) {
      return alert("No assets to export");
    }

    const doc = new jsPDF("landscape");

    const pageWidth = doc.internal.pageSize.getWidth();

    // COLORS
    const primary = [128, 0, 0];

    // HEADER
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);

    doc.text("PROPERTY TAGGING ASSET REPORT", 14, 18);

    doc.setFontSize(10);

    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 75, 18);

    // REPORT DETAILS
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(10);

    doc.text(`Total Assets: ${sortedAssets.length}`, 14, 40);

    // TABLE
    const tableData = sortedAssets.map((asset, index) => [
      index + 1,
      asset.serialNo || "-",
      asset.assetName || "-",
      asset.categoryId?.name || "-",
      asset.brand || "-",
      asset.model || "-",
      asset.status || "-",
      asset.locationId?.name || "-",
      asset.locationId?.building || "-",
      asset.locationId?.floor || "-",
      asset.purchaseDate
        ? new Date(asset.purchaseDate).toLocaleDateString()
        : "-",
      asset.remarks || "-",
    ]);

    autoTable(doc, {
      startY: 48,

      head: [
        [
          "#",
          "Serial",
          "Asset",
          "Category",
          "Brand",
          "Model",
          "Status",
          "Location",
          "Building",
          "Floor",
          "Purchase Date",
          "Remarks",
        ],
      ],

      body: tableData,

      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: primary,
        textColor: 255,
        halign: "center",
        fontStyle: "bold",
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },

      margin: {
        left: 10,
        right: 10,
      },

      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();

        const pageHeight = doc.internal.pageSize.height;

        doc.setFontSize(8);

        doc.setTextColor(100);

        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth - 30,
          pageHeight - 10,
        );

        doc.text(
          "Generated by EduTrack Property Tagging System",
          14,
          pageHeight - 10,
        );
      },
    });

    doc.save(
      `PROPERTY_TAGGING_REPORT_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  // =========================
  // SCANNER OPEN
  // =========================
  const openScanner = () => {
    setShowScanner(true);

    setTimeout(() => {
      if (scannerRef.current?.startCamera) {
        scannerRef.current.startCamera();
      }
    }, 200);
  };

  // =========================
  // SCAN HANDLER
  // =========================
  const handleScan = (data) => {
    if (!data || scanLockRef.current) return;

    let assetId = String(data).trim();

    if (assetId.includes("/")) {
      const match = assetId.match(/\/property-tagging\/([a-f\d]{24})/i);

      if (match && match[1]) {
        assetId = match[1];
      } else {
        alert(`Invalid QR Code URL format`);
        return;
      }
    }

    const isValidMongoId = /^[a-f\d]{24}$/i.test(assetId);

    if (!isValidMongoId) {
      alert(`Invalid QR Code format`);
      return;
    }

    scanLockRef.current = true;

    setShowScanner(false);

    navigate(`/property-tagging/${assetId}`);

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
      <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Property Tagging
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Asset Inventory & QR Management
            </h1>
            <p className="max-w-2xl text-sm text-slate-500">
              Manage tagged assets, print QR labels, scan items, and export polished reports — all from one dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>

            <Button variant="secondary" size="sm" onClick={exportPDF}>
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>

            <Button size="sm" className="bg-slate-950 text-white hover:bg-slate-900" onClick={openScanner}>
              <ScanLine className="w-4 h-4" />
              Scan QR
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={handlePrintQR}
              disabled={!selectedAssets.length}
            >
              <Printer className="w-4 h-4" />
              Print QR ({selectedAssets.length})
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Assets</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.total}</p>
          <p className="mt-2 text-sm text-slate-500">Valid tagged assets across all locations.</p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Selected</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.selected}</p>
          <p className="mt-2 text-sm text-slate-500">Assets currently selected for printing.</p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Locations</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.locationCount}</p>
          <p className="mt-2 text-sm text-slate-500">Distinct asset locations in this list.</p>
        </div>
      </div>

      <PropertyTaggingTabs />

      <Card className="overflow-hidden">
        <CardHeader className="items-center gap-4">
          <div>
            <CardTitle>Search & Filter</CardTitle>
            <p className="text-sm text-slate-500">Search by serial, name, brand, model, category, or location.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            <span>Showing</span>
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow-sm">{sortedAssets.length}</span>
            <span>assets</span>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-[1.8fr_1fr] items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Search className="h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 px-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Selected {selectedAssets.length} / {sortedAssets.length}
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              Toggle Select All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Assets List ({sortedAssets.length})</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-6">Loading...</p>
          ) : sortedAssets.length === 0 ? (
            <p className="text-center py-6">No assets found.</p>
          ) : (
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700">
                  <th className="whitespace-nowrap p-3">
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
                      className="group cursor-pointer p-3 text-sm font-semibold tracking-wide text-slate-600 transition-colors duration-150 hover:text-slate-900"
                      aria-sort={
                        sortConfig.key === col.key
                          ? sortConfig.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <div className="inline-flex items-center gap-2">
                        <span>{col.label}</span>
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          )
                        ) : (
                          <ChevronUpDown className="h-4 w-4 text-slate-300 opacity-60" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedAssets.map((asset) => {
                  const selected = selectedAssets.includes(asset._id);
                  return (
                    <tr
                      key={asset._id}
                      onClick={(e) => handleRowClick(e, asset._id)}
                      className={
                        "border-b bg-white transition duration-150 hover:bg-slate-50 " +
                        (selected ? "bg-slate-100" : "")
                      }
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(asset._id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      <td className="p-3 font-medium text-[#800000]">
                        {asset.serialNo}
                      </td>

                      <td className="p-3">{asset.assetName}</td>

                      <td className="p-3">{asset.categoryId?.name || "-"}</td>

                      <td className="p-3">{asset.brand || "-"}</td>

                      <td className="p-3">{asset.model || "-"}</td>

                      <td className="p-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                          {asset.status || "-"}
                        </span>
                      </td>

                      <td className="p-3">{asset.locationId?.name || "-"}</td>
                    </tr>
                  );
                })}
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
              <QRScanner ref={scannerRef} onScan={handleScan} />
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
