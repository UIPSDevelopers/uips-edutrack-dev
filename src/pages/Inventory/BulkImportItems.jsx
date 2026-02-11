"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import InventoryTabs from "@/pages/Inventory/InventoryTabs";
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
import axiosInstance from "@/lib/axios"; // ✅ use axiosInstance so token is sent

export default function BulkImportItems() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  // 🆕 For initial inventory / delivery
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [createInitialDelivery, setCreateInitialDelivery] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  // ✅ added gradeLevel to required headers
  const requiredHeaders = ["itemType", "itemName", "gradeLevel", "sizeOrSource", "barcode"];

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // ---------- Helpers ----------

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

      const quantityRaw = lowerMap["quantity"];
      const quantity =
        quantityRaw === undefined || quantityRaw === null || quantityRaw === ""
          ? 0
          : Number(quantityRaw) || 0;

      return {
        __row: idx + 2, // Excel row number (approx)
        itemType: lowerMap["itemtype"] || "",
        itemName: lowerMap["itemname"] || "",
        gradeLevel: lowerMap["gradelevel"] || "", // 🆕 Grade Level
        sizeOrSource:
          lowerMap["sizeorsource"] || lowerMap["size / source"] || "",
        barcode: lowerMap["barcode"] || "",
        quantity,
      };
    });

    const hasAnyValid = normalized.some(
      (r) => r.itemType || r.itemName || r.barcode
    );
    if (!hasAnyValid) {
      throw new Error("No valid rows found with required columns.");
    }

    return normalized;
  };

  const parseCsv = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row.");
    }

    const headerLine = lines[0];
    const headers = headerLine.split(",").map((h) => h.trim());

    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      throw new Error(
        `Missing required columns: ${missing.join(
          ", "
        )}. Expected: itemType,itemName,gradeLevel,sizeOrSource,barcode`
      );
    }

    const idx = {};
    headers.forEach((h, i) => {
      idx[h] = i;
    });

    const quantityIndex = headers.indexOf("quantity");

    const dataRows = lines.slice(1).map((line, lineIndex) => {
      const cols = line.split(",").map((c) => c.trim());
      if (cols.length === 1 && cols[0] === "") return null;

      let quantity = 0;
      if (quantityIndex !== -1) {
        const qRaw = cols[quantityIndex] || "";
        quantity = qRaw === "" ? 0 : Number(qRaw) || 0;
      }

      return {
        __row: lineIndex + 2,
        itemType: cols[idx.itemType] || "",
        itemName: cols[idx.itemName] || "",
        gradeLevel: cols[idx.gradeLevel] || "", // 🆕 Grade Level
        sizeOrSource: cols[idx.sizeOrSource] || "",
        barcode: cols[idx.barcode] || "",
        quantity,
      };
    });

    const filtered = dataRows.filter(Boolean);
    if (!filtered.length) {
      throw new Error("No valid rows found in CSV.");
    }
    return filtered;
  };

  const parseExcel = (arrayBuffer) => {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (!json.length) {
      throw new Error("Excel sheet is empty.");
    }

    const headersInFile = Object.keys(json[0]).map((h) => h?.toString().trim());
    const lowerHeaders = headersInFile.map((h) => h.toLowerCase());

    const missing = requiredHeaders.filter(
      (h) => !lowerHeaders.includes(h.toLowerCase())
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required columns in Excel: ${missing.join(
          ", "
        )}. Expected headers (case-insensitive): itemType, itemName, gradeLevel, sizeOrSource, barcode`
      );
    }

    return normalizeAndValidate(json);
  };

  const handleDownloadTemplate = () => {
    const wsData = [
      ["itemType", "itemName", "gradeLevel", "sizeOrSource", "barcode", "quantity"],
      ["P.E. Uniform", "PE T-Shirt", "Grade 7", "Small", "ITEM-000001", 10],
      ["Regular Uniform", "Formal Pants", "Grade 9", "Size 32", "ITEM-000002", 5],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ItemsTemplate");

    XLSX.writeFile(wb, "edutrack_items_template.xlsx");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setRows([]);
    setImportSummary(null);
    setFileName(file.name);

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const parsed = parseCsv(text);
          setRows(parsed);
        } catch (err) {
          console.error(err);
          setError(err.message || "Failed to parse CSV file.");
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
      };
      reader.readAsText(file);
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target.result;
          const parsed = parseExcel(arrayBuffer);
          setRows(parsed);
        } catch (err) {
          console.error(err);
          setError(err.message || "Failed to parse Excel file.");
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError("Unsupported file type. Please upload .csv, .xlsx, or .xls");
    }
  };

  // ---------- Import handler (uses axiosInstance) ----------

  const handleImport = async () => {
    if (!rows.length) {
      setError("No data to import. Please upload a file first.");
      return;
    }

    setError("");
    setUploading(true);
    setImportSummary(null);

    const addedBy =
      user && user.firstname
        ? `${user.firstname} ${user.lastname || ""}`.trim()
        : "Unknown User";

    try {
      const payloadItems = rows.map((r) => ({
        itemType: r.itemType,
        itemName: r.itemName,
        gradeLevel: r.gradeLevel, // 🆕 include Grade Level
        sizeOrSource: r.sizeOrSource,
        barcode: r.barcode,
        quantity: Number(r.quantity) || 0,
        addedBy,
      }));

      const payload = {
        items: payloadItems,
        createInitialDelivery,
        deliveryNumber: createInitialDelivery
          ? deliveryNumber.trim() || null
          : null,
      };

      const { data } = await axiosInstance.post("/inventory/bulk-add", payload);

      const failedFromServer =
        data.failedRows || data.failed || data.errors || [];

      if (!failedFromServer.length) {
        const successCount = data.count || payloadItems.length;
        setImportSummary({
          total: payloadItems.length,
          success: successCount,
          failed: 0,
          details: [],
        });
        alert(`✅ Successfully imported ${successCount} item(s).`);
        setRows([]);
        setFileName("");
        setDeliveryNumber("");
        setCreateInitialDelivery(false);
      } else {
        const failedOnly = failedFromServer
          .map((f) => {
            const idx =
              typeof f.index === "number"
                ? f.index
                : typeof f.rowIndex === "number"
                ? f.rowIndex
                : typeof f.row === "number"
                ? f.row
                : null;

            if (idx == null || idx < 0 || idx >= rows.length) return null;

            const reason =
              f.reason || f.message || "Import error (no details provided)";

            return {
              ...rows[idx],
              __error: reason,
            };
          })
          .filter(Boolean);

        const failedCount = failedOnly.length;
        const successCount = payloadItems.length - failedCount;

        setImportSummary({
          total: payloadItems.length,
          success: successCount,
          failed: failedCount,
          details: failedOnly.map((r) => ({
            row: r.__row,
            itemName: r.itemName,
            gradeLevel: r.gradeLevel, // 🆕 Grade Level
            barcode: r.barcode,
            error: r.__error,
          })),
        });

        setRows(failedOnly);

        alert(
          `⚠ Import completed with some errors.\nSuccess: ${successCount}, Failed: ${failedCount}.\nFailed rows are shown in the table.`
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error during bulk import."
      );
    } finally {
      setUploading(false);
    }
  };

  // ---------- UI ----------

  return (
    <main className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Bulk Import Items
        </h1>
      </div>

      <InventoryTabs />

      <Card className="border border-gray-200 shadow-sm mt-4">
        <CardHeader>
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Upload CSV / Excel File
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Instructions + template */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Upload a <span className="font-mono">.csv, .xlsx, or .xls</span>{" "}
              file with the following columns:
            </p>
            <div className="bg-gray-100 border border-gray-200 rounded-md p-2 text-[11px] font-mono text-gray-700">
              itemType,itemName,gradeLevel,sizeOrSource,barcode,quantity
              <br />
              P.E. Uniform,PE T-Shirt,Grade 7,Small,ITEM-000001,10
              <br />
              Regular Uniform,Formal Pants,Grade 9,Size 32,ITEM-000002,5
            </div>
            <p className="text-[11px] text-gray-500">
              <b>Note:</b> <code>quantity</code> is optional. If omitted or
              blank, it will be treated as <b>0</b>.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadTemplate}
              className="mt-1 bg-white border text-xs flex items-center gap-1 hover:bg-gray-50 text-gray-700"
            >
              <Download className="w-3 h-3" />
              Download Template (.xlsx)
            </Button>
          </div>

          {/* 🆕 Initial stock / delivery options */}
          <div className="grid gap-2 sm:grid-cols-[auto,1fr] items-center border border-gray-200 rounded-md p-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <input
                id="createInitialDelivery"
                type="checkbox"
                className="h-4 w-4"
                checked={createInitialDelivery}
                onChange={(e) => setCreateInitialDelivery(e.target.checked)}
              />
              <label
                htmlFor="createInitialDelivery"
                className="text-xs text-gray-800"
              >
                Also create{" "}
                <span className="font-semibold">Initial Stock-In</span> delivery
                with these quantities
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 whitespace-nowrap">
                Delivery No.
              </span>
              <Input
                placeholder="e.g. INIT-2025-001"
                value={deliveryNumber}
                disabled={!createInitialDelivery}
                onChange={(e) => setDeliveryNumber(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* File upload */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer">
              <Input
                type="file"
                accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Import summary */}
          {importSummary && (
            <div className="text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-2 space-y-1">
              <div className="flex items-center gap-1 text-gray-700">
                <CheckCircle2 className="w-3 h-3" />
                <span className="font-semibold">Import Summary</span>
              </div>
              <p>
                Total rows sent:{" "}
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
              {importSummary.details?.length > 0 && (
                <div className="mt-1 max-h-32 overflow-auto border-t border-gray-200 pt-1">
                  {importSummary.details.map((d, i) => (
                    <div key={i} className="mb-1">
                      <span className="font-mono text-[11px] text-gray-600">
                        Row {d.row || "?"} – {d.itemName} ({d.gradeLevel}) (
                        {d.barcode}):
                      </span>{" "}
                      <span className="text-[11px] text-red-700">
                        {d.error}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Previewing{" "}
                  <span className="font-semibold">{rows.length}</span> row(s)
                  {rows.some((r) => r.__error)
                    ? " (only failed rows are shown – fix and re-import)."
                    : " ready for import."}
                </p>
                <Button
                  size="sm"
                  className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-1"
                  onClick={handleImport}
                  disabled={uploading}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {uploading ? "Importing..." : "Import Items"}
                </Button>
              </div>

              <div className="border rounded-md overflow-auto max-h-80 text-xs">
                <table className="min-w-full border-collapse uppercase">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1 text-left">#</th>
                      <th className="border px-2 py-1 text-left">Item Type</th>
                      <th className="border px-2 py-1 text-left">Item Name</th>
                      <th className="border px-2 py-1 text-left">Grade Level</th> {/* 🆕 */}
                      <th className="border px-2 py-1 text-left">
                        Size / Source
                      </th>
                      <th className="border px-2 py-1 text-left">Barcode</th>
                      <th className="border px-2 py-1 text-left">Quantity</th>
                      <th className="border px-2 py-1 text-left">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border px-2 py-1">{idx + 1}</td>
                        <td className="border px-2 py-1">{row.itemType}</td>
                        <td className="border px-2 py-1">{row.itemName}</td>
                        <td className="border px-2 py-1">{row.gradeLevel}</td> {/* 🆕 */}
                        <td className="border px-2 py-1">{row.sizeOrSource}</td>
                        <td className="border px-2 py-1">{row.barcode}</td>
                        <td className="border px-2 py-1">
                          {Number(row.quantity) || 0}
                        </td>
                        <td className="border px-2 py-1">
                          {row.__error && (
                            <span className="text-[11px] text-red-700">
                              {row.__error}
                            </span>
                          )}
                        </td>
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
