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
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheet];

    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

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
  // TEMPLATE
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
        "Active",
        "New Stock",
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
        const parsed = parseExcel(event.target.result);
        setRows(parsed);
      } catch (err) {
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Bulk Import Assets
        </h1>
      </div>

      <PropertyTaggingTabs />

      <Card className="border border-gray-200 shadow-sm mt-4">
        <CardHeader>
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Upload Excel File
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* TEMPLATE */}
          <Button
            type="button"
            size="sm"
            onClick={handleDownloadTemplate}
            className="bg-white border text-xs flex items-center gap-1 hover:bg-gray-50 text-gray-700"
          >
            <Download className="w-3 h-3" />
            Download Template
          </Button>

          {/* FILE */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <Input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="inline-flex items-center gap-2 px-3 py-2 border rounded-md bg-white text-sm hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                Choose File
              </span>
            </label>

            {fileName && (
              <span className="text-xs text-gray-600">{fileName}</span>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div className="text-xs text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* SUMMARY */}
          {importSummary && (
            <div className="text-xs bg-gray-50 p-2 rounded">
              Total: {importSummary.total} <br />
              Success: {importSummary.success} <br />
              Failed: {importSummary.failed}
            </div>
          )}

          {/* TABLE */}
          {rows.length > 0 && (
            <>
              <Button
                onClick={handleImport}
                disabled={uploading}
                className="bg-[#800000] text-white"
              >
                {uploading ? "Importing..." : "Import Assets"}
              </Button>

              <div className="overflow-auto border mt-3">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th>#</th>
                      <th>Category</th>
                      <th>Asset Name</th>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Location</th>
                      <th>Purchase Date</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{row.categoryCode}</td>
                        <td>{row.assetName}</td>
                        <td>{row.brand}</td>
                        <td>{row.model}</td>
                        <td>{row.locationName}</td>
                        <td>{row.purchaseDate}</td>
                        <td>{row.status}</td>
                        <td>{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
