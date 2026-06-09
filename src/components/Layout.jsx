"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex font-poppins bg-gray-50 min-h-screen">
      {}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      {}
      <div className="flex-1 ml-0 md:ml-64 transition-all duration-300">
        {}
        <Topbar onToggleSidebar={handleToggleSidebar} />

        {}
        <main className="p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
