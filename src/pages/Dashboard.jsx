"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import axiosInstance from "@/lib/axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ClipboardCheck,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topCheckedOut, setTopCheckedOut] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [assetStats, setAssetStats] = useState(null);

  const COLORS = ["#800000", "#a16207", "#0f766e", "#2563eb", "#9333ea"];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, topRes, recentRes] = await Promise.all([
          axiosInstance.get("/dashboard/summary"),
          axiosInstance.get("/dashboard/top-checkedout"),
          axiosInstance.get("/dashboard/recent"),
        ]);

        const summary = summaryRes.data;
        setStats(summary || {});
        setLowStockItems(summary?.lowStockItems || []);
        setCategoryData(summary?.categoryDistribution || []);
        setTopCheckedOut(topRes.data || []);
        setRecentActivity(recentRes.data || []);
        // fetch asset stats for property tagging
        try {
          const statsRes = await axiosInstance.get("/reports/asset/stats");
          setAssetStats(statsRes.data || {});
        } catch (e) {
          console.warn("Failed to fetch asset stats:", e?.message || e);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = [
    { name: "Deliveries", value: stats?.totalDeliveries || 0 },
    { name: "Checkouts", value: stats?.totalCheckouts || 0 },
  ];

  return (
    <main className="p-4 sm:p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your inventory and property tagging at a glance.
          </p>
        </div>

        {/* QUICK STATS */}
        <section className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Items"
            value={stats?.totalItems}
            icon={<Package />}
          />
          <StatCard
            title="Deliveries"
            value={stats?.totalDeliveries}
            icon={<Truck />}
          />
          <StatCard
            title="Checkouts"
            value={stats?.totalCheckouts}
            icon={<ClipboardCheck />}
          />
        </section>

        {/* CHARTS */}
        <section className="mt-6 grid lg:grid-cols-2 gap-6">
          <ChartCard title="Deliveries vs Checkouts" icon={<BarChart2 />}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#800000" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top Checked-Out Items">
            {topCheckedOut.length === 0 ? (
              <p className="text-sm text-gray-500">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart layout="vertical" data={topCheckedOut}>
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="_id"
                    width={140}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="totalCheckedOut"
                    fill="#800000"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        {/* RECENT ACTIVITY + CATEGORY */}
        <section className="mt-6 grid lg:grid-cols-2 gap-6">
          <RecentActivityCard logs={recentActivity} />

          <ChartCard title="Category Distribution" icon={<PieChartIcon />}>
            {categoryData.length === 0 ? (
              <p className="text-sm text-gray-500">No category data</p>
            ) : (
              <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                {/* Pie Chart */}
                <ResponsiveContainer width={250} height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="_id"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      cornerRadius={10}
                      labelLine={true} // show connecting lines
                      label={({
                        percent,
                        name,
                        cx,
                        cy,
                        midAngle,
                        outerRadius,
                      }) => {
                        const radius = outerRadius + 15; // offset outside the pie
                        const rad = (midAngle * Math.PI) / 180;
                        const x = cx + radius * Math.cos(-rad);
                        const y = cy + radius * Math.sin(-rad);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#000"
                            fontSize={10}
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {categoryData.map((cat, index) => (
                        <Cell
                          key={cat._id}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Legends */}
                <ul className="flex flex-row lg:flex-col gap-2 flex-wrap justify-center">
                  {categoryData.map((cat, index) => (
                    <li key={cat._id} className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {cat._id}: {cat.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ChartCard>
        </section>

        {/* LOW STOCK */}
        <section className="mt-6">
          <LowStockCard items={lowStockItems} />
        </section>

        {/* PROPERTY TAGGING */}
        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            Property Tagging
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            <div>
              <StatCard
                title="Total Assets"
                value={assetStats?.total || 0}
                icon={<Package />}
              />
            </div>

            <div>
              <StatCard
                title="Active"
                value={assetStats?.byStatus?.ACTIVE || assetStats?.byStatus?.Active || 0}
                icon={<ClipboardCheck />}
              />
            </div>

            <div>
              <StatCard
                title="Broken"
                value={assetStats?.byStatus?.BROKEN || assetStats?.byStatus?.Broken || 0}
                icon={<AlertCircle />}
              />
            </div>
          </div>

          <div className="mt-6 grid lg:grid-cols-2 gap-6">
            <ChartCard title="Assets by Category" icon={<PieChartIcon />}>
              {(!assetStats?.byCategory || assetStats.byCategory.length === 0) ? (
                <p className="text-sm text-gray-500">No asset category data</p>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={300} height={260}>
                    <PieChart>
                      <Pie
                        data={assetStats.byCategory}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={100}
                        paddingAngle={4}
                        cornerRadius={8}
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {assetStats.byCategory.map((c, i) => (
                          <Cell key={c._id} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <ul className="flex flex-col gap-2">
                    {assetStats.byCategory.map((c, i) => (
                      <li key={c._id} className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-gray-700">{c.name}: {c.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Top Locations">
              {(!assetStats?.byLocation || assetStats.byLocation.length === 0) ? (
                <p className="text-sm text-gray-500">No location data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="py-2 px-3 text-left">Location</th>
                        <th className="py-2 px-3 text-left">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetStats.byLocation.map((loc) => (
                        <tr key={loc._id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3">{loc.name}</td>
                          <td className="py-2 px-3 font-semibold">{loc.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartCard>
          </div>
        </section>
      </motion.div>
    </main>
  );
}

/* ================= REUSABLE COMPONENTS ================= */
const StatCard = ({ title, value, icon }) => (
  <motion.div whileHover={{ scale: 1.03 }}>
    <Card className="shadow-md border border-gray-200 rounded-2xl hover:shadow-lg transition">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-[#800000]">
          <CountUp end={value ?? 0} duration={1.5} separator="," />
        </p>
      </CardContent>
    </Card>
  </motion.div>
);

const ChartCard = ({ title, icon, children }) => (
  <Card className="border border-gray-200 shadow-md rounded-2xl hover:shadow-lg transition">
    <CardHeader className="flex items-center gap-2">
      {icon}
      <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const LowStockCard = ({ items }) => (
  <Card className="border border-red-200 bg-red-50 shadow-md rounded-2xl">
    <CardHeader>
      <CardTitle className="text-sm text-red-700 flex items-center gap-2">
        <AlertCircle size={16} /> Low Stock Items
      </CardTitle>
    </CardHeader>
    <CardContent>
      {items.length === 0 ? (
        <p className="text-sm text-gray-600">No low-stock items 🎉</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-red-100 text-red-700">
                <th className="py-2 px-3 text-left">Item Name</th>
                <th className="py-2 px-3 text-left">Grade Level</th>
                <th className="py-2 px-3 text-left">Size / Source</th>
                <th className="py-2 px-3 text-left">Item Type</th>
                <th className="py-2 px-3 text-left">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.itemId}
                  className="border-b hover:bg-red-100 transition"
                >
                  <td className="py-2 px-3 font-medium">{item.itemName}</td>
                  <td className="py-2 px-3">{item.gradeLevel}</td>
                  <td className="py-2 px-3">{item.sizeOrSource}</td>
                  <td className="py-2 px-3">{item.itemType}</td>
                  <td className="py-2 px-3 font-semibold text-red-700">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

const RecentActivityCard = ({ logs }) => (
  <Card className="border border-gray-200 shadow-md rounded-2xl">
    <CardHeader>
      <CardTitle className="text-sm text-gray-500">Recent Activity</CardTitle>
    </CardHeader>
    <CardContent>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity yet.</p>
      ) : (
        <ul className="relative border-l border-gray-300 ml-2">
          {logs.map((log, index) => (
            <li key={index} className="mb-6 ml-6">
              <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-[#800000] rounded-full ring-4 ring-white text-white">
                {log.action?.toLowerCase() === "delivered" ? "🚚" : "📦"}
              </span>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <p className="text-gray-800">
                  {log.user ? (
                    <span className="font-semibold text-[#800000]">
                      {log.user}{" "}
                    </span>
                  ) : (
                    <span className="font-semibold text-[#800000]">
                      Unknown User{" "}
                    </span>
                  )}
                  {log.action}{" "}
                  <span className="font-medium">
                    {log.items?.length ?? 0}{" "}
                    {log.items?.length === 1 ? "item" : "items"}
                  </span>
                </p>
                <span className="text-gray-400 text-xs mt-1 sm:mt-0">
                  {log.date ?? "-"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);
