"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import PropertyTaggingTabs from "@/pages/PropertyTagging/PropertyTaggingTabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, AlertTriangle, Download } from "lucide-react";
import { canEditPropertyTagging } from "@/utils/roles";

export default function BulkImportAssets() {
  const navigate = useNavigate();

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const role = user?.role;

  useEffect(() => {
    if (!canEditPropertyTagging(role)) {
      navigate("/property-tagging");
    }
  }, [role, navigate]);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  
  
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          axiosInstance.get("/categories"),
          axiosInstance.get("/locations/all"),
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

  
  
  
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((c) =>
      map.set((c.name || "").toUpperCase().trim(), c._id),
    );
    return map;
  }, [categories]);

  const locationMap = useMemo(() => {
    const map = new Map();
    locations.forEach((l) =>
      map.set((l.name || "").toUpperCase().trim(), l._id),
    );
    return map;
  }, [locations]);

  
  
  
  const normalize = (data) => {
    return data.map((r, i) => {
      const map = {};
      Object.keys(r).forEach((k) => (map[k.toLowerCase()] = r[k]));

      const category = (map.category || "").toString().toUpperCase().trim();
      const location = (map.location || "").toString().toUpperCase().trim();

      const categoryId = categoryMap.get(category) || null;
      const locationId = locationMap.get(location) || null;

      const errors = {
        category: category
          ? !categoryId
            ? "Invalid category"
            : null
          : "Required",
        location: location
          ? !locationId
            ? "Invalid location"
            : null
          : "Required",
      };

      return {
        __row: i + 2,
        assetName: (map.assetname || "").toString().toUpperCase(),
        brand: (map.brand || "").toString().toUpperCase(),
        model: (map.model || "").toString().toUpperCase(),
        status: (map.status || "ACTIVE").toString().toUpperCase(),
        purchaseDate: map.purchasedate || "",
        remarks: (map.remarks || "").toString().toUpperCase(),

        category,
        location,
        categoryId,
        locationId,

        __errors: errors,
        __isValid: !errors.category && !errors.location,
      };
    });
  };

  
  
  
  const parseExcel = (buffer) => {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!json.length) throw new Error("Empty file");

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
        const parsed = parseExcel(ev.target.result);
        setRows(parsed);
      } catch (err) {
        setError(err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  
  
  
  const handleImport = async () => {
    if (!rows.length) return setError("No data");

    const invalid = rows.filter((r) => !r.__isValid);

    if (invalid.length) {
      return setError("Some rows are invalid. Fix errors before importing.");
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

      const res = await axiosInstance.post("/asset/assets/bulk-create", {
        assets: payload,
      });

      const data = res.data; 

      setRows([]);
      setFileName("");
      setError("");

      
      console.log("IMPORT RESPONSE:", data);

      
      toast.success("Import completed successfully", {
        description: `${data?.count ?? 0} assets imported.`,
      });

      
      if (data?.failed > 0) {
        toast.warning("Some rows failed", {
          description: `${data.failed} rows were not imported.`,
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Import failed";

      setError(msg);

      toast.error("Import failed", {
        description: msg,
      });

      console.error("IMPORT ERROR:", err);
    } finally {
      setUploading(false);
    }
  };
  
  
  
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
        "ICT OFFICE",
        "ACTIVE",
        "2026-01-01",
        "NEW ASSET",
      ],
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "asset_template.xlsx");
  };

  
  
  
  return (
    <main className="p-6 space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Property Tagging
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Bulk Import Assets
              </h1>
            </div>
          </div>
        </div>

      <PropertyTaggingTabs />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-gray-600">
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Import Assets
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {}
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

          {}
          {error && (
            <div className="text-xs text-red-600 flex gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {}
          {rows.length > 0 && (
            <div className="border rounded-md overflow-auto max-h-96">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100 sticky top-0 z-10">
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
                    <th>Errors</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{r.assetName}</td>
                      <td>{r.brand}</td>
                      <td>{r.model}</td>
                      <td
                        className={
                          !r.__errors.category
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {r.category}
                      </td>
                      <td
                        className={
                          !r.__errors.location
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {r.location}
                      </td>
                      <td>{r.status}</td>
                      <td>{r.purchaseDate}</td>
                      <td>{r.remarks}</td>
                      <td
                        className={
                          r.__errors.category || r.__errors.location
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {r.__errors.category || r.__errors.location || "OK"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {}
          <Button
            onClick={handleImport}
            disabled={uploading}
            className="bg-[#800000] text-white"
          >
            {uploading ? "Importing..." : "Import Assets"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
