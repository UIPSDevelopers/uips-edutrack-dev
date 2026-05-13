"use client";

import React, { useState } from "react";
import PropertyTaggingTabs from "./PropertyTaggingTabs";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Download, FileText } from "lucide-react";
import axiosInstance from "@/lib/axios";
import * as XLSX from "xlsx";

export default function AssetReports() {
  // =========================
  // STATE
  // =========================
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("SUMMARY");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH REPORT
  // =========================
  const fetchReport = async () => {
    setLoading(true);

    try {
      const params = {
        type,
      };

      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);

        params.from = fromDate.toISOString();
        params.to = toDate.toISOString();
      }

      const res = await axiosInstance.get("/reports/asset", { params });

      setData(res.data?.data || []);
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
  const getHeaders = () => {
    switch (type) {
      case "SUMMARY":
        return ["Asset", "Serial", "Category", "Location", "Status"];

      case "MOVEMENT":
        return ["Asset", "Serial", "Old Location", "New Location", "Date"];

      case "STATUS":
        return ["Asset", "Serial", "Old Status", "New Status", "Date"];

      case "SERVICE":
        return ["Asset", "Serial", "Service Type", "Cost", "Performed By"];

      default:
        return [];
    }
  };

  // =========================
  // ROW RENDER
  // =========================
  const renderRow = (row, i) => {
    const asset = row.assetId;

    // =========================
    // SUMMARY (ASSETS)
    // =========================
    if (type === "SUMMARY") {
      return (
        <tr key={i} className="border-b hover:bg-gray-50">
          <td className="p-3">{asset?.assetName}</td>
          <td className="p-3 font-medium text-[#800000]">{asset?.serialNo}</td>
          <td className="p-3">{asset?.categoryId?.name || "-"}</td>
          <td className="p-3">{asset?.locationId?.name || "-"}</td>
          <td className="p-3">{asset?.status || "-"}</td>
        </tr>
      );
    }

    // =========================
    // MOVEMENT
    // =========================
    if (type === "MOVEMENT") {
      return (
        <tr key={i} className="border-b hover:bg-gray-50">
          <td className="p-3">{asset?.assetName}</td>
          <td className="p-3">{asset?.serialNo}</td>
          <td className="p-3">{row.changes?.location?.old || "-"}</td>
          <td className="p-3">{row.changes?.location?.new || "-"}</td>
          <td className="p-3">{new Date(row.createdAt).toLocaleString()}</td>
        </tr>
      );
    }

    // =========================
    // STATUS
    // =========================
    if (type === "STATUS") {
      return (
        <tr key={i} className="border-b hover:bg-gray-50">
          <td className="p-3">{asset?.assetName}</td>
          <td className="p-3">{asset?.serialNo}</td>
          <td className="p-3">{row.changes?.status?.old || "-"}</td>
          <td className="p-3">{row.changes?.status?.new || "-"}</td>
          <td className="p-3">{new Date(row.createdAt).toLocaleString()}</td>
        </tr>
      );
    }

    // =========================
    // SERVICE
    // =========================
    if (type === "SERVICE") {
      return (
        <tr key={i} className="border-b hover:bg-gray-50">
          <td className="p-3">{asset?.assetName}</td>
          <td className="p-3">{asset?.serialNo}</td>
          <td className="p-3">{row.serviceType}</td>
          <td className="p-3">AED {row.cost}</td>
          <td className="p-3">{row.performedBy}</td>
        </tr>
      );
    }

    return null;
  };

  // =========================
  // UI
  // =========================
  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Asset Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate asset summary, movement, status, and service reports
        </p>
      </div>

      {/* TABS */}
      <PropertyTaggingTabs />

      {/* FILTER */}
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
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="SUMMARY">Summary</option>
              <option value="MOVEMENT">Movement</option>
              <option value="STATUS">Status</option>
              <option value="SERVICE">Service</option>
            </select>

            {/* DATE */}
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />

            <span className="text-gray-400 text-sm">to</span>

            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />

            {/* BUTTON */}
            <Button
              onClick={fetchReport}
              disabled={loading}
              className="bg-[#800000] hover:bg-[#a10000] flex gap-2"
            >
              <FileText size={16} />
              {loading ? "Loading..." : "Generate"}
            </Button>
          </div>

          {/* EXPORT */}
          {data.length > 0 && (
            <div className="flex justify-end mt-4 pt-4 border-t">
              <Button
                onClick={exportExcel}
                className="bg-green-600 hover:bg-green-700 flex gap-2"
              >
                <Download size={16} />
                Export Excel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            Results ({data.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {data.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No data found</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  {getHeaders().map((h) => (
                    <th key={h} className="p-3 border-b">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>{data.map(renderRow)}</tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
