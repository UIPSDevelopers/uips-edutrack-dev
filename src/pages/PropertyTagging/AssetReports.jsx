"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Download, FileText } from "lucide-react";
import axiosInstance from "@/lib/axios";
import * as XLSX from "xlsx";

import InventoryTabs from "@/pages/Inventory/InventoryTabs";

export default function Reports() {
  // =========================
  // STATE
  // =========================
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("delivery");

  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const isAll = limit === 0;

  // =========================
  // API ROUTE
  // =========================
  const buildUrl = () => {
    if (type === "delivery") return "/reports/delivery";
    if (type === "checkout") return "/reports/checkout";
    if (type === "returns") return "/reports/returns";
    if (type === "summary") return "/reports/summary";
    return "/reports/delivery";
  };

  // =========================
  // FETCH
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
        : result.items || result.summary || [];

      setData(list);
      setTotals(result.totals || null);
      setTotalRecords(result.total || list.length || 0);
      setTotalPages(result.pages || 1);
      setPage(result.page || pageOverride);
    } catch (err) {
      console.error(err);
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
      `${type}_report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const headers = data.length ? Object.keys(data[0]) : [];

  // =========================
  // UI
  // =========================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Inventory Reports
        </h1>
        <p className="text-sm text-gray-500">
          Generate, filter, and export system reports
        </p>
      </div>

      {/* TABS */}
      <InventoryTabs />

      {/* FILTER CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            Report Filters
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ROW 1 */}
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="delivery">Delivery</option>
              <option value="checkout">Checkout</option>
              <option value="returns">Returns</option>
              <option value="summary">Summary</option>
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
              onClick={handleGenerate}
              disabled={loading}
              className="bg-[#800000] hover:bg-[#a10000] flex items-center gap-2"
            >
              <FileText size={16} />
              {loading ? "Loading..." : "Generate"}
            </Button>
          </div>

          {/* ROW 2 (EXPORT + PAGINATION INFO) */}
          {data.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
              <p className="text-sm text-gray-500">
                {isAll
                  ? `Total records: ${totalRecords}`
                  : `Page ${page} of ${totalPages} • ${data.length}/${totalRecords}`}
              </p>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={exportExcel}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <Download size={16} />
                  Export Excel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TABLE CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            Report Results
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {data.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No data available</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  {headers.map((h) => (
                    <th key={h} className="p-2 border-b capitalize">
                      {h.replace(/([A-Z])/g, " $1")}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {headers.map((h) => (
                      <td key={h} className="p-2 border-b text-gray-700">
                        {typeof row[h] === "object"
                          ? JSON.stringify(row[h])
                          : row[h]?.toString() || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
