// src/layouts/AppLayout.jsx
"use client";

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex font-poppins bg-gray-50 min-h-screen">
      {/* Sidebar is now GLOBAL, only mounts once */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      <div className="flex-1 ml-0 md:ml-64 transition-all duration-300">
        <Topbar onToggleSidebar={handleToggleSidebar} />

        {/* All pages will render here */}
        <main className="p-6 space-y-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
