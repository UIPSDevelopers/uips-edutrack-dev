"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptText, ScanLine, Trash2 } from "lucide-react";
import InventoryTabs from "@/pages/Inventory/InventoryTabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getCurrentUser } from "@/lib/getCurrentUser";
import axiosInstance from "@/lib/axios"; // ✅ use axiosInstance

export default function Checkout() {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [receiptNo, setReceiptNo] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [checkoutId, setCheckoutId] = useState("");
  const [transactionNo, setTransactionNo] = useState("");
  const barcodeInputRef = useRef(null);

  // ✅ Sidebar state (for mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // 🧍 Auto-fill current user
  useEffect(() => {
    setIssuedBy(getCurrentUser());
  }, []);

  // Auto-focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [items]);

  // 🔍 Add item by barcode (axios)
  const handleAdd = async () => {
    if (!barcode.trim()) return;

    try {
      const res = await axiosInstance.get(`/inventory/barcode/${barcode}`);
      const data = res.data;

      if (!data.item) {
        alert("❌ Item not found in inventory.");
        return;
      }

      const item = data.item;
      const existing = items.find((i) => i.barcode === barcode);

      if (existing) {
        const updated = items.map((i) =>
          i.barcode === barcode ? { ...i, qty: i.qty + 1 } : i
        );
        setItems(updated);
      } else {
        setItems((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            barcode,
            itemId: item.itemId,
            itemName: item.itemName,
            itemType: item.itemType,
            gradeLevel: item.gradeLevel || "", // 🆕 Add Grade Level
            qty: 1,
          },
        ]);
      }

      setBarcode("");
      barcodeInputRef.current?.focus();
    } catch (error) {
      console.error("Error fetching item:", error);
      const msg =
        error.response?.data?.message || "⚠️ Server error while fetching item.";
      alert(msg);
    }
  };

  // Auto-add on Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  // 🗑️ Remove item
  const handleRemove = (barcode) => {
    setItems(items.filter((i) => i.barcode !== barcode));
  };

  // 🧾 Open modal for finalize checkout
  const openFinalizeModal = () => {
    if (items.length === 0) {
      alert("⚠️ No items to checkout.");
      return;
    }
    setShowDialog(true);
  };

  // ✅ Confirm checkout → send to backend (axios)
  const handleConfirmCheckout = async () => {
    if (!receiptNo.trim()) {
      alert("Please enter a valid receipt number.");
      return;
    }

    try {
      const payload = {
        receiptNo,
        issuedBy,
        items: items.map((i) => ({
          itemId: i.itemId,
          itemName: i.itemName,
          itemType: i.itemType,
          gradeLevel: i.gradeLevel, // 🆕 include gradeLevel
          barcode: i.barcode,
          sizeOrSource: i.sizeOrSource,
          quantity: i.qty,
        })),
      };

      const res = await axiosInstance.post("/checkouts/add", payload);
      const data = res.data;

      setCheckoutId(data.checkoutId);
      setTransactionNo(data.transactionNo);
      alert(
        `✅ Checkout successful!\nCheckout ID: ${data.checkoutId}\nTransaction No: ${data.transactionNo}`
      );
      setItems([]);
      setReceiptNo("");
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving checkout:", error);
      const msg =
        error.response?.data?.message ||
        "⚠️ Server error while saving checkout.";
      alert(msg);
    }
  };

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Checkout / Stock-Out
        </h1>
      </div>

      <InventoryTabs />

      <Card className="border border-gray-200 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#800000]">
            Checkout Transaction
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Scan or manually enter barcodes for items being issued.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Checkout ID */}
          {checkoutId && (
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium text-gray-700">
                Checkout ID
              </label>
              <Input
                value={checkoutId}
                readOnly
                className="bg-gray-100 text-gray-700 mt-1"
              />
            </div>
          )}

          {/* Transaction Number */}
          {transactionNo && (
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium text-gray-700">
                Transaction Number
              </label>
              <Input
                value={transactionNo}
                readOnly
                className="bg-gray-100 text-gray-700 mt-1"
              />
            </div>
          )}

          {/* Issued By */}
          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium text-gray-700">
              Issued By
            </label>
            <Input
              value={issuedBy}
              disabled
              className="bg-gray-100 text-gray-700 mt-1"
            />
          </div>

          {/* Barcode Input */}
          <div className="flex flex-wrap items-center gap-3 mt-4 max-w-lg">
            <Input
              ref={barcodeInputRef}
              placeholder="Scan or enter barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              className="border-gray-300 focus:ring-2 focus:ring-[#800000]"
            />
            <Button
              onClick={handleAdd}
              className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-2"
            >
              <ScanLine size={16} />
              Add
            </Button>
          </div>

          {/* Table */}
          {items.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-gray-200 mt-4">
              <table className="w-full text-sm border-collapse uppercase">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Item Name</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Grade Level</th> {/* 🆕 */}
                    <th className="p-3 text-left">Barcode</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-medium text-gray-800">{item.itemName}</td>
                      <td className="p-3">{item.itemType}</td>
                      <td className="p-3">{item.gradeLevel}</td> {/* 🆕 */}
                      <td className="p-3 text-gray-600">{item.barcode}</td>
                      <td className="p-3 text-center font-semibold text-[#800000]">{item.qty}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRemove(item.barcode)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">
              No items scanned yet.
            </p>
          )}

          {/* Finalize Button */}
          <div className="pt-4 flex justify-center">
            <Button
              onClick={openFinalizeModal}
              disabled={items.length === 0}
              className="bg-[#800000] hover:bg-[#a10000] text-white px-6 py-5 text-base font-medium rounded-xl shadow-sm transition-transform hover:scale-[1.02]"
            >
              <ReceiptText size={18} className="mr-2" />
              Finalize Checkout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Finalize Modal */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalize Checkout</DialogTitle>
            <p className="text-sm text-gray-500">
              Please enter the receipt number for this transaction.
            </p>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <label className="text-sm font-medium text-gray-700">
              Receipt Number
            </label>
            <Input
              placeholder="Enter receipt number"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-5">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCheckout}
              className="bg-[#800000] hover:bg-[#a10000] text-white"
            >
              Confirm Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
