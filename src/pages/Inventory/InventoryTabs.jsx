"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  PlusCircle,
  Truck,
  ShoppingCart,
  FileText,
  Undo2,
  Upload, // 🆕 for Bulk Import
} from "lucide-react";

export default function InventoryTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (location.pathname === "/inventory") setActiveTab("overview");
    else if (location.pathname.includes("/add-item")) setActiveTab("add");
    else if (location.pathname.includes("/delivery")) setActiveTab("delivery");
    else if (location.pathname.includes("/checkout")) setActiveTab("checkout");
    else if (location.pathname.includes("/returns")) setActiveTab("returns");
    else if (location.pathname.includes("/bulk-import"))
      setActiveTab("bulk"); // 🆕
    else if (location.pathname.includes("/reports")) setActiveTab("reports");
  }, [location]);

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList
        className="
          bg-white border border-gray-200 shadow-sm rounded-xl 
          flex items-center gap-2 p-2 
          overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300
          sm:justify-start md:justify-start lg:justify-start
        "
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <TabsTrigger
          value="overview"
          onClick={() => navigate("/inventory")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <Package size={16} /> Overview
        </TabsTrigger>

        <TabsTrigger
          value="add"
          onClick={() => navigate("/inventory/add-item")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <PlusCircle size={16} /> Add Item
        </TabsTrigger>

        <TabsTrigger
          value="delivery"
          onClick={() => navigate("/inventory/delivery")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <Truck size={16} /> Delivery / Stock-In
        </TabsTrigger>

        <TabsTrigger
          value="checkout"
          onClick={() => navigate("/inventory/checkout")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <ShoppingCart size={16} /> Checkout / POS
        </TabsTrigger>

        <TabsTrigger
          value="returns"
          onClick={() => navigate("/inventory/returns")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <Undo2 size={16} /> Returns
        </TabsTrigger>

        {/* 🆕 Bulk Import Tab */}
        <TabsTrigger
          value="bulk"
          onClick={() => navigate("/inventory/bulk-import")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <Upload size={16} /> Bulk Import
        </TabsTrigger>

        <TabsTrigger
          value="reports"
          onClick={() => navigate("/inventory/reports")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <FileText size={16} /> Reports
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
