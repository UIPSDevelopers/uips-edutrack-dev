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
  // =========================
  // STATE
  // =========================
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("assets");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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
        : result.data || result.items || [];

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
  // HEADERS
  // =========================
  const headers = () => {
    if (type === "assets")
      return ["Serial", "Name", "Category", "Location", "Status"];

    if (type === "history")
      return ["Asset", "Name", "Action", "Location Change", "Date"];

    if (type === "services") return ["Asset", "Name", "Service", "Cost", "By"];

    return [];
  };

  // =========================
  // ROWS
  // =========================
  const rows = () =>
    data.map((row, i) => {
      if (type === "assets") {
        return (
          <tr key={i} className="border-b hover:bg-gray-50">
            <td className="p-3">{row.serialNo}</td>
            <td className="p-3 font-medium text-[#800000]">{row.assetName}</td>
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
            <td className="p-3">{new Date(row.createdAt).toLocaleString()}</td>
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

  // =========================
  // UI
  // =========================
  return (
        <main className="p-6 space-y-6 overflow-y-auto">
          {/* HEADER */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Asset Reports
            </h1>
            <p className="text-sm text-gray-500">
              Generate and export asset-related reports
            </p>
          </div>

          {/* TABS */}
          <PropertyTaggingTabs />

          {/* FILTER CARD */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">
                Report Filters
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* FILTER ROW */}
              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  <option value="assets">Assets</option>
                  <option value="history">History</option>
                  <option value="services">Services</option>
                </select>

                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-auto"
                />

                <span className="text-gray-400 text-sm">to</span>

                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-auto"
                />

                <Button
                  onClick={fetchReport}
                  disabled={loading}
                  className="bg-[#800000] hover:bg-[#a10000] flex gap-2"
                >
                  <FileText size={16} />
                  {loading ? "Loading..." : "Generate"}
                </Button>
              </div>

              {/* EXPORT ROW */}
              {data.length > 0 && (
                <div className="flex justify-end pt-3 border-t">
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
                      {headers().map((h) => (
                        <th key={h} className="p-3 border-b">
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
        </main>
  );
}
