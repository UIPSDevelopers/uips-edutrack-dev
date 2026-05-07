"use client";

import React, { useState, useEffect } from "react";
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

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  // =========================
  // FETCH DROPDOWNS
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          axiosInstance.get("/categories"),
          axiosInstance.get("/locations"),
        ]);

        setCategories(catRes.data.data || []);
        setLocations(locRes.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  // =========================
  // REQUIRED HEADERS
  // =========================
  const requiredHeaders = ["categorycode", "assetname"];

  // =========================
  // HELPERS
  // =========================
  const getCategoryId = (code) =>
    categories.find((c) => c.code === code)?._id || null;

  const getLocationId = (name) =>
    locations.find((l) => l.name === name)?._id || null;

  // =========================
  // NORMALIZE EXCEL
  // =========================
  const normalize = (json) => {
    return json.map((row, idx) => {
      const map = {};
      Object.keys(row).forEach((k) => {
        map[k.toLowerCase()] = row[k];
      });

      return {
        __row: idx + 2,

        categoryCode: map.categorycode || "",
        categoryId: getCategoryId(map.categorycode),

        assetName: map.assetname || "",
        brand: map.brand || "",
        model: map.model || "",

        locationName: map.locationname || "",
        locationId: getLocationId(map.locationname),

        purchaseDate: map.purchasedate || "",
        status: map.status || "Active",
        remarks: map.remarks || "",
      };
    });
  };

  // =========================
  // PARSE EXCEL
  // =========================
  const parseExcel = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const parsed = normalize(json);

        setRows(parsed);
        setFileName(file.name);
      } catch (err) {
        setError("Failed to parse Excel file.");
      }
    };

    reader.readAsArrayBuffer(file);
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

    const ext = file.name.split(".").pop().toLowerCase();

    if (!["xlsx", "xls"].includes(ext)) {
      setError("Only Excel files allowed");
      return;
    }

    parseExcel(file);
  };

  // =========================
  // IMPORT (SIMPLE BULK)
  // =========================
  const handleImport = async () => {
    if (!rows.length) {
      setError("No data to import");
      return;
    }

    try {
      setUploading(true);

      const payload = {
        assets: rows.map((r) => ({
          categoryId: r.categoryId,
          locationId: r.locationId,
          assetName: r.assetName,
          brand: r.brand,
          model: r.model,
          purchaseDate: r.purchaseDate,
          status: r.status,
          remarks: r.remarks,
        })),
      };

      const { data } = await axiosInstance.post("/asset/bulk-create", payload);

      setImportSummary({
        total: rows.length,
        success: data.assets.length,
        failed: 0,
      });

      alert(`✅ Imported ${data.assets.length} assets`);

      setRows([]);
      setFileName("");
    } catch (err) {
      setError(err.response?.data?.message || "Import failed");
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // TEMPLATE
  // =========================
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
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
        "Latitude",
        "ICT Office",
        "2026-01-01",
        "Active",
        "",
      ],
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, "asset-template.xlsx");
  };

  // =========================
  // UI
  // =========================
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Bulk Import Assets</h1>

      <PropertyTaggingTabs />

      <Card>
        <CardHeader>
          <CardTitle>Upload Excel</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          <label className="cursor-pointer">
            <Input type="file" className="hidden" onChange={handleFileChange} />
            <span className="px-3 py-2 border rounded-md inline-flex gap-2">
              <Upload className="w-4 h-4" />
              Upload Excel
            </span>
          </label>

          {fileName && <p className="text-sm">File: {fileName}</p>}

          {error && (
            <div className="text-red-600 text-sm flex gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {rows.length > 0 && (
            <>
              <Button
                onClick={handleImport}
                disabled={uploading}
                className="bg-[#800000] text-white"
              >
                {uploading ? "Importing..." : "Import Assets"}
              </Button>

              <table className="w-full border text-xs mt-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th>#</th>
                    <th>Category</th>
                    <th>Asset</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{r.categoryCode}</td>
                      <td>{r.assetName}</td>
                      <td>{r.locationName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {importSummary && (
            <div className="text-green-600 text-sm flex gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Imported {importSummary.success} assets
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
