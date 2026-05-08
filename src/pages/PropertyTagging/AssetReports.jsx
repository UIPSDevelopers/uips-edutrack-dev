"use client";

import React, { useState } from "react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const isAll = limit === 0;

  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleToggleSidebar = () => setIsSidebarOpen((p) => !p);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // =========================
  // API ROUTE
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
  const fetchReport = async (pageOverride = page, limitOverride = limit) => {
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

      if (limitOverride === 0) {
        params.all = true;
      } else {
        params.page = pageOverride;
        params.limit = limitOverride;
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
      setTotalRecords(result.total || list.length || 0);
      setTotalPages(result.pages || 1);
      setPage(result.page || pageOverride);
    } catch (err) {
      console.error("Report error:", err);
      alert("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setPage(1);
    await fetchReport(1, limit);
  };

  // =========================
  // EXPORT EXCEL
  // =========================
  const exportExcel = () => {
    if (!data.length) return alert("No data to export");

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");

    XLSX.writeFile(
      wb,
      `${type}_report_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // =========================
  // TABLE HEADERS
  // =========================
  const renderHeaders = () => {
    if (type === "assets")
      return ["Serial", "Name", "Category", "Location", "Status"];
    if (type === "history")
      return ["Asset", "Name", "Action", "Location Change", "Date"];
    if (type === "services")
      return ["Asset", "Name", "Service", "Cost", "By"];
    return [];
  };

  // =========================
  // TABLE ROWS
  // =========================
  const renderRows = () => {
    return data.map((row, i) => {
      if (type === "assets") {
        return (
          <tr key={i} className="border-b">
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
          <tr key={i} className="border-b">
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
          <tr key={i} className="border-b">
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
  // UI (MATCHED INVENTORY LAYOUT)
  // =========================
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar onToggleSidebar={handleToggleSidebar} />

        {/* Content */}
        <main className="p-6 space-y-6 overflow-y-auto">
          <h1 className="text-2xl font-semibold">
            Property Tagging Reports
          </h1>

          {/* FILTERS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">
                Report Filters
              </CardTitle>
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
                  onClick={handleGenerate}
                  className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-2"
                >
                  <FileText size={16} />
                  {loading ? "Loading..." : "Generate"}
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

            <CardContent>
              {data.length === 0 ? (
                <p className="text-gray-500">No data</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      {renderHeaders().map((h) => (
                        <th key={h} className="p-2 text-left">
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

          {/* EXPORT */}
          {data.length > 0 && (
            <div>
              <Button
                onClick={exportExcel}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
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