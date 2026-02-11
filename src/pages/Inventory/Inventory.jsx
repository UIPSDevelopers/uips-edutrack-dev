"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Ban, Search } from "lucide-react";
import InventoryTabs from "@/pages/Inventory/InventoryTabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "@/lib/axios";
import PrintBarcodes from "./PrintBarcodes";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    itemName: "",
    gradeLevel: "",
    itemType: "",
    sizeOrSource: "",
    barcode: "",
    quantity: 0,
  });
  const [showDialog, setShowDialog] = useState(false);

  // 🆕 Pagination state (limit = 0 means "All")
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sortConfig, setSortConfig] = useState({
    key: null, // column to sort by
    direction: "asc", // 'asc' or 'desc'
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Toggle direction if same column
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      // New column defaults to ascending
      return { key, direction: "asc" };
    });
  };

  // 🔹 Sidebar control
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // 👤 Get current user + role
  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;

  const handleBulkBarcodePrint = () => {
    if (filtered.length === 0) {
      alert("⚠️ No items to print.");
      return;
    }

    localStorage.setItem("printBarcodes", JSON.stringify(filtered));
    window.open("/inventory/print-barcodes", "_blank");
  };

  // 🎛 Role-based permissions
  const canViewInventory = [
    "IT",
    "InventoryStaff",
    "Accounts",
    "InventoryAdmin",
  ].includes(role);
  const canAddInventory = [
    "IT",
    "InventoryStaff",
    "Accounts",
    "InventoryAdmin",
  ].includes(role);
  const canEditInventory = ["IT", "Accounts", "InventoryAdmin"].includes(role);
  const canDeleteInventory = ["IT", "InventoryAdmin"].includes(role);

  const isAll = limit === 0;

  // ✅ Fetch items (backend pagination + search/filter + all)
  useEffect(() => {
    if (!canViewInventory) {
      setLoading(false);
      setItems([]);
      setFiltered([]);
      setTotalItems(0);
      setTotalPages(1);
      return;
    }

    const fetchItems = async () => {
      try {
        setLoading(true);

        const params = {
          search: searchTerm || undefined,
          itemType: selectedType !== "All" ? selectedType : undefined,
        };

        if (isAll) {
          params.all = true;
        } else {
          params.page = page;
          params.limit = limit;
        }

        const res = await axiosInstance.get("/inventory", { params });
        const data = res.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
            ? data.items
            : [];

        setItems(list);
        setFiltered(list);

        if (!Array.isArray(data)) {
          setTotalItems(data.total || list.length || 0);
          setTotalPages(data.pages || 1);
        } else {
          setTotalItems(list.length || 0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [canViewInventory, page, limit, searchTerm, selectedType, isAll]);

  const totalQuantity = items.reduce((acc, i) => acc + (i.quantity || 0), 0);

  const handleEdit = (item) => {
    if (!canEditInventory) return;
    setEditingItem(item);
    setEditForm({
      itemName: item.itemName,
      gradeLevel: item.gradeLevel || "",
      itemType: item.itemType,
      sizeOrSource: item.sizeOrSource || "",
      barcode: item.barcode,
      quantity: item.quantity || 0,
    });
    setShowDialog(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!canEditInventory) return;
    try {
      const res = await axiosInstance.put(
        `/inventory/${editingItem.itemId}`,
        editForm,
      );
      const data = res.data;

      alert("✅ Item updated successfully!");
      setShowDialog(false);
      setItems((prev) =>
        prev.map((it) => (it.itemId === editingItem.itemId ? data.item : it)),
      );
      setFiltered((prev) =>
        prev.map((it) => (it.itemId === editingItem.itemId ? data.item : it)),
      );
    } catch (error) {
      console.error("Error updating:", error);
      const msg = error.response?.data?.message || "❌ Failed to update item.";
      alert(msg);
    }
  };

  const handleDelete = async (itemId) => {
    if (!canDeleteInventory) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await axiosInstance.delete(`/inventory/${itemId}`);
      alert("🗑️ Item deleted successfully!");
      setItems((prev) => prev.filter((it) => it.itemId !== itemId));
      setFiltered((prev) => prev.filter((it) => it.itemId !== itemId));
      setTotalItems((prev) => (prev > 0 ? prev - 1 : 0));
    } catch (error) {
      console.error("Error deleting:", error);
      const msg = error.response?.data?.message || "❌ Failed to delete item.";
      alert(msg);
    }
  };

  // ✅ Export PDF (current dataset – if limit=0, that's ALL)
  const handleExportPDF = async () => {
    if (filtered.length === 0) {
      alert("⚠️ No data to export.");
      return;
    }

    try {
      const doc = new jsPDF("l", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(128, 0, 0);
      doc.rect(0, 0, pageWidth, 80, "F");

      const logoUrl = "https://i.postimg.cc/DWkx44nh/uips-logo.png";
      try {
        const logoResponse = await fetch(logoUrl);
        const logoBlob = await logoResponse.blob();
        const reader = new FileReader();

        const logoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });

        doc.addImage(logoBase64, "PNG", 25, -2, 80, 80);
      } catch {
        console.warn("⚠️ Logo not loaded, continuing without image.");
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("United International Private School", pageWidth / 2, 38, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("EduTrack Inventory Overview", pageWidth / 2, 58, {
        align: "center",
      });

      const currentDate = new Date().toLocaleString();
      doc.setFontSize(9);
      doc.text(`Generated on: ${currentDate}`, pageWidth - 160, 72);

      const headers = [
        [
          "#",
          "Item ID",
          "Item Name",
          "Grade Level",
          "Type",
          "Size / Source",
          "Barcode / Serial",
          "Qty",
          "Added By",
        ],
      ];

      const body = filtered.map((item, index) => [
        index + 1,
        item.itemId,
        item.itemName,
        item.gradeLevel || "-",
        item.itemType,
        item.sizeOrSource || "-",
        item.barcode || "-",
        item.quantity || 0,
        item.addedBy || "-",
      ]);

      autoTable(doc, {
        startY: 100,
        head: headers,
        body,
        styles: { fontSize: 8, halign: "center", cellPadding: 4 },
        headStyles: {
          fillColor: [128, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      const totalItemsForPdf = filtered.length;
      const totalQuantityForPdf = filtered.reduce(
        (acc, i) => acc + (i.quantity || 0),
        0,
      );
      const finalY = doc.lastAutoTable.finalY + 30;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Total Items: ${totalItemsForPdf}`, 40, finalY);
      doc.text(`Total Quantity: ${totalQuantityForPdf}`, 180, finalY);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "UIPS EduTrack — Inventory Management System",
        pageWidth / 2,
        doc.internal.pageSize.height - 20,
        { align: "center" },
      );

      doc.save(`UIPS_Inventory_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("❌ PDF generation failed:", err);
      alert("⚠️ Failed to generate PDF.");
    }
  };

  // 🆕 Export ALL (ignores pagination, respects filters)
  const handleExportAllPDF = async () => {
    try {
      const params = {
        all: true,
        search: searchTerm || undefined,
        itemType: selectedType !== "All" ? selectedType : undefined,
      };

      const res = await axiosInstance.get("/inventory", { params });
      const data = res.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
          ? data.items
          : [];

      if (!list.length) {
        alert("⚠️ No data to export.");
        return;
      }

      const doc = new jsPDF("l", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(128, 0, 0);
      doc.rect(0, 0, pageWidth, 80, "F");

      const logoUrl = "https://i.postimg.cc/DWkx44nh/uips-logo.png";
      try {
        const logoResponse = await fetch(logoUrl);
        const logoBlob = await logoResponse.blob();
        const reader = new FileReader();

        const logoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });

        doc.addImage(logoBase64, "PNG", 25, -2, 80, 80);
      } catch {
        console.warn("⚠️ Logo not loaded, continuing without image.");
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("United International Private School", pageWidth / 2, 38, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("EduTrack Inventory – FULL Export", pageWidth / 2, 58, {
        align: "center",
      });

      const currentDate = new Date().toLocaleString();
      doc.setFontSize(9);
      doc.text(`Generated on: ${currentDate}`, pageWidth - 160, 72);

      const headers = [
        [
          "#",
          "Item ID",
          "Item Name",
          "Grade Level",
          "Type",
          "Size / Source",
          "Barcode / Serial",
          "Qty",
          "Added By",
        ],
      ];

      const body = list.map((item, index) => [
        index + 1,
        item.itemId,
        item.itemName,
        item.gradeLevel || "-",
        item.itemType,
        item.sizeOrSource || "-",
        item.barcode || "-",
        item.quantity || 0,
        item.addedBy || "-",
      ]);

      autoTable(doc, {
        startY: 100,
        head: headers,
        body,
        styles: { fontSize: 8, halign: "center", cellPadding: 4 },
        headStyles: {
          fillColor: [128, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      const totalItemsAll = list.length;
      const totalQtyAll = list.reduce((acc, i) => acc + (i.quantity || 0), 0);
      const finalY = doc.lastAutoTable.finalY + 30;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Total Items: ${totalItemsAll}`, 40, finalY);
      doc.text(`Total Quantity: ${totalQtyAll}`, 180, finalY);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "UIPS EduTrack — Inventory Management System",
        pageWidth / 2,
        doc.internal.pageSize.height - 20,
        { align: "center" },
      );

      doc.save(
        `UIPS_Inventory_ALL_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error("❌ FULL PDF generation failed:", err);
      alert("⚠️ Failed to generate FULL export PDF.");
    }
  };

  const sortedItems = React.useMemo(() => {
    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      // Handle numbers
      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }

      // Handle strings (including undefined/null)
      const strA = valA ? String(valA).toLowerCase() : "";
      const strB = valB ? String(valB).toLowerCase() : "";

      if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  return (
    <main className="p-6 space-y-8 relative">
      <div
        className={
          canViewInventory
            ? "space-y-8"
            : "space-y-8 pointer-events-none blur-sm opacity-60 select-none"
        }
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Inventory</h1>
        </div>

        <InventoryTabs />

        {role === "InventoryStaff" && (
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="py-3 text-xs text-amber-800">
              You have <span className="font-semibold">limited access</span> to
              Inventory. You can view records but you{" "}
              <span className="font-semibold">cannot edit or delete</span>{" "}
              existing data.
            </CardContent>
          </Card>
        )}

        {/* Filter + Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-1/3">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search item name..."
              value={searchTerm}
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
              className="h-10 w-full border-gray-300 focus:ring-2 focus:ring-[#800000]"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="w-1/2 md:w-48">
              <Select
                onValueChange={(val) => {
                  setPage(1);
                  setSelectedType(val);
                }}
                value={selectedType}
              >
                <SelectTrigger className="h-10 border border-gray-300 focus:ring-2 focus:ring-[#800000]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="REGULAR UNIFORM">
                    Regular Uniform
                  </SelectItem>
                  <SelectItem value="P.E. UNIFORM">P.E. Uniform</SelectItem>
                  <SelectItem value="SCOUTING UNIFORM">
                    Scouting Uniform
                  </SelectItem>
                  <SelectItem value="SCHOOL SUPPLIES">
                    School Supplies
                  </SelectItem>
                  <SelectItem value="OFFICE SUPPLIES">
                    Office Supplies
                  </SelectItem>
                  <SelectItem value="STAFF UNIFORM">Staff Uniform</SelectItem>
                  <SelectItem value="AWARDS & RECOGNITION">
                    Awards & Recognition
                  </SelectItem>
                  <SelectItem value="OTHERS">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-1/2 md:w-40">
              <Select
                value={isAll ? "0" : String(limit)}
                onValueChange={(val) => {
                  const num = Number(val);
                  setPage(1);
                  setLimit(num);
                }}
              >
                <SelectTrigger className="h-10 border border-gray-300 focus:ring-2 focus:ring-[#800000]">
                  <SelectValue placeholder="Rows per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="0">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="shadow-sm border border-gray-200 mt-4">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              List of Inventory Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* TOP: Pagination info */}
            {!loading && filtered.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 text-sm">
                <span className="text-gray-500">
                  {isAll
                    ? `Showing all ${totalItems} items (Qty: ${totalQuantity})`
                    : `Page ${page} of ${totalPages} • Total items: ${totalItems} • Qty on this page: ${totalQuantity}`}
                </span>

                {!isAll && totalPages > 1 && (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TOP: Export Buttons */}
            {!loading && filtered.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                <Button
                  onClick={handleExportPDF}
                  className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Export (This View)
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExportAllPDF}
                  className="flex items-center gap-2 border-[#800000] text-[#800000] hover:bg-[#800000]/5"
                >
                  <Package className="w-4 h-4" />
                  Export ALL
                </Button>
                <Button
                  onClick={handleBulkBarcodePrint}
                  className="bg-black hover:bg-gray-800 text-white flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Bulk Barcode Print
                </Button>
              </div>
            )}

            <div className="overflow-x-auto">
              {loading ? (
                <p className="text-center text-gray-500 py-6">
                  Loading items...
                </p>
              ) : sortedItems.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  No matching items found.
                </p>
              ) : (
                <table className="w-full text-sm border-collapse uppercase">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-left">
                      <th className="p-3 font-medium">#</th>

                      {[
                        { key: "itemId", label: "Item ID" },
                        { key: "itemName", label: "Item Name" },
                        { key: "gradeLevel", label: "Grade Level" },
                        { key: "itemType", label: "Type" },
                        { key: "sizeOrSource", label: "Size / Source" },
                        { key: "barcode", label: "Barcode / Serial" },
                        { key: "quantity", label: "Quantity", center: true },
                        { key: "addedBy", label: "Added By" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          className={`p-3 font-medium cursor-pointer select-none ${
                            col.center ? "text-center" : ""
                          }`}
                          onClick={() => handleSort(col.key)}
                        >
                          {col.label}
                          {sortConfig.key === col.key && (
                            <span>
                              {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                            </span>
                          )}
                        </th>
                      ))}

                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedItems.map((item, i) => (
                      <tr
                        key={item.itemId}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="p-3">
                          {isAll ? i + 1 : (page - 1) * limit + (i + 1)}
                        </td>
                        <td className="p-3 font-medium text-[#800000]">
                          {item.itemId}
                        </td>
                        <td className="p-3">{item.itemName}</td>
                        <td className="p-3">{item.gradeLevel || "-"}</td>
                        <td className="p-3">{item.itemType}</td>
                        <td className="p-3">{item.sizeOrSource || "-"}</td>
                        <td className="p-3">{item.barcode || "-"}</td>
                        <td className="p-3 text-center font-semibold">
                          {item.quantity ?? 0}
                        </td>
                        <td className="p-3">{item.addedBy || "-"}</td>
                        <td className="p-3 text-right text-gray-500 space-x-3">
                          {canEditInventory && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="hover:text-blue-600 transition"
                            >
                              Edit
                            </button>
                          )}
                          {canDeleteInventory && (
                            <button
                              onClick={() => handleDelete(item.itemId)}
                              className="hover:text-red-600 transition"
                            >
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

        {/* ✏️ Edit Item Modal */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <label className="text-sm font-medium text-gray-700">
                Item Name
              </label>
              <Input
                name="itemName"
                placeholder="Item Name"
                value={editForm.itemName}
                onChange={handleEditChange}
              />
              <label className="text-sm font-medium text-gray-700">
                Grade Level
              </label>
              <Input
                name="gradeLevel"
                placeholder="Grade Level"
                value={editForm.gradeLevel}
                onChange={handleEditChange}
              />
              <label className="text-sm font-medium text-gray-700">
                Quantity
              </label>
              <Input
                name="quantity"
                type="number"
                value={editForm.quantity}
                onChange={handleEditChange}
              />
              <Button
                onClick={handleUpdate}
                className="w-full bg-[#800000] hover:bg-[#a10000] text-white"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 🚫 Unauthorized Overlay */}
      {!canViewInventory && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/30">
          <div className="bg-white/90 backdrop-blur-xl border border-red-200 rounded-2xl shadow-xl px-8 py-6 max-w-md text-center">
            <Ban className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Unauthorized Access
            </h2>
            <p className="text-sm text-gray-600">
              Your role does not have permission to access the Inventory module.
              Please contact IT or the system administrator if you believe this
              is a mistake.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
