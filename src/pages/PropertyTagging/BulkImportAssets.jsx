"use client";

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import axiosInstance from "@/lib/axios";

import PropertyTaggingTabs from "@/pages/PropertyTagging/PropertyTaggingTabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const requiredHeaders = [
    "assetname",
    "brand",
    "model",
    "category",
    "location",
    "status",
    "purchasedate",
    "remarks",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          axiosInstance.get("/categories"),
          axiosInstance.get("/locations"),
        ]);
        setCategories(catRes.data || []);
        setLocations(locRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const normalize = (data) => {
    return data.map((r, i) => {
      const map = {};
      Object.keys(r).forEach((k) => (map[k.toLowerCase()] = r[k]));

      return {
        __row: i + 2,
        assetName: map.assetname || "",
        brand: map.brand || "",
        model: map.model || "",
        category: map.category || "",
        location: map.location || "",
        status: map.status || "Active",
        purchaseDate: map.purchasedate || "",
        remarks: map.remarks || "",
      };
    });
  };

  const parseExcel = (buffer) => {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!json.length) throw new Error("Empty file");

    const headers = Object.keys(json[0]).map((h) => h.toLowerCase());

    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length) {
      throw new Error("Missing: " + missing.join(", "));
    }

    return normalize(json);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = parseExcel(ev.target.result);
        setRows(data);
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!rows.length) return setError("No data");

    try {
      setUploading(true);

      const payload = rows.map((r) => ({
        assetName: r.assetName,
        brand: r.brand,
        model: r.model,
        category: r.category,
        location: r.location,
        status: r.status,
        purchaseDate: r.purchaseDate,
        remarks: r.remarks,
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

  const handleTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      requiredHeaders,
      [
        "Laptop",
        "Dell",
        "Latitude",
        "IT",
        "ICT Office",
        "Active",
        "2026-01-01",
        "New",
      ],
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "asset_bulk_template.xlsx");
  };

  return (
    <main className="p-6 space-y-6">
      <PropertyTaggingTabs />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-gray-600">
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Import Assets
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
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

          {error && (
            <div className="text-xs text-red-600 flex gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {rows.length > 0 && (
            <div className="border rounded-md overflow-auto max-h-80">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th>#</th>
                    <th>Asset</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Purchase</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td>{i + 1}</td>
                      <td>{r.assetName}</td>
                      <td>{r.brand}</td>
                      <td>{r.model}</td>
                      <td>{r.category}</td>
                      <td>{r.location}</td>
                      <td>{r.status}</td>
                      <td>{r.purchaseDate}</td>
                      <td>{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={uploading}
            className="bg-[#800000] text-white"
          >
            {uploading ? "Importing..." : "Import Assets"}
          </Button>

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
