"use client";

import React, { useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Printer, Barcode } from "lucide-react";
import InventoryTabs from "@/pages/Inventory/InventoryTabs";
import BarcodeGenerator from "react-barcode";
import { useReactToPrint } from "react-to-print";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/axios"; // ✅ use axiosInstance

export default function AddItem() {
  const [barcodeValue, setBarcodeValue] = useState("");
  const [generatedBarcode, setGeneratedBarcode] = useState(false);
  const user = JSON.parse(localStorage.getItem("user")); // retrieve user info

  const [form, setForm] = useState({
    itemType: "",
    itemName: "",
    gradeLevel: "", // 🆕 Added Grade Level
    sizeOrSource: "",
    barcode: "",
    addedBy: user ? `${user.firstname} ${user.lastname}` : "Unknown User",
  });

  // ✅ Sidebar state (for mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // ✅ Ref for printable content
  const printRef = useRef(null);

  // ✅ useReactToPrint (v3+)
  const print = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcode_${form.itemName}`,
    onAfterPrint: () => console.log("Print completed."),
    onPrintError: (err) => console.error("Print failed:", err),
  });

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Generate barcode
  const handleGenerateBarcode = () => {
    if (!form.barcode) {
      alert("Please enter a Barcode or Serial Number first.");
      return;
    }
    setBarcodeValue(form.barcode);
    setGeneratedBarcode(true);
  };

  // ✅ Save item (axios)
  const handleSave = async () => {
    if (!form.itemName || !form.itemType || !form.barcode) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const response = await axiosInstance.post("/inventory/add", form);
      const data = response.data;

      if (data && data.item) {
        alert(`✅ Item saved successfully! Generated ID: ${data.item.itemId}`);
        setForm({
          itemType: "",
          itemName: "",
          gradeLevel: "", // reset Grade Level
          sizeOrSource: "",
          barcode: "",
          addedBy: form.addedBy, // keep same user
        });
        setGeneratedBarcode(false);
        setBarcodeValue("");
      } else {
        alert("❌ Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      const msg =
        error.response?.data?.message ||
        "❌ Failed to connect to server or save item.";
      alert(msg);
    }
  };

  // ✅ Handle print button
  const handlePrintClick = () => {
    if (!printRef.current) {
      alert("There is nothing to print.");
      return;
    }
    print();
  };

  return (
    <main className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Add New Item</h1>
      </div>

      <InventoryTabs />

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            Item Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-6">
          {/* Item Type (Dropdown) */}
          <div>
            <label className="text-sm font-medium">Item Type</label>
            <Select
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, itemType: value }))
              }
              value={form.itemType}
            >
              <SelectTrigger className="mt-1 h-10 w-full border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-[#800000] focus:outline-none">
                <SelectValue placeholder="Select Item Type" />
              </SelectTrigger>
              <SelectContent className="text-sm">
                <SelectItem value="Regular Uniform">Regular Uniform</SelectItem>
                <SelectItem value="P.E Uniform">P.E Uniform</SelectItem>
                <SelectItem value="Scouting Uniform">Scouting Uniform</SelectItem>
                <SelectItem value="School Supplies">School Supplies</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Staff Uniform">Staff Uniform</SelectItem>
                <SelectItem value="Awards & Recognition">Awards & Recognition</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Item Name */}
          <div>
            <label className="text-sm font-medium">Item Name</label>
            <Input
              name="itemName"
              placeholder="Enter item name"
              value={form.itemName}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          {/* Grade Level */}
          <div>
            <label className="text-sm font-medium">Grade Level</label>
            <Input
              name="gradeLevel"
              placeholder="Enter grade level (e.g., Grade 7)"
              value={form.gradeLevel}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          {/* Size / Source */}
          <div>
            <label className="text-sm font-medium">Size / Source</label>
            <Input
              name="sizeOrSource"
              placeholder="Enter model, size or source"
              value={form.sizeOrSource}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          {/* Barcode / Serial Number */}
          <div>
            <label className="text-sm font-medium">
              Barcode / Serial Number
            </label>
            <div className="flex gap-2 mt-1">
              <Input
                name="barcode"
                placeholder="Enter barcode or serial number"
                value={form.barcode}
                onChange={handleChange}
              />
              <Button
                onClick={handleGenerateBarcode}
                className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-2"
              >
                <Barcode size={16} />
                Generate
              </Button>
            </div>
          </div>

          {/* Added By */}
          <div>
            <label className="text-sm font-medium">Added By</label>
            <Input
              name="addedBy"
              value={form.addedBy}
              readOnly
              className="mt-1 bg-gray-100"
            />
          </div>

          {/* ✅ Barcode Preview + Print */}
          {generatedBarcode && (
            <div className="md:col-span-2 flex flex-col items-start mt-4 space-y-2">
              <div
                ref={printRef}
                className="bg-white p-6 border rounded-md flex flex-col items-center justify-center w-[350px] mx-auto"
                style={{
                  textAlign: "center",
                  pageBreakInside: "avoid",
                }}
              >
                <BarcodeGenerator
                  value={barcodeValue}
                  format="CODE128"
                  width={2}
                  height={80}
                  displayValue={true}
                />
                <p className="text-sm font-medium text-center mt-2">
                  {form.itemName} — {form.gradeLevel} — {form.sizeOrSource}
                </p>
              </div>

              {/* Print Button */}
              <Button
                onClick={handlePrintClick}
                className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-2"
              >
                <Printer size={16} />
                Print Barcode
              </Button>
            </div>
          )}

          {/* Save Button */}
          <div className="md:col-span-2">
            <Button
              onClick={handleSave}
              className="bg-[#800000] hover:bg-[#a10000] text-white flex items-center gap-2"
            >
              <Save size={16} />
              Save Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
