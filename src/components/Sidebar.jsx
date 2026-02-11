import React from "react";
import {
  LayoutDashboard,
  Boxes,
  Tag,
  Users,
  UserCog,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Inventory", icon: Boxes, path: "/inventory" },
  { name: "Property Tagging", icon: Tag, path: "/property-tagging" },
  { name: "Visitors", icon: Users, path: "/visitors" },
  { name: "Users", icon: UserCog, path: "/users" },
  { name: "Reports", icon: FileText, path: "/reports-page" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Desktop Sidebar (no animation so it doesn't re-slide every route change) */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-[#800000] text-white p-6 space-y-6 fixed left-0 top-0 shadow-xl">
        <div className="text-2xl font-semibold tracking-tight">
          UIPS EduTrack
        </div>

        <nav className="flex flex-col space-y-2 mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm font-medium ${
                    isActive ? "bg-white/20" : "hover:bg-white/10"
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto text-xs text-gray-300">
          © 2025 UIPS EduTrack
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="fixed top-0 left-0 h-full w-64 bg-[#800000] text-white p-6 space-y-6 z-50 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold">UIPS EduTrack</div>
                <button
                  onClick={onClose}
                  className="text-gray-300 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col space-y-2 mt-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm font-medium ${
                          isActive ? "bg-white/20" : "hover:bg-white/10"
                        }`
                      }
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
