"use client";

import React, { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Download, FileText } from "lucide-react";
import axiosInstance from "@/lib/axios";
import * as XLSX from "xlsx";

export default function AssetReports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("assets");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [totalRecords, setTotalRecords] = useState(0);

  // =========================
  // API ROUTES
  // =========================
  const buildUrl = () => {
    if (type === "assets") return "/reports/assets";
    if (type === "history") return "/reports/history";
    if (type === "services") return "/reports/services";
    return "/reports/assets";
  };

  // =========================
  // FETCH REPORT
  // =========================
  const handleGenerate = async () => {
    setLoading(true);

    try {
      const url = buildUrl();
      const params = {};

      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);

        params.from = fromDate.toISOString();
        params.to = toDate.toISOString();
      }

      const res = await axiosInstance.get(url, { params });
      const result = res.data;

      const list = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.items)
            ? result.items
            : [];

      setData(list);
      setTotalRecords(list.length || 0);
    } catch (err) {
      console.error(err);
      alert("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // EXPORT EXCEL
  // =========================
  const exportExcel = () => {
    if (!data.length) return alert("No data to export");

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Asset Report");

    XLSX.writeFile(
      wb,
      `${type}_report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // =========================
  // HEADERS
  // =========================
  const renderHeaders = () => {
    if (type === "assets")
      return ["Serial", "Name", "Category", "Location", "Status"];

    if (type === "history")
      return ["Asset", "Name", "Action", "Change", "Date"];

    if (type === "services") return ["Asset", "Name", "Service", "Cost", "By"];

    return [];
  };

  // =========================
  // ROWS
  // =========================
  const renderRows = () => {
    return data.map((row, i) => {
      if (type === "assets") {
        return (
          <tr key={i} className="border-b hover:bg-gray-50">
            <td className="p-3 font-medium text-[#800000]">{row.serialNo}</td>
            <td className="p-3">{row.assetName}</td>
            <td className="p-3">{row.categoryId?.name || "-"}</td>
            <td className="p-3">{row.locationId?.name || "-"}</td>
            <td className="p-3">{row.status}</td>
          </tr>
        );
      }

      if (type === "history") {
        return (
          <tr key={i} className="border-b hover:bg-gray-50">
            <td className="p-3">{row.assetId?.serialNo}</td>
            <td className="p-3">{row.assetId?.assetName}</td>
            <td className="p-3">{row.actionType}</td>
            <td className="p-3">
              {row.changes?.location
                ? `${row.changes.location.old || "-"} → ${row.changes.location.new || "-"}`
                : "-"}
            </td>
            <td className="p-3">
              {new Date(row.createdAt).toLocaleDateString()}
            </td>
          </tr>
        );
      }

      if (type === "services") {
        return (
          <tr key={i} className="border-b hover:bg-gray-50">
            <td className="p-3">{row.assetId?.serialNo}</td>
            <td className="p-3">{row.assetId?.assetName}</td>
            <td className="p-3">{row.serviceType}</td>
            <td className="p-3">AED {row.cost}</td>
            <td className="p-3">{row.performedBy}</td>
          </tr>
        );
      }

      return null;
    });
  };

  // =========================
  // UI (MATCH PROPERTY TAGGING STYLE)
  // =========================
  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Property Tagging Reports</h1>

        <Button
          onClick={exportExcel}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </Button>
      </div>

      {/* FILTER CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            Report Filters
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* TYPE */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="assets">Assets</option>
              <option value="history">History</option>
              <option value="services">Services</option>
            </select>

            {/* DATE */}
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />

            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />

            {/* GENERATE */}
            <Button
              onClick={handleGenerate}
              className="bg-[#800000] hover:bg-[#a10000] flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {loading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            Results ({totalRecords})
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {data.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No data found.
            </p>
          ) : (
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-100 text-left">
                  {renderHeaders().map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>{renderRows()}</tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
