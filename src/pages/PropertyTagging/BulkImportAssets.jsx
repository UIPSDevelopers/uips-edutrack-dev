"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";

import PropertyTaggingTabs from "@/pages/PropertyTagging/PropertyTaggingTabs";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
} from "lucide-react";

import axiosInstance from "@/lib/axios";

export default function BulkImportAssets() {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");

  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);

  const [importSummary, setImportSummary] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  // =========================
  // REQUIRED HEADERS
  // =========================
  const requiredHeaders = ["categoryCode", "assetName"];

  // =========================
  // NORMALIZE DATA
  // =========================
  const normalizeAndValidate = (rawRows) => {
    if (!rawRows || !rawRows.length) {
      throw new Error("No data rows found.");
    }

    const normalized = rawRows.map((row, idx) => {
      const lowerMap = {};

      Object.keys(row || {}).forEach((k) => {
        if (!k) return;

        lowerMap[k.toLowerCase()] = row[k];
      });

      return {
        __row: idx + 2,

        categoryCode: lowerMap["categorycode"] || "",

        assetName: lowerMap["assetname"] || "",

        brand: lowerMap["brand"] || "",

        model: lowerMap["model"] || "",

        locationName: lowerMap["locationname"] || "",

        purchaseDate: lowerMap["purchasedate"] || "",

        quantity: Number(lowerMap["quantity"] || 1),

        status: lowerMap["status"] || "Active",

        remarks: lowerMap["remarks"] || "",
      };
    });

    const hasValid = normalized.some((r) => r.categoryCode || r.assetName);

    if (!hasValid) {
      throw new Error("No valid rows found.");
    }

    return normalized;
  };

  // =========================
  // PARSE EXCEL
  // =========================
  const parseExcel = (arrayBuffer) => {
    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
    });

    const firstSheet = workbook.SheetNames[0];

    const sheet = workbook.Sheets[firstSheet];

    const json = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });

    if (!json.length) {
      throw new Error("Excel sheet is empty.");
    }

    const headersInFile = Object.keys(json[0]).map((h) => h?.toString().trim());

    const lowerHeaders = headersInFile.map((h) => h.toLowerCase());

    const missing = requiredHeaders.filter(
      (h) => !lowerHeaders.includes(h.toLowerCase()),
    );

    if (missing.length > 0) {
      throw new Error(`Missing required columns: ${missing.join(", ")}`);
    }

    return normalizeAndValidate(json);
  };

  // =========================
  // DOWNLOAD TEMPLATE
  // =========================
  const handleDownloadTemplate = () => {
    const wsData = [
      [
        "categoryCode",
        "assetName",
        "brand",
        "model",
        "locationName",
        "purchaseDate",
        "quantity",
        "status",
        "remarks",
      ],

      [
        "IT",
        "Laptop",
        "Dell",
        "Latitude 5420",
        "ICT Office",
        "2026-05-01",
        5,
        "Active",
        "New Stock",
      ],

      [
        "FURN",
        "Office Chair",
        "Uratex",
        "Mesh Chair",
        "Principal Office",
        "2026-05-02",
        10,
        "Active",
        "",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "AssetsTemplate");

    XLSX.writeFile(wb, "edutrack_assets_template.xlsx");
  };

  // =========================
  // FILE CHANGE
  // =========================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setRows([]);
    setImportSummary(null);

    setFileName(file.name);

    setSelectedFile(file);

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext !== "xlsx" && ext !== "xls") {
      setError("Please upload Excel file only.");

      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result;

        const parsed = parseExcel(arrayBuffer);

        setRows(parsed);
      } catch (err) {
        console.error(err);

        setError(err.message || "Failed to parse Excel.");
      }
    };

    reader.onerror = () => {
      setError("Failed to read file.");
    };

    reader.readAsArrayBuffer(file);
  };

  // =========================
  // IMPORT
  // =========================
  const handleImport = async () => {
    if (!selectedFile) {
      setError("Please upload file first.");

      return;
    }

    try {
      setUploading(true);

      setError("");

      const formData = new FormData();

      formData.append("file", selectedFile);

      const { data } = await axiosInstance.post(
        "/asset/import-excel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setImportSummary({
        total: data.total || rows.length,

        success: data.total || rows.length,

        failed: 0,
      });

      alert(`✅ Successfully imported ${data.total || rows.length} assets`);

      setRows([]);

      setSelectedFile(null);

      setFileName("");
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Import failed.");
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Bulk Import Assets
        </h1>
      </div>

      {/* TABS */}
      <PropertyTaggingTabs />

      {/* CARD */}
      <Card className="border border-gray-200 shadow-sm mt-4">
        <CardHeader>
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Upload Excel File
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* INSTRUCTIONS */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Upload an Excel file with the following columns:
            </p>

            <div className="bg-gray-100 border border-gray-200 rounded-md p-2 text-[11px] font-mono text-gray-700">
              categoryCode,assetName,brand,model,locationName,purchaseDate,quantity,status,remarks
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleDownloadTemplate}
              className="mt-1 bg-white border text-xs flex items-center gap-1 hover:bg-gray-50 text-gray-700"
            >
              <Download className="w-3 h-3" />
              Download Template
            </Button>
          </div>

          {/* FILE */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer">
              <Input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />

              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-sm hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                Choose File
              </span>
            </label>

            {fileName && (
              <span className="text-xs text-gray-600 truncate max-w-xs">
                Selected: <span className="font-medium">{fileName}</span>
              </span>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />

              <span>{error}</span>
            </div>
          )}

          {/* SUMMARY */}
          {importSummary && (
            <div className="text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-2 space-y-1">
              <div className="flex items-center gap-1 text-gray-700">
                <CheckCircle2 className="w-3 h-3" />

                <span className="font-semibold">Import Summary</span>
              </div>

              <p>
                Total Rows:{" "}
                <span className="font-medium">{importSummary.total}</span>
              </p>

              <p className="text-green-700">
                Success:{" "}
                <span className="font-medium">{importSummary.success}</span>
              </p>

              <p className="text-red-700">
                Failed:{" "}
                <span className="font-medium">{importSummary.failed}</span>
              </p>
            </div>
          )}

          {/* PREVIEW */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Previewing{" "}
                  <span className="font-semibold">{rows.length}</span> row(s)
                </p>

                <Button
                  size="sm"
                  className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-1"
                  onClick={handleImport}
                  disabled={uploading}
                >
                  <CheckCircle2 className="w-4 h-4" />

                  {uploading ? "Importing..." : "Import Assets"}
                </Button>
              </div>

              {/* TABLE */}
              <div className="border rounded-md overflow-auto max-h-96 text-xs">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">#</th>

                      <th className="border px-2 py-1">Category</th>

                      <th className="border px-2 py-1">Asset Name</th>

                      <th className="border px-2 py-1">Brand</th>

                      <th className="border px-2 py-1">Model</th>

                      <th className="border px-2 py-1">Location</th>

                      <th className="border px-2 py-1">Purchase Date</th>

                      <th className="border px-2 py-1">Quantity</th>

                      <th className="border px-2 py-1">Status</th>

                      <th className="border px-2 py-1">Remarks</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border px-2 py-1">{idx + 1}</td>

                        <td className="border px-2 py-1">{row.categoryCode}</td>

                        <td className="border px-2 py-1">{row.assetName}</td>

                        <td className="border px-2 py-1">{row.brand}</td>

                        <td className="border px-2 py-1">{row.model}</td>

                        <td className="border px-2 py-1">{row.locationName}</td>

                        <td className="border px-2 py-1">{row.purchaseDate}</td>

                        <td className="border px-2 py-1">{row.quantity}</td>

                        <td className="border px-2 py-1">{row.status}</td>

                        <td className="border px-2 py-1">{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
