"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Undo2,
  Search,
  Trash2,
  FileCheck,
  PackageCheck,
  Loader2,
  ScanLine,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import InventoryTabs from "@/pages/Inventory/InventoryTabs";
import axiosInstance from "@/lib/axios";

// ✅ Helper functions
async function fetchCheckoutByRef(receiptNo) {
  try {
    const res = await axiosInstance.get(`/checkouts/${receiptNo}`);
    return res.data;
  } catch (err) {
    console.error("Fetch checkout error:", err);
    return null;
  }
}

async function createReturn(payload) {
  try {
    const res = await axiosInstance.post("/returns", payload);
    return res.data;
  } catch (err) {
    console.error("Create return error:", err);
    return { message: "Server error" };
  }
}

async function getReturns() {
  try {
    const res = await axiosInstance.get("/returns");
    const data = res.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Get returns error:", err);
    return [];
  }
}

// 🧾 Main Component
export default function Returns() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <PackageCheck className="h-6 w-6 text-[#800000]" />
          Returns / Stock-In
        </h1>
      </div>

      <InventoryTabs />

      <ReturnForm />
      <ReturnList />
    </main>
  );
}

// 🧾 Return Form
function ReturnForm() {
  const [receiptRef, setReceiptRef] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [returnedBy, setReturnedBy] = useState("");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(
    () => ({
      items: lines.length,
      qty: lines.reduce((sum, l) => sum + Number(l.quantity || 0), 0),
      damaged: lines.reduce(
        (sum, l) =>
          sum + (l.condition === "Damaged" ? Number(l.quantity || 0) : 0),
        0
      ),
    }),
    [lines]
  );

  // 🔍 Lookup checkout by Receipt No.
  const handleLookup = async () => {
    if (!receiptRef.trim()) return;
    setLoading(true);
    setMessage(null);

    console.log("🔍 Searching by receiptNo:", receiptRef);
    const data = await fetchCheckoutByRef(receiptRef.trim());
    setLoading(false);

    if (!data) {
      setMessage({ type: "error", text: "Receipt not found." });
      return;
    }

    setTransactionRef(data.transactionNo || "-");

    // 🆕 Include gradeLevel if available in checkout items
    setLines(
      data.items.map((it) => ({
        itemId: it.itemId,
        itemName: it.itemName,
        sizeOrSource: it.sizeOrSource || "",
        maxQty: it.quantity,
        quantity: 1,
        condition: "Good",
        gradeLevel: it.gradeLevel || "", // Added
      }))
    );

    setMessage({ type: "success", text: "✅ Checkout loaded successfully." });
  };

  const addManualLine = () => {
    setLines([
      ...lines,
      {
        itemId: "",
        itemName: "",
        sizeOrSource: "",
        maxQty: 9999,
        quantity: 1,
        condition: "Good",
        gradeLevel: "", // Added
      },
    ]);
  };

  const updateLine = (idx, patch) =>
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );

  const removeLine = (idx) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!returnedBy || lines.length === 0) {
      setMessage({ type: "error", text: "Please fill all required fields." });
      return;
    }

    const payload = {
      transactionRef,
      receiptRef,
      returnedBy,
      reason,
      items: lines.map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        sizeOrSource: l.sizeOrSource,
        quantity: Number(l.quantity),
        condition: l.condition,
        gradeLevel: l.gradeLevel || "", // Added
        remarks: l.remarks || "",
      })),
    };

    setLoading(true);
    const result = await createReturn(payload);
    setLoading(false);

    if (result.returnNumber || result.message?.includes("success")) {
      setMessage({
        type: "success",
        text: `✅ Return ${result.returnNumber || ""} recorded successfully.`,
      });
      setReceiptRef("");
      setTransactionRef("");
      setReturnedBy("");
      setReason("");
      setLines([]);
    } else {
      setMessage({
        type: "error",
        text: result.message || "Failed to record return.",
      });
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-[#800000]">
          <Undo2 className="h-5 w-5" /> Create Return
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ✅ Search by Receipt No */}
        <div>
          <Label>Receipt No.</Label>
          <div className="flex gap-2">
            <Input
              placeholder="RCPT-000111"
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
            />
            <Button onClick={handleLookup} disabled={loading || !receiptRef}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter receipt number from the checkout slip to load items.
          </p>
        </div>

        {/* Display transaction number (auto-filled) */}
        {transactionRef && (
          <div>
            <Label>Transaction No.</Label>
            <Input value={transactionRef} readOnly className="bg-gray-100" />
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Returned By</Label>
            <Input
              placeholder="Name of person returning"
              value={returnedBy}
              onChange={(e) => setReturnedBy(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Reason / Notes</Label>
            <Textarea
              placeholder="e.g., Damaged items, unused uniforms, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">Returned Items</div>
          <Button variant="outline" size="sm" onClick={addManualLine}>
            <ScanLine className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>

        {/* Items Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-100 text-xs font-medium text-slate-700 px-3 py-2">
            <div className="col-span-3">Item</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Condition</div>
            <div className="col-span-2">Grade Level</div> {/* Added */}
            <div className="col-span-2">Remarks</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {lines.length > 0 ? (
            <div className="divide-y">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center px-3 py-2 gap-2"
                >
                  <div className="col-span-3">
                    <Input
                      value={line.itemName}
                      onChange={(e) =>
                        updateLine(i, { itemName: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      max={line.maxQty}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(i, { quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={line.condition}
                      onValueChange={(v) => updateLine(i, { condition: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Grade Level"
                      value={line.gradeLevel || ""}
                      onChange={(e) =>
                        updateLine(i, { gradeLevel: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Remarks"
                      value={line.remarks || ""}
                      onChange={(e) =>
                        updateLine(i, { remarks: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-slate-500">
              No items added yet.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-700">
          <div>
            <b>Summary:</b> {totals.items} items | Qty {totals.qty} | Damaged{" "}
            {totals.damaged}
          </div>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4 mr-2" />
            )}
            Confirm Return
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 🧾 Return List (with item details)
function ReturnList() {
  const [returns, setReturns] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getReturns();
      setReturns(data);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Returns</CardTitle>
      </CardHeader>
      <CardContent>
        {returns.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-3">
            No returns recorded yet.
          </div>
        ) : (
          <table className="w-full text-sm border-t border-gray-200">
            <thead className="text-left text-slate-700 bg-slate-100">
              <tr>
                <th className="py-2 px-3">Return #</th>
                <th className="py-2 px-3">Returned By</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Receipt</th>
                <th className="py-2 px-3">Items</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <React.Fragment key={r._id}>
                  <tr className="border-t hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-[#800000]">
                      {r.returnNumber}
                    </td>
                    <td className="py-2 px-3">{r.returnedBy}</td>
                    <td className="py-2 px-3">
                      {r.dateReturned
                        ? new Date(r.dateReturned).toLocaleString()
                        : "-"}
                    </td>
                    <td className="py-2 px-3">{r.receiptRef || "-"}</td>
                    <td className="py-2 px-3">{r.items?.length || 0}</td>
                  </tr>

                  {/* Item details below each return */}
                  <tr className="bg-slate-50 text-slate-700">
                    <td colSpan="5" className="p-2 pl-8">
                      {r.items?.length > 0 ? (
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {r.items.map((item, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{item.itemName}</span>{" "}
                              {item.sizeOrSource ? `(${item.sizeOrSource})` : ""}{" "}
                              — {item.quantity} pcs{" "}
                              {item.gradeLevel ? (
                                <span className="text-gray-500">
                                  (Grade: {item.gradeLevel})
                                </span>
                              ) : null}{" "}
                              <span className="text-gray-500">
                                ({item.condition})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          No item details recorded.
                        </span>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
