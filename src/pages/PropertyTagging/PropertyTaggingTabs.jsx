"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, PlusCircle, FileText, FolderPlus } from "lucide-react";

export default function PropertyTaggingTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (location.pathname === "/property-tagging") {
      setActiveTab("overview");
    } else if (location.pathname.includes("/add-asset")) {
      setActiveTab("add");
    } else if (location.pathname.includes("/categories")) {
      setActiveTab("categories");
    } else if (location.pathname.includes("/reports")) {
      setActiveTab("reports");
    }
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
        {/* Overview */}
        <TabsTrigger
          value="overview"
          onClick={() => navigate("/property-tagging")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <Package size={16} /> Overview
        </TabsTrigger>

        {/* Add Asset */}
        <TabsTrigger
          value="add"
          onClick={() => navigate("/property-tagging/add-asset")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <PlusCircle size={16} /> Add Asset
        </TabsTrigger>

        {/* Categories (NEW) */}
        <TabsTrigger
          value="categories"
          onClick={() => navigate("/property-tagging/categories")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <FolderPlus size={16} /> Categories
        </TabsTrigger>

        {/* Reports */}
        <TabsTrigger
          value="reports"
          onClick={() => navigate("/property-tagging/reports")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-fit
          data-[state=active]:bg-[#800000] data-[state=active]:text-white"
        >
          <FileText size={16} /> Reports
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
