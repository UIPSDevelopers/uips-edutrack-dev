"use client";

import React, { useState } from "react";
import PropertyTaggingTabs from "./PropertyTaggingTabs";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Download, FileText } from "lucide-react";
import axiosInstance from "@/lib/axios";
import * as XLSX from "xlsx";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AssetReports() {
  // =========================
  // STATE
  // =========================
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("SUMMARY");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // =========================
  // FETCH REPORT
  // =========================
  const fetchReport = async () => {
    setLoading(true);
    setHasGenerated(true);

    try {
      const params = { type };

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
  // EXPORT PDF
  // =========================
  const exportPDF = () => {
    if (!data.length) return alert("No data to export");

    const doc = new jsPDF();

    const tableData = data.map((row) => {
      const asset = row.assetId;

      if (type === "SUMMARY") {
        return [
          asset?.assetName,
          asset?.serialNo,
          asset?.categoryId?.name,
          asset?.locationId?.name,
          asset?.status,
        ];
      }

      if (type === "MOVEMENT") {
        return [
          asset?.assetName,
          asset?.serialNo,
          row.changes?.location?.old,
          row.changes?.location?.new,
          new Date(row.createdAt).toLocaleString(),
        ];
      }

      if (type === "STATUS") {
        return [
          asset?.assetName,
          asset?.serialNo,
          row.changes?.status?.old,
          row.changes?.status?.new,
          new Date(row.createdAt).toLocaleString(),
        ];
      }

      if (type === "SERVICE") {
        return [
          asset?.assetName,
          asset?.serialNo,
          row.serviceType,
          row.cost,
          row.performedBy,
        ];
      }

      return [];
    });

    autoTable(doc, {
      head: [getHeaders()],
      body: tableData,
    });

    doc.save(`${type}_report_${new Date().toISOString().split("T")[0]}.pdf`);
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

    if (type === "SUMMARY") {
      return (
        <tr key={i} className="border-b hover:bg-gray-50">
          <td className="p-3">{asset?.assetName}</td>
          <td className="p-3 text-[#800000] font-medium">{asset?.serialNo}</td>
          <td className="p-3">{asset?.categoryId?.name || "-"}</td>
          <td className="p-3">{asset?.locationId?.name || "-"}</td>
          <td className="p-3">{asset?.status || "-"}</td>
        </tr>
      );
    }

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
      <div>
        <h1 className="text-2xl font-semibold">Asset Reports</h1>
      </div>

      <PropertyTaggingTabs />

      {/* FILTER */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border px-3 py-2 rounded-md"
          >
            <option value="SUMMARY">Summary</option>
            <option value="MOVEMENT">Movement</option>
            <option value="STATUS">Status</option>
            <option value="SERVICE">Service</option>
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

          <Button onClick={fetchReport} disabled={loading}>
            {loading ? "Loading..." : "Generate"}
          </Button>
        </CardContent>
      </Card>

      {/* EXPORT */}
      {hasGenerated && data.length > 0 && (
        <div className="flex gap-2 justify-end">
          <Button onClick={exportExcel} className="bg-green-600">
            <Download size={16} /> Excel
          </Button>

          <Button onClick={exportPDF} className="bg-red-600">
            PDF
          </Button>
        </div>
      )}

      {/* TABLE ONLY AFTER GENERATE */}
      {hasGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({data.length})</CardTitle>
          </CardHeader>

          <CardContent>
            {data.length === 0 ? (
              <p className="text-center text-gray-500">No data found</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {getHeaders().map((h) => (
                      <th key={h} className="p-3 text-left">
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
      )}
    </main>
  );
}
