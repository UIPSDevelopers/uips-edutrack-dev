"use client";

import React, { useState } from "react";
import PropertyTaggingTabs from "./PropertyTaggingTabs";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Download } from "lucide-react";
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
  // EXPORT EXCEL (FULL DATA)
  // =========================
  const exportExcel = () => {
    if (!data.length) return alert("No data to export");

    const formatted = data.map((row) => {
      const asset = row.assetId;

      return {
        Asset: asset?.assetName,
        Serial: asset?.serialNo,
        Category: asset?.categoryId?.name,
        Location: asset?.locationId?.name,
        Status: asset?.status,

        ActionType: row.actionType || row.serviceType || "ASSET",
        ServiceType: row.serviceType || "-",
        Cost: row.cost || "-",
        PerformedBy: row.performedBy || "-",

        OldLocation: row.changes?.location?.old || "-",
        NewLocation: row.changes?.location?.new || "-",

        OldStatus: row.changes?.status?.old || "-",
        NewStatus: row.changes?.status?.new || "-",

        Date: row.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
      };
    });

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Asset Report");

    XLSX.writeFile(
      wb,
      `${type}_report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // =========================
  // EXPORT PDF (FULL DATA)
  // =========================
  const exportPDF = () => {
    if (!data.length) return alert("No data to export");

    const doc = new jsPDF();

    const tableData = data.map((row) => {
      const asset = row.assetId;

      return [
        asset?.assetName,
        asset?.serialNo,
        asset?.categoryId?.name || "-",
        asset?.locationId?.name || "-",
        asset?.status || "-",
        row.actionType || row.serviceType || "-",
        row.serviceType || "-",
        row.cost || "-",
        row.performedBy || "-",
        row.changes?.location?.old || "-",
        row.changes?.location?.new || "-",
        row.changes?.status?.old || "-",
        row.changes?.status?.new || "-",
        row.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
      ];
    });

    autoTable(doc, {
      head: [
        [
          "Asset",
          "Serial",
          "Category",
          "Location",
          "Status",
          "Action",
          "Service",
          "Cost",
          "By",
          "Old Loc",
          "New Loc",
          "Old Status",
          "New Status",
          "Date",
        ],
      ],
      body: tableData,
    });

    doc.save(`${type}_report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // =========================
  // ROW RENDER (FULL DETAILS)
  // =========================
  const renderRow = (row, i) => {
    const asset = row.assetId;

    return (
      <tr key={i} className="border-b hover:bg-gray-50 align-top">
        {/* ASSET */}
        <td className="p-3">
          <div className="font-semibold">{asset?.assetName}</div>
          <div className="text-[#800000] font-medium">{asset?.serialNo}</div>
          <div className="text-xs text-gray-500">
            {asset?.categoryId?.name} | {asset?.locationId?.name}
          </div>
          <div className="text-xs">Status: {asset?.status}</div>
        </td>

        {/* REPORT TYPE */}
        <td className="p-3">
          <div className="font-semibold">
            {row.actionType || row.serviceType || "ASSET"}
          </div>

          {row.serviceType && <div>Service: {row.serviceType}</div>}

          {row.cost !== undefined && <div>Cost: AED {row.cost}</div>}

          {row.performedBy && <div>By: {row.performedBy}</div>}
        </td>

        {/* CHANGES */}
        <td className="p-3 text-sm space-y-2">
          {row.changes?.location && (
            <div>
              <b>Location:</b> {row.changes.location.old} →{" "}
              {row.changes.location.new}
            </div>
          )}

          {row.changes?.status && (
            <div>
              <b>Status:</b> {row.changes.status.old} → {row.changes.status.new}
            </div>
          )}

          {!row.changes && <span>-</span>}
        </td>

        {/* DATE */}
        <td className="p-3 whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
        </td>
      </tr>
    );
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

      {/* TABLE */}
      {hasGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({data.length})</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            {data.length === 0 ? (
              <p className="text-center text-gray-500">No data found</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left">Asset</th>
                    <th className="p-3 text-left">Report</th>
                    <th className="p-3 text-left">Changes</th>
                    <th className="p-3 text-left">Date</th>
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
