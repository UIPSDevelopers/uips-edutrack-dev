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

  // REQUIRED HEADERS (NO quantity)
  const requiredHeaders = ["categoryCode", "assetName"];

  // =========================
  // NORMALIZE DATA
  // =========================
  const normalizeAndValidate = (rawRows) => {
    if (!rawRows?.length) throw new Error("No data rows found.");

    return rawRows.map((row, idx) => {
      const map = {};

      Object.keys(row || {}).forEach((k) => {
        map[k.toLowerCase()] = row[k];
      });

      return {
        __row: idx + 2,
        categoryCode: map["categorycode"] || "",
        assetName: map["assetname"] || "",
        brand: map["brand"] || "",
        model: map["model"] || "",
        locationName: map["locationname"] || "",
        purchaseDate: map["purchasedate"] || "",
        status: map["status"] || "Active",
        remarks: map["remarks"] || "",
      };
    });
  };

  // =========================
  // EXCEL PARSE
  // =========================
  const parseExcel = (buffer) => {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!json.length) throw new Error("Excel sheet is empty.");

    const headers = Object.keys(json[0]).map((h) => h.toLowerCase());

    const missing = requiredHeaders.filter(
      (h) => !headers.includes(h.toLowerCase()),
    );

    if (missing.length) {
      throw new Error(`Missing columns: ${missing.join(", ")}`);
    }

    return normalizeAndValidate(json);
  };

  // =========================
  // TEMPLATE
  // =========================
  const handleDownloadTemplate = () => {
    const data = [
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
        "New",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, "edutrack_assets_template.xlsx");
  };

  // =========================
  // FILE HANDLER
  // =========================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setRows([]);
    setImportSummary(null);
    setFileName(file.name);
    setSelectedFile(file);

    const reader = new FileReader();

    reader.onload = (ev) => {
      try {
        setRows(parseExcel(ev.target.result));
      } catch (err) {
        setError(err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // =========================
  // IMPORT
  // =========================
  const handleImport = async () => {
    if (!selectedFile) return setError("Please upload file.");

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const { data } = await axiosInstance.post(
        "/asset/import-excel",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setImportSummary({
        total: data.total || rows.length,
        success: data.total || rows.length,
        failed: 0,
      });

      alert(`Imported ${data.total || rows.length} assets`);

      setRows([]);
      setFileName("");
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Import failed");
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // UI (COPY INVENTORY STYLE EXACTLY)
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
            Upload CSV / Excel File
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* TEMPLATE */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Required columns: categoryCode, assetName
            </p>

            <Button
              type="button"
              size="sm"
              onClick={handleDownloadTemplate}
              className="bg-white border text-xs flex items-center gap-1 hover:bg-gray-50 text-gray-700"
            >
              <Download className="w-3 h-3" />
              Download Template
            </Button>
          </div>

          {/* FILE */}
          <div className="flex items-center gap-3">
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
              <span className="text-xs text-gray-600">{fileName}</span>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div className="text-xs text-red-600 flex items-center gap-2 bg-red-50 p-2 rounded-md border border-red-200">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* PREVIEW */}
          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-600">{rows.length} row(s)</p>

                <Button
                  onClick={handleImport}
                  disabled={uploading}
                  className="bg-[#800000] hover:bg-[#a10000] text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {uploading ? "Importing..." : "Import Assets"}
                </Button>
              </div>

              {/* TABLE (SAME STYLE AS INVENTORY) */}
              <div className="border rounded-md overflow-auto max-h-80">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-left">Asset Name</th>
                      <th className="p-2 text-left">Brand</th>
                      <th className="p-2 text-left">Model</th>
                      <th className="p-2 text-left">Location</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{r.categoryCode}</td>
                        <td className="p-2">{r.assetName}</td>
                        <td className="p-2">{r.brand}</td>
                        <td className="p-2">{r.model}</td>
                        <td className="p-2">{r.locationName}</td>
                        <td className="p-2">{r.status}</td>
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
