"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Ban, Search } from "lucide-react";
import PropertyTaggingTabs from "./PropertyTaggingTabs"; // ✅ New Tabs Component
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";

export default function PropertyTagging() {
  const [assets, setAssets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingAsset, setEditingAsset] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    model: "",
    purchaseDate: "",
    category: "",
    status: "",
    serialNo: "",
    location: "",
  });
  const [showDialog, setShowDialog] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Role & permissions
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;

  const canView = ["IT", "InventoryStaff", "InventoryAdmin"].includes(role);
  const canEdit = ["IT", "InventoryAdmin"].includes(role);
  const canDelete = ["IT", "InventoryAdmin"].includes(role);

  // Fetch property assets
  useEffect(() => {
    if (!canView) {
      setLoading(false);
      setAssets([]);
      setFiltered([]);
      return;
    }

    const fetchAssets = async () => {
      try {
        setLoading(true);
        const params = searchTerm ? { search: searchTerm } : {};
        const res = await axiosInstance.get("/property-tagging", { params });
        setAssets(res.data);
        setFiltered(res.data);
      } catch (error) {
        console.error("Error fetching assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [canView, searchTerm]);

  const handleEdit = (asset) => {
    if (!canEdit) return;
    setEditingAsset(asset);
    setEditForm({
      name: asset.name,
      brand: asset.brand || "",
      model: asset.model || "",
      purchaseDate: asset.purchaseDate || "",
      category: asset.category || "",
      status: asset.status || "",
      serialNo: asset.serialNo || "",
      location: asset.location || "",
    });
    setShowDialog(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!canEdit) return;
    try {
      const res = await axiosInstance.put(`/property-tagging/${editingAsset.assetID}`, editForm);
      alert("✅ Asset updated successfully!");
      setShowDialog(false);
      setAssets((prev) =>
        prev.map((a) => (a.assetID === editingAsset.assetID ? res.data : a))
      );
      setFiltered((prev) =>
        prev.map((a) => (a.assetID === editingAsset.assetID ? res.data : a))
      );
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update asset.");
    }
  };

  const handleDelete = async (assetID) => {
    if (!canDelete) return;
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      await axiosInstance.delete(`/property-tagging/${assetID}`);
      alert("🗑️ Asset deleted successfully!");
      setAssets((prev) => prev.filter((a) => a.assetID !== assetID));
      setFiltered((prev) => prev.filter((a) => a.assetID !== assetID));
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete asset.");
    }
  };

  const sortedAssets = React.useMemo(() => {
    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }
      const strA = valA ? String(valA).toLowerCase() : "";
      const strB = valB ? String(valB).toLowerCase() : "";
      if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  return (
    <main className="p-6 space-y-8 relative">
      <div className={canView ? "space-y-8" : "space-y-8 pointer-events-none blur-sm opacity-60 select-none"}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Property Tagging</h1>
        </div>

        <PropertyTaggingTabs />

        {/* Search */}
        <div className="flex items-center gap-2 w-full md:w-1/3 mb-4">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full border-gray-300 focus:ring-2 focus:ring-[#800000]"
          />
        </div>

        {/* Table */}
        <Card className="shadow-sm border border-gray-200 mt-4">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              List of Property Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {loading ? (
                <p className="text-center text-gray-500 py-6">Loading assets...</p>
              ) : sortedAssets.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No assets found.</p>
              ) : (
                <table className="w-full text-sm border-collapse uppercase">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-left">
                      <th className="p-3 font-medium">#</th>
                      {[
                        { key: "assetID", label: "Asset ID" },
                        { key: "name", label: "Name" },
                        { key: "brand", label: "Brand" },
                        { key: "model", label: "Model" },
                        { key: "purchaseDate", label: "Purchase Date" },
                        { key: "category", label: "Category" },
                        { key: "status", label: "Status" },
                        { key: "serialNo", label: "Serial No" },
                        { key: "location", label: "Location" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          className="p-3 font-medium cursor-pointer select-none"
                          onClick={() => handleSort(col.key)}
                        >
                          {col.label}
                          {sortConfig.key === col.key && (
                            <span>{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
                          )}
                        </th>
                      ))}
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssets.map((asset, i) => (
                      <tr key={asset.assetID} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3 font-medium text-[#800000]">{asset.assetID}</td>
                        <td className="p-3">{asset.name}</td>
                        <td className="p-3">{asset.brand || "-"}</td>
                        <td className="p-3">{asset.model || "-"}</td>
                        <td className="p-3">{asset.purchaseDate || "-"}</td>
                        <td className="p-3">{asset.category || "-"}</td>
                        <td className="p-3">{asset.status || "-"}</td>
                        <td className="p-3">{asset.serialNo || "-"}</td>
                        <td className="p-3">{asset.location || "-"}</td>
                        <td className="p-3 text-right text-gray-500 space-x-3">
                          {canEdit && (
                            <button onClick={() => handleEdit(asset)} className="hover:text-blue-600 transition">
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(asset.assetID)} className="hover:text-red-600 transition">
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {["name","brand","model","purchaseDate","category","status","serialNo","location"].map((field) => (
                <div key={field}>
                  <label className="text-sm font-medium text-gray-700">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <Input
                    name={field}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={editForm[field]}
                    onChange={handleEditChange}
                  />
                </div>
              ))}
              <Button onClick={handleUpdate} className="w-full bg-[#800000] hover:bg-[#a10000] text-white">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!canView && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/30">
          <div className="bg-white/90 backdrop-blur-xl border border-red-200 rounded-2xl shadow-xl px-8 py-6 max-w-md text-center">
            <Ban className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Unauthorized Access</h2>
            <p className="text-sm text-gray-600">
              Your role does not have permission to access Property Tagging.
              Please contact IT or the system administrator if you believe this is a mistake.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
