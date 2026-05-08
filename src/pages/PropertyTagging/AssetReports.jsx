"use client";

import React, { useState } from "react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

import PropertyTaggingTabs from "./PropertyTaggingTabs";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Download, FileText } from "lucide-react";
import axiosInstance from "@/lib/axios";
import * as XLSX from "xlsx";

export default function AssetReports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("assets");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // sidebar state (IMPORTANT for responsiveness)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);
  const closeSidebar = () => setIsSidebarOpen(false);

  // =========================
  // API
  // =========================
  const buildUrl = () => {
    if (type === "assets") return "/reports/assets";
    if (type === "history") return "/reports/history";
    if (type === "services") return "/reports/services";
    return "/reports/assets";
  };

  // =========================
  // FETCH
  // =========================
  const fetchReport = async () => {
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
    } catch (err) {
      console.error(err);
      alert("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // EXPORT
  // =========================
  const exportExcel = () => {
    if (!data.length) return alert("No data to export");

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");

    XLSX.writeFile(
      wb,
      `${type}_report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // =========================
  // TABLE HEADERS
  // =========================
  const headers = () => {
    if (type === "assets")
      return ["Serial", "Name", "Category", "Location", "Status"];
    if (type === "history")
      return ["Asset", "Name", "Action", "Location Change", "Date"];
    if (type === "services")
      return ["Asset", "Name", "Service", "Cost", "By"];
    return [];
  };

  // =========================
  // ROWS
  // =========================
  const rows = () => {
    return data.map((row, i) => {
      if (type === "assets") {
        return (
          <tr key={i} className="border-b hover:bg-gray-50">
            <td className="p-2">{row.serialNo}</td>
            <td className="p-2">{row.assetName}</td>
            <td className="p-2">{row.categoryId?.name || "-"}</td>
            <td className="p-2">{row.locationId?.name || "-"}</td>
            <td className="p-2">{row.status}</td>
          </tr>
        );
      }

      if (type === "history") {
        return (
          <tr key={i} className="border-b hover:bg-gray-50">
            <td className="p-2">{row.assetId?.serialNo}</td>
            <td className="p-2">{row.assetId?.assetName}</td>
            <td className="p-2">{row.actionType}</td>
            <td className="p-2">
              {row.changes?.location
                ? `${row.changes.location.old || "-"} → ${row.changes.location.new || "-"}`
                : "-"}
            </td>
            <td className="p-2">
              {new Date(row.createdAt).toLocaleString()}
            </td>
          </tr>
        );
      }

      if (type === "services") {
        return (
          <tr key={i} className="border-b hover:bg-gray-50">
            <td className="p-2">{row.assetId?.serialNo}</td>
            <td className="p-2">{row.assetId?.assetName}</td>
            <td className="p-2">{row.serviceType}</td>
            <td className="p-2">AED {row.cost}</td>
            <td className="p-2">{row.performedBy}</td>
          </tr>
        );
      }

      return null;
    });
  };

  // =========================
  // UI (MATCHED DESIGN)
  // =========================
  return (
    <div className="flex h-screen bg-gray-50">

      {/* SIDEBAR (FIXED RESPONSIVE FRAME) */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* TOPBAR */}
        <Topbar onToggleSidebar={toggleSidebar} />

        {/* CONTENT */}
        <main className="p-6 space-y-6 overflow-y-auto">

          {/* TITLE (same style as AddLocation) */}
          <div className="mt-2">
            <h1 className="text-2xl font-semibold text-gray-800">
              Asset Reports
            </h1>
          </div>

          {/* TABS (consistent with your system UI) */}
          <PropertyTaggingTabs />

          {/* FILTER CARD */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex gap-4 flex-wrap items-center">

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="assets">Assets</option>
                  <option value="history">History</option>
                  <option value="services">Services</option>
                </select>

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

                <Button
                  onClick={fetchReport}
                  className="bg-[#800000] hover:bg-[#a10000] text-white flex gap-2"
                >
                  <FileText size={16} />
                  {loading ? "Loading..." : "Generate"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* TABLE CARD */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle>Results ({data.length})</CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">

              {data.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  No data found
                </p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      {headers().map((h) => (
                        <th key={h} className="p-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>{rows()}</tbody>
                </table>
              )}

            </CardContent>
          </Card>

          {/* EXPORT */}
          {data.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={exportExcel}
                className="bg-green-600 hover:bg-green-700 flex gap-2"
              >
                <Download size={16} />
                Export Excel
              </Button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}