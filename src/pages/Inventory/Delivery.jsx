"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PackagePlus, ScanLine } from "lucide-react";
import InventoryTabs from "@/pages/Inventory/InventoryTabs";
import { getCurrentUser } from "@/lib/getCurrentUser";
import axiosInstance from "@/lib/axios";

export default function Delivery() {
  const [scanned, setScanned] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [receivedBy, setReceivedBy] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const barcodeInputRef = useRef(null);

  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  
  useEffect(() => {
    setReceivedBy(getCurrentUser());
  }, []);

  
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  
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
      const existing = scanned.find((i) => i.barcode === barcode);

      if (existing) {
        
        const updated = scanned.map((i) =>
          i.barcode === barcode
            ? { ...i, quantity: i.quantity + Number(quantity) }
            : i
        );
        setScanned(updated);
      } else {
        setScanned((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            barcode,
            quantity: Number(quantity),
            itemName: item.itemName,
            itemType: item.itemType,
            itemId: item.itemId,
            gradeLevel: item.gradeLevel || "", 
            sizeOrSource: item.sizeOrSource || "-",
          },
        ]);
      }

      setBarcode("");
      setQuantity(1);
      barcodeInputRef.current?.focus();
    } catch (error) {
      console.error("Error fetching item:", error);
      const msg =
        error.response?.data?.message ||
        "⚠️ Unable to fetch item. Please check your connection.";
      alert(msg);
    }
  };

  
  const handleBarcodeKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  
  const openFinalizeModal = () => {
    if (scanned.length === 0) {
      alert("⚠️ No items scanned yet.");
      return;
    }
    setShowDialog(true);
  };

  
  const handleConfirmFinalize = async () => {
    if (!deliveryNumber.trim()) {
      alert("⚠️ Delivery number is required.");
      return;
    }

    const payload = {
      deliveryNumber: deliveryNumber.trim(),
      receivedBy,
      supplier,
      items: scanned.map((i) => ({
        itemId: i.itemId,
        itemName: i.itemName,
        itemType: i.itemType,
        gradeLevel: i.gradeLevel, 
        sizeOrSource: i.sizeOrSource,
        barcode: [i.barcode],
        quantity: i.quantity,
      })),
    };

    try {
      const res = await axiosInstance.post("/delivery/add", payload);
      const data = res.data;

      alert(`✅ Delivery saved!\nDelivery ID: ${data.delivery?.deliveryId}`);
      setScanned([]);
      setDeliveryNumber("");
      setSupplier("");
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving delivery:", error);
      const msg =
        error.response?.data?.message ||
        "⚠️ Failed to save delivery. Please try again.";
      alert(msg);
    }
  };

  return (
    <main className="p-6 space-y-6">
      {}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Delivery / Stock-In
        </h1>
      </div>

      <InventoryTabs />

      {}
      <Card className="border border-gray-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#800000] flex items-center gap-2">
            <PackagePlus size={18} />
            New Stock-In
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Scan or enter item barcodes to record a delivery.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {}
          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium text-gray-700">
              Received By
            </label>
            <Input
              value={receivedBy}
              disabled
              className="bg-gray-100 text-gray-700 mt-1"
            />
          </div>

          {}
          <div className="flex flex-wrap items-center gap-3 mt-4 max-w-lg">
            <Input
              ref={barcodeInputRef}
              placeholder="Scan or enter barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleBarcodeKeyPress}
              autoFocus
              className="border-gray-300 focus:ring-2 focus:ring-[#800000]"
            />
            <Input
              type="number"
              min="1"
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 border-gray-300 focus:ring-2 focus:ring-[#800000]"
            />
            <Button
              onClick={handleAdd}
              className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-2"
            >
              <ScanLine size={16} />
              Add
            </Button>
          </div>

          {}
          {scanned.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-gray-200 mt-4">
              <table className="w-full text-sm border-collapse uppercase">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 text-left font-medium w-10">#</th>
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Type</th>
                    <th className="p-3 text-left font-medium">
                      Grade Level
                    </th>{" "}
                    {}
                    <th className="p-3 text-left font-medium">Size/Source</th>
                    <th className="p-3 text-left font-medium">Barcode</th>
                    <th className="p-3 text-center font-medium w-20">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {scanned.map((item, i) => (
                    <tr
                      key={item.id}
                      className={`border-b ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100 transition`}
                    >
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-medium text-gray-800">
                        {item.itemName}
                      </td>
                      <td className="p-3">{item.itemType}</td>
                      <td className="p-3">{item.gradeLevel}</td> {}
                      <td className="p-3">{item.sizeOrSource || "-"}</td>
                      <td className="p-3 text-gray-600">{item.barcode}</td>
                      <td className="p-3 text-center font-semibold text-[#800000]">
                        {item.quantity}
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

          {}
          <div className="pt-6 flex justify-center">
            <Button
              onClick={openFinalizeModal}
              disabled={scanned.length === 0}
              className="bg-[#800000] hover:bg-[#a10000] text-white px-6 py-5 text-base font-medium rounded-xl shadow-sm transition-transform hover:scale-[1.02]"
            >
              <PackagePlus size={18} className="mr-2" />
              Finalize Delivery
            </Button>
          </div>
        </CardContent>
      </Card>

      {}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalize Delivery</DialogTitle>
            <p className="text-sm text-gray-500">
              Please enter the delivery details before saving.
            </p>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Delivery Number <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter delivery number"
                value={deliveryNumber}
                onChange={(e) => setDeliveryNumber(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Supplier (optional)
              </label>
              <Input
                placeholder="Enter supplier name"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="mt-1"
              />
            </div>
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
              onClick={handleConfirmFinalize}
              className="bg-[#800000] hover:bg-[#a10000] text-white"
            >
              Save Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
