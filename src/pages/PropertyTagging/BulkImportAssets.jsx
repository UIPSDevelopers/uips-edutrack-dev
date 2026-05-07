"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import axiosInstance from "@/lib/axios";

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

export default function BulkImportAssets() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState(null);

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  // =========================
  // SAFE FETCH (FIX .map ERROR)
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          axiosInstance.get("/categories"),
          axiosInstance.get("/locations"),
        ]);

        setCategories(
          Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || [],
        );

        setLocations(
          Array.isArray(locRes.data) ? locRes.data : locRes.data?.data || [],
        );
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
  }, []);

  // =========================
  // VALIDATION MAPS
  // =========================
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.name?.toLowerCase(), c._id));
    return map;
  }, [categories]);

  const locationMap = useMemo(() => {
    const map = new Map();
    locations.forEach((l) => map.set(l.name?.toLowerCase(), l._id));
    return map;
  }, [locations]);

  // =========================
  // NORMALIZE + REAL-TIME VALIDATION
  // =========================
  const normalize = (data) => {
    return data.map((r, i) => {
      const map = {};
      Object.keys(r).forEach((k) => (map[k.toLowerCase()] = r[k]));

      const category = map.category?.toLowerCase().trim();
      const location = map.location?.toLowerCase().trim();

      const categoryId = categoryMap.get(category) || null;
      const locationId = locationMap.get(location) || null;

      return {
        __row: i + 2,

        assetName: map.assetname || "",
        brand: map.brand || "",
        model: map.model || "",
        status: map.status || "Active",
        purchaseDate: map.purchasedate || "",
        remarks: map.remarks || "",

        category,
        location,

        categoryId,
        locationId,

        __errors: {
          category: !categoryId ? "Invalid category" : null,
          location: !locationId ? "Invalid location" : null,
        },
      };
    });
  };

  // =========================
  // EXCEL PARSER
  // =========================
  const parseExcel = (buffer) => {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!json.length) throw new Error("Empty file");

    return normalize(json);
  };

  // =========================
  // FILE HANDLER
  // =========================
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    const reader = new FileReader();

    reader.onload = (ev) => {
      try {
        const parsed = parseExcel(ev.target.result);
        setRows(parsed);
      } catch (err) {
        setError(err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // =========================
  // IMPORT (ONLY VALID ROWS)
  // =========================
  const handleImport = async () => {
    if (!rows.length) return setError("No data");

    const invalid = rows.filter((r) => !r.categoryId || !r.locationId);

    if (invalid.length) {
      return setError("Fix invalid category/location before importing.");
    }

    try {
      setUploading(true);

      const payload = rows.map((r) => ({
        assetName: r.assetName,
        brand: r.brand,
        model: r.model,
        status: r.status,
        purchaseDate: r.purchaseDate,
        remarks: r.remarks,
        categoryId: r.categoryId,
        locationId: r.locationId,
      }));

      const { data } = await axiosInstance.post("/asset/bulk-import", {
        assets: payload,
      });

      setSummary(data);
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
  const handleTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "assetName",
        "brand",
        "model",
        "category",
        "location",
        "status",
        "purchaseDate",
        "remarks",
      ],
      [
        "Laptop",
        "Dell",
        "Latitude",
        "IT",
        "ICT Office",
        "Active",
        "2026-01-01",
        "New asset",
      ],
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "asset_template.xlsx");
  };

  // =========================
  // UI
  // =========================
  return (
    <main className="p-6 space-y-6">
      <PropertyTaggingTabs />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-gray-600">
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Import Assets
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* FILE */}
          <div className="flex gap-3 items-center">
            <label className="cursor-pointer">
              <Input type="file" className="hidden" onChange={handleFile} />
              <span className="px-3 py-2 border rounded-md flex items-center gap-2 text-sm">
                <Upload className="w-4 h-4" />
                Choose File
              </span>
            </label>

            {fileName && <span className="text-xs">{fileName}</span>}

            <Button
              onClick={handleTemplate}
              variant="outline"
              size="sm"
              className="ml-auto flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Template
            </Button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="text-xs text-red-600 flex gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* TABLE */}
          {rows.length > 0 && (
            <div className="border rounded-md overflow-auto max-h-96">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1 border">#</th>
                    <th className="px-2 py-1 border">Asset Name</th>
                    <th className="px-2 py-1 border">Brand</th>
                    <th className="px-2 py-1 border">Model</th>
                    <th className="px-2 py-1 border">Category</th>
                    <th className="px-2 py-1 border">Location</th>
                    <th className="px-2 py-1 border">Status</th>
                    <th className="px-2 py-1 border">Purchase Date</th>
                    <th className="px-2 py-1 border">Remarks</th>
                    <th className="px-2 py-1 border">Validation</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border px-2 py-1">{i + 1}</td>

                      <td className="border px-2 py-1">{r.assetName}</td>
                      <td className="border px-2 py-1">{r.brand}</td>
                      <td className="border px-2 py-1">{r.model}</td>

                      {/* CATEGORY */}
                      <td className="border px-2 py-1">
                        <span
                          className={
                            r.__errors.category
                              ? "text-red-600"
                              : "text-green-700"
                          }
                        >
                          {r.category}
                        </span>
                      </td>

                      {/* LOCATION */}
                      <td className="border px-2 py-1">
                        <span
                          className={
                            r.__errors.location
                              ? "text-red-600"
                              : "text-green-700"
                          }
                        >
                          {r.location}
                        </span>
                      </td>

                      <td className="border px-2 py-1">{r.status}</td>
                      <td className="border px-2 py-1">{r.purchaseDate}</td>
                      <td className="border px-2 py-1">{r.remarks}</td>

                      {/* VALIDATION */}
                      <td className="border px-2 py-1">
                        {r.__errors.category || r.__errors.location ? (
                          <div className="text-red-600 space-y-1">
                            {r.__errors.category && <div>Invalid Category</div>}
                            {r.__errors.location && <div>Invalid Location</div>}
                          </div>
                        ) : (
                          <span className="text-green-600">Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* IMPORT */}
          <Button
            onClick={handleImport}
            disabled={uploading}
            className="bg-[#800000] text-white"
          >
            {uploading ? "Importing..." : "Import Assets"}
          </Button>

          {/* SUMMARY */}
          {summary && (
            <div className="text-xs text-gray-600">
              Imported: {summary.count || 0}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
