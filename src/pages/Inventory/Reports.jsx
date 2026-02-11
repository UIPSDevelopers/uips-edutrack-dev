"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import InventoryTabs from "@/pages/Inventory/InventoryTabs";
import { generatePDFTemplate } from "@/utils/generatePDFTemplate";
import axiosInstance from "@/lib/axios";

export default function Reports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("delivery");

  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🆕 pagination state (server-side)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20); // 10 / 20 / 50 / 0("All")
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const isAll = limit === 0;

  // Sidebar (if you’re using it elsewhere)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const buildUrlForType = () => {
    if (type === "delivery") return "/reports/delivery";
    if (type === "checkout") return "/reports/checkout";
    if (type === "returns") return "/reports/returns";
    if (type === "summary") return "/reports/summary";
    return "/reports/delivery";
  };

  // 🔹 Core fetch function (for generate + pagination)
  const fetchReport = async (pageOverride = page, limitOverride = limit) => {
    setLoading(true);
    try {
      const url = buildUrlForType();

      const params = {};

      // date filters
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);

        params.from = fromDate.toISOString();
        params.to = toDate.toISOString();
      }

      // pagination
      if (limitOverride === 0) {
        params.all = true;
      } else {
        params.page = pageOverride;
        params.limit = limitOverride;
      }

      console.log("📡 Fetching:", url, "params:", params);
      const res = await axiosInstance.get(url, { params });
      const result = res.data;

      console.log("✅ Data received:", result);

      // summary-style response
      if (result.summary && Array.isArray(result.summary)) {
        setData(result.summary);
        setTotals(result.totals || null);
        setTotalRecords(result.total || result.summary.length || 0);
        setTotalPages(result.pages || 1);
        setPage(result.page || pageOverride || 1);
      } else {
        // normal paginated array or raw array
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result.items)
          ? result.items
          : [];

        setData(list);
        setTotals(null);
        setTotalRecords(result.total || list.length || 0);
        setTotalPages(result.pages || 1);
        setPage(result.page || pageOverride || 1);
      }
    } catch (error) {
      console.error("❌ Error generating report:", error);
      const msg =
        error.response?.data?.message ||
        "⚠️ Server error while generating report.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // 🔘 Generate button handler
  const handleGenerate = async () => {
    // reset to page 1 whenever filters/type change
    setPage(1);
    await fetchReport(1, limit);
  };

  // 🧾 Export helper
  const exportRowsToPDF = async (rows, scopeLabel) => {
    if (!rows || rows.length === 0) {
      alert("⚠️ No data to export.");
      return;
    }

    const tableHeaders = Object.keys(rows[0]);
    // add Grade Level if exists
    if (
      !tableHeaders.includes("gradeLevel") &&
      rows.some((r) => r.gradeLevel)
    ) {
      tableHeaders.push("gradeLevel");
    }

    const tableData = rows.map((item) =>
      tableHeaders.map((col) =>
        typeof item[col] === "object"
          ? JSON.stringify(item[col])
          : item[col]?.toString() || ""
      )
    );

    const doc = await generatePDFTemplate({
      title: "UIPS EduTrack Report",
      subtitle: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      tableHeaders,
      tableData,
      totals,
      from,
      to,
    });

    doc.save(
      `${type}_report_${scopeLabel}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
  };

  // 🔹 Export current page only
  const handleExportCurrentPDF = async () => {
    await exportRowsToPDF(data, "VIEW");
  };

  // 🔹 Export ALL (ignores pagination, respects filters)
  const handleExportAllPDF = async () => {
    try {
      const url = buildUrlForType();
      const params = { all: true };

      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);

        params.from = fromDate.toISOString();
        params.to = toDate.toISOString();
      }

      const res = await axiosInstance.get(url, { params });
      const result = res.data;

      let list;

      if (result.summary && Array.isArray(result.summary)) {
        list = result.summary;
      } else if (Array.isArray(result)) {
        list = result;
      } else if (Array.isArray(result.items)) {
        list = result.items;
      } else {
        list = [];
      }

      await exportRowsToPDF(list, "ALL");
    } catch (err) {
      console.error("❌ FULL PDF generation failed:", err);
      alert("⚠️ Failed to generate FULL export PDF.");
    }
  };

  return (
    <main className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Inventory Reports
        </h1>
      </div>

      <InventoryTabs />

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            Report Filters
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 🔹 Filter Section */}
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="delivery">Delivery Report</option>
              <option value="checkout">Checkout Report</option>
              <option value="returns">Returns Report</option>
              <option value="summary">Inventory Summary</option>
            </select>

            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <span className="text-gray-500 text-sm">to</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-2"
            >
              <FileText size={16} />
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>

          {/* 🔹 Summary Header */}
          {data.length > 0 && (
            <div className="border rounded-md bg-gray-50 p-4 mt-2 shadow-sm">
              <h2 className="font-semibold text-gray-800 text-sm mb-1">
                {type.charAt(0).toUpperCase() + type.slice(1)} Report
              </h2>
              {from || to ? (
                <p className="text-gray-600 text-xs">
                  Showing results from{" "}
                  <span className="font-medium text-gray-800">
                    {from
                      ? new Date(from).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "the beginning"}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-gray-800">
                    {to
                      ? new Date(to).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "today"}
                  </span>
                </p>
              ) : (
                <p className="text-gray-600 text-xs">
                  Showing all available data
                </p>
              )}
            </div>
          )}

          {/* 🔹 Pagination + Export controls */}
          {data.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4 text-sm">
              <span className="text-gray-500">
                {isAll
                  ? `Showing all ${totalRecords} records`
                  : `Page ${page} of ${totalPages} • Showing ${data.length} of ${totalRecords} records`}
              </span>

              <div className="flex flex-wrap gap-3 items-center justify-end">
                {/* Rows per page */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Rows per page:</span>
                  <select
                    value={isAll ? "0" : String(limit)}
                    onChange={async (e) => {
                      const num = Number(e.target.value);
                      setLimit(num);
                      setPage(1);
                      await fetchReport(1, num);
                    }}
                    className="border rounded-md px-2 py-1 text-xs"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="0">All</option>
                  </select>
                </div>

                {/* Pagination buttons */}
                {!isAll && totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={async () => {
                        const newPage = page - 1;
                        await fetchReport(newPage, limit);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={async () => {
                        const newPage = page + 1;
                        await fetchReport(newPage, limit);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                )}

                {/* Export buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleExportCurrentPDF}
                    className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-2"
                  >
                    <Download size={16} />
                    Export (This View)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportAllPDF}
                    className="flex items-center gap-2 border-[#800000] text-[#800000] hover:bg-[#800000]/5"
                  >
                    <Download size={16} />
                    Export ALL
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 🔹 Results Table */}
          <div className="mt-4">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-sm text-gray-500">
                  Report Results ({totalRecords})
                </CardTitle>
              </CardHeader>

              <CardContent className="overflow-x-auto">
                {data.length === 0 ? (
                  <p className="text-gray-600 text-sm">No data to display.</p>
                ) : (
                  <table className="w-full text-sm border-collapse uppercase">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        {(data.length > 0 ? Object.keys(data[0]) : []).map(
                          (key) => (
                            <th
                              key={key}
                              className="p-2 text-left capitalize border-b"
                            >
                              {key.replace(/([A-Z])/g, " $1")}
                            </th>
                          )
                        )}
                        {!Object.keys(data[0]).includes("gradeLevel") &&
                          data.some((r) => r.gradeLevel) && (
                            <th className="p-2 text-left capitalize border-b">
                              Grade Level
                            </th>
                          )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="p-2 border-b text-gray-700">
                              {typeof val === "object"
                                ? JSON.stringify(val)
                                : val?.toString()}
                            </td>
                          ))}
                          {!row.gradeLevel &&
                            row.gradeLevel !== undefined &&
                            data.some((r) => r.gradeLevel) && (
                              <td className="p-2 border-b text-gray-700">-</td>
                            )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* ✅ Totals for summary */}
                {type === "summary" && totals && (
                  <div className="mt-6 border-t pt-4 text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-semibold">Total Delivered:</span>{" "}
                      {totals.totalDelivered}
                    </p>
                    <p>
                      <span className="font-semibold">Total Returned:</span>{" "}
                      {totals.totalReturned ?? 0}
                    </p>
                    <p>
                      <span className="font-semibold">Total Checked Out:</span>{" "}
                      {totals.totalCheckedOut}
                    </p>
                    <p>
                      <span className="font-semibold">
                        Total Stock (as of date):
                      </span>{" "}
                      {totals.totalStockAsOfDate}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
