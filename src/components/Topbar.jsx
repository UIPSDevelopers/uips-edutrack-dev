import React, { useState, useRef, useEffect } from "react";
import { Bell, Menu, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative w-full flex items-center justify-between bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-50 overflow-visible">
      {/* 🌈 Background Gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-24 w-72 h-72 bg-gradient-to-br from-[#800000] via-[#a63c3c] to-[#b86a6a] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-[#800000] to-transparent opacity-10 rounded-full blur-2xl"></div>
      </div>

      {/* Left Section */}
      <div className="flex items-center gap-3 relative z-10">
        {/* 🍔 Burger (mobile) */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-gray-700 hover:text-[#800000] transition transform hover:scale-110"
        >
          <Menu size={24} />
        </button>

        {/* Accent Label */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-2 h-8 bg-[#800000] rounded-full shadow-sm"></div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              EduTrack Control Panel
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {user ? user.firstname : "User"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-5 relative z-50">
        {/* 🔔 Notifications */}
        <button className="relative text-gray-600 hover:text-[#800000] transition">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* 👤 User Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 focus:outline-none group"
          >
            <div className="h-9 w-9 rounded-full bg-[#800000] text-white flex items-center justify-center text-sm font-medium shadow-md group-hover:ring-2 group-hover:ring-[#800000]/50 transition">
              {user?.firstname?.[0] || "U"}
            </div>
            <ChevronDown
              size={16}
              className={`text-gray-500 transition-transform ${
                menuOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[9999] animate-fadeIn">
              <div className="px-3 pb-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">
                  {user ? `${user.firstname} ${user.lastname}` : "Guest"}
                </p>
                <p className="text-xs text-gray-500">{user?.role || "User"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#800000] transition"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
