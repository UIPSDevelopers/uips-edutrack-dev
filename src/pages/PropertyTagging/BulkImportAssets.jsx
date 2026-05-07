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

  // =========================
  // REQUIRED HEADERS
  // =========================
  const requiredHeaders = ["categoryCode", "assetName"];

  // =========================
  // NORMALIZE
  // =========================
  const normalizeAndValidate = (rawRows) => {
    if (!rawRows?.length) {
      throw new Error("No data rows found.");
    }

    const normalized = rawRows.map((row, idx) => {
      const lower = {};

      Object.keys(row || {}).forEach((k) => {
        lower[k.toLowerCase()] = row[k];
      });

      return {
        __row: idx + 2,
        categoryCode: lower["categorycode"] || "",
        assetName: lower["assetname"] || "",
        brand: lower["brand"] || "",
        model: lower["model"] || "",
        locationName: lower["locationname"] || "",
        purchaseDate: lower["purchasedate"] || "",
        status: lower["status"] || "Active",
        remarks: lower["remarks"] || "",
      };
    });

    const hasValid = normalized.some((r) => r.categoryCode || r.assetName);

    if (!hasValid) throw new Error("No valid rows found.");

    return normalized;
  };

  // =========================
  // PARSE EXCEL
  // =========================
  const parseExcel = (buffer) => {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!json.length) throw new Error("Excel is empty.");

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
      ["IT", "Laptop", "Dell", "Latitude", "ICT", "2026-01-01", "Active", ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");

    XLSX.writeFile(wb, "assets_template.xlsx");
  };

  // =========================
  // FILE UPLOAD
  // =========================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setRows([]);
    setImportSummary(null);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const parsed = parseExcel(event.target.result);
        setRows(parsed);
      } catch (err) {
        setError(err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // =========================
  // IMPORT (REAL BACKEND)
  // =========================
  const handleImport = async () => {
    if (!rows.length) {
      setError("No data to import.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const payload = {
        assets: rows.map((r) => ({
          categoryCode: r.categoryCode,
          assetName: r.assetName,
          brand: r.brand,
          model: r.model,
          locationName: r.locationName,
          purchaseDate: r.purchaseDate,
          status: r.status,
          remarks: r.remarks,
        })),
      };

      const { data } = await axiosInstance.post(
        "/asset/assets/bulk-create",
        payload,
      );

      setImportSummary({
        total: data.assets.length,
        success: data.assets.length,
        failed: 0,
      });

      alert(`Imported ${data.assets.length} assets`);

      setRows([]);
      setFileName("");
    } catch (err) {
      setError(err.response?.data?.message || "Import failed");
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // CLEAN TABLE STYLE
  // =========================
  const tableCell = "px-3 py-2 border-b text-xs text-gray-700";
  const headerCell =
    "px-3 py-2 text-left text-xs font-semibold text-gray-600 bg-gray-100";

  return (
    <main className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Bulk Import Assets</h1>
      </div>

      <PropertyTaggingTabs />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Upload Excel
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* TEMPLATE */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Required columns:</p>

            <div className="text-[11px] bg-gray-100 p-2 rounded font-mono">
              categoryCode, assetName, brand, model, locationName, purchaseDate,
              status, remarks
            </div>

            <Button
              size="sm"
              onClick={handleDownloadTemplate}
              className="bg-white border text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Template
            </Button>
          </div>

          {/* FILE */}
          <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />

          {fileName && (
            <p className="text-xs text-gray-600">File: {fileName}</p>
          )}

          {/* ERROR */}
          {error && (
            <div className="text-xs text-red-600 flex gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* TABLE */}
          {rows.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={headerCell}>#</th>
                    <th className={headerCell}>Category</th>
                    <th className={headerCell}>Asset</th>
                    <th className={headerCell}>Brand</th>
                    <th className={headerCell}>Model</th>
                    <th className={headerCell}>Location</th>
                    <th className={headerCell}>Purchase</th>
                    <th className={headerCell}>Status</th>
                    <th className={headerCell}>Remarks</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className={tableCell}>{i + 1}</td>
                      <td className={tableCell}>{r.categoryCode}</td>
                      <td className={tableCell}>{r.assetName}</td>
                      <td className={tableCell}>{r.brand}</td>
                      <td className={tableCell}>{r.model}</td>
                      <td className={tableCell}>{r.locationName}</td>
                      <td className={tableCell}>{r.purchaseDate}</td>
                      <td className={tableCell}>{r.status}</td>
                      <td className={tableCell}>{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* IMPORT */}
          {rows.length > 0 && (
            <Button
              onClick={handleImport}
              disabled={uploading}
              className="bg-[#800000] text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {uploading ? "Importing..." : "Import Assets"}
            </Button>
          )}

          {/* SUMMARY */}
          {importSummary && (
            <div className="text-xs text-gray-600">
              Imported: {importSummary.total}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
