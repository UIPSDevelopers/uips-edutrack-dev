"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Ban, Printer } from "lucide-react";

import PropertyTaggingTabs from "./PropertyTaggingTabs";
import PrintQRModal from "./PrintQRModal";
import axiosInstance from "@/lib/axios";

export default function PropertyTagging() {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssets, setSelectedAssets] = useState([]);

  const [showPrint, setShowPrint] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const isValidObjectId = (id) =>
    typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const role = user?.role;
  const canView = ["IT", "InventoryStaff", "InventoryAdmin"].includes(role);

  useEffect(() => {
    if (!canView) return setLoading(false);

    const fetchAssets = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/asset/assets");
        setAssets(res.data.assets || []);
      } catch (err) {
        console.error(err);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [canView]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets;

    return assets.filter((a) =>
      `${a.assetName} ${a.serialNo} ${a.brand} ${a.model}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [assets, searchTerm]);

  const sortedAssets = useMemo(() => {
    if (!sortConfig.key) return filteredAssets;

    return [...filteredAssets].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      const A = aVal ? String(aVal).toLowerCase() : "";
      const B = bVal ? String(bVal).toLowerCase() : "";

      if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
      if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredAssets, sortConfig]);

  const toggleSelect = (id) => {
    if (!isValidObjectId(id)) return;

    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    const valid = sortedAssets.map((a) => a._id);

    if (selectedAssets.length === valid.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(valid);
    }
  };

  // ✅ MODAL OPEN
  const handlePrintQR = () => {
    if (!selectedAssets.length) return;
    setShowPrint(true);
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Ban className="mx-auto text-red-500 mb-2" />
          <p>Unauthorized Access</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Property Tagging</h1>

        <Button
          onClick={handlePrintQR}
          disabled={!selectedAssets.length}
          className="bg-[#800000]"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print QR ({selectedAssets.length})
        </Button>
      </div>

      <PropertyTaggingTabs />

      {/* SEARCH */}
      <div className="flex gap-2 w-full md:w-1/3">
        <Search className="w-4 h-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search assets..."
        />
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={selectAll}
                      checked={
                        selectedAssets.length === sortedAssets.length &&
                        sortedAssets.length > 0
                      }
                    />
                  </th>
                  <th>Serial</th>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Model</th>
                </tr>
              </thead>

              <tbody>
                {sortedAssets.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(a._id)}
                        onChange={() => toggleSelect(a._id)}
                      />
                    </td>
                    <td>{a.serialNo}</td>
                    <td>{a.assetName}</td>
                    <td>{a.brand}</td>
                    <td>{a.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ✅ MODAL */}
      <PrintQRModal
        open={showPrint}
        onClose={() => setShowPrint(false)}
        assetIds={selectedAssets}
      />
    </main>
  );
}
