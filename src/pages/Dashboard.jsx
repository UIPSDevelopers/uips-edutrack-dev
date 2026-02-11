"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ClipboardCheck,
  Users,
  Truck,
  AlertCircle,
  BarChart2,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axiosInstance from "@/lib/axios"; // ✅ use axiosInstance

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topCheckedOut, setTopCheckedOut] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, topRes, recentRes] = await Promise.all([
          axiosInstance.get("/dashboard/summary"),
          axiosInstance.get("/dashboard/top-checkedout"),
          axiosInstance.get("/dashboard/recent"),
        ]);

        const summary = summaryRes.data;
        const top = topRes.data;
        const recent = recentRes.data;

        setStats(summary || {});
        setLowStockItems(summary?.lowStockItems || []);
        setCategoryData(summary?.categoryDistribution || []);
        setTopCheckedOut(top || []);
        setRecentActivity(recent || []);
      } catch (err) {
        console.error("⚠️ Dashboard data error:", err);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = [
    { name: "Deliveries", value: stats.totalDeliveries || 0 },
    { name: "Checkouts", value: stats.totalCheckouts || 0 },
  ];

  const COLORS = ["#800000", "#a16207", "#0f766e", "#2563eb", "#9333ea"];

  return (
    <main className="p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          A quick overview of your inventory performance and recent activities.
        </p>

        {/* === Quick Stats === */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            icon={<Package className="text-[#800000]" />}
          />
          <StatCard
            title="Deliveries"
            value={stats.totalDeliveries}
            icon={<Truck className="text-[#800000]" />}
          />
          <StatCard
            title="Checkouts"
            value={stats.totalCheckouts}
            icon={<ClipboardCheck className="text-[#800000]" />}
          />
          <StatCard
            title="Users"
            value={stats.totalUsers}
            icon={<Users className="text-[#800000]" />}
          />
        </div>

        {/* === Charts Section === */}
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* 📊 Delivery vs Checkout */}
          <Card className="lg:col-span-1 border border-gray-200 shadow-sm rounded-2xl">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm text-gray-500 flex gap-2 items-center">
                <BarChart2 size={16} /> Deliveries vs Checkouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} barGap={20}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#800000" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 🥧 Category Distribution */}
          <Card className="lg:col-span-1 border border-gray-200 shadow-sm rounded-2xl">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm text-gray-500 flex gap-2 items-center">
                <PieChartIcon size={16} /> Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <p className="text-sm text-gray-500">No category data</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entry) => entry._id}
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 📈 Top Checked-Out Items */}
          <Card className="lg:col-span-1 border border-gray-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">
                Top Checked-Out Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCheckedOut.length === 0 ? (
                <p className="text-sm text-gray-500">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    layout="vertical"
                    data={topCheckedOut}
                    margin={{ left: 20, right: 20 }}
                  >
                    <XAxis type="number" />
                    <YAxis
                      dataKey="_id"
                      type="category"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="totalCheckedOut"
                      fill="#800000"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* === Low Stock & Activity === */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {/* ⚠️ Low Stock */}
          <Card className="border border-red-200 bg-red-50 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={16} /> Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-gray-600">No low-stock items 🎉</p>
              ) : (
                <ul className="text-sm text-gray-800 space-y-2">
                  {lowStockItems.slice(0, 8).map((item) => (
                    <li key={item.itemId} className="flex justify-between">
                      <span>{item.itemName}</span>
                      <span className="font-semibold text-red-700">
                        {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* 🕓 Recent Activity */}
          <Card className="border border-gray-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-3">
              {recentActivity.length === 0 ? (
                <p>No recent activity yet.</p>
              ) : (
                recentActivity.map((log, index) => (
                  <div
                    key={index}
                    className="flex justify-between border-b pb-2"
                  >
                    <span>
                      <span className="font-semibold text-[#800000]">
                        {log.user}
                      </span>{" "}
                      {log.action}{" "}
                      <span className="font-medium">{log.itemName}</span>
                    </span>
                    <span className="text-gray-500 text-xs">{log.date}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </main>
  );
}

/* 🔹 Reusable StatCard Component */
const StatCard = ({ title, value, icon }) => (
  <motion.div whileHover={{ scale: 1.03 }}>
    <Card className="shadow-sm border border-gray-200 bg-white rounded-2xl">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
        <div className="w-6 h-6">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-[#800000]">{value ?? 0}</p>
      </CardContent>
    </Card>
  </motion.div>
);
