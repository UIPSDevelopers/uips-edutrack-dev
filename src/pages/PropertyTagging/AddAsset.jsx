"use client";

import React, { useState, useEffect } from "react";
import PropertyTaggingTabs from "./PropertyTaggingTabs";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/lib/axios";

export default function AddAsset() {
  const [form, setForm] = useState({
    assetName: "",
    brand: "",
    model: "",
    categoryId: "",
    locationId: "", // ✅ FIXED (important)
    status: "Active",
    purchaseDate: "",
    serialNo: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [assets, setAssets] = useState([]);

  // =========================
  // FETCH CATEGORIES
  // =========================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get("/categories");
        setCategories(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };

    fetchCategories();
  }, []);

  // =========================
  // FETCH LOCATIONS
  // =========================
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axiosInstance.get("/locations");
        setLocations(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    };

    fetchLocations();
  }, []);

  // =========================
  // FETCH ASSETS
  // =========================
  const fetchAssets = async () => {
    try {
      const res = await axiosInstance.get("asset/assets");
      setAssets(res.data.assets || []);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // =========================
  // HANDLERS
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosInstance.post(
        "asset/assets/create",
        form,
      );

      const { asset } = res.data;

      alert(`✅ Asset added successfully!\nSerial: ${asset.serialNo}`);

      // reset form
      setForm({
        assetName: "",
        brand: "",
        model: "",
        categoryId: "",
        locationId: "",
        status: "Active",
        purchaseDate: "",
        serialNo: "",
        remarks: "",
      });

      fetchAssets();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "❌ Failed to add asset.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* TABS */}
      <PropertyTaggingTabs />

      {/* HEADER */}
      <div className="flex justify-between items-center mt-4 mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Add Assets</h1>
      </div>

      {/* FORM */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle>Add New Asset</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            {/* Asset Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Asset Name</label>
              <Input
                name="assetName"
                value={form.assetName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Brand */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Brand</label>
              <Input name="brand" value={form.brand} onChange={handleChange} />
            </div>

            {/* Model */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Model</label>
              <Input name="model" value={form.model} onChange={handleChange} />
            </div>

            {/* Category */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={form.categoryId}
                onValueChange={(val) => handleSelectChange("categoryId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* LOCATION (FIXED → from DB) */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Location</label>
              <Select
                value={form.locationId}
                onValueChange={(val) => handleSelectChange("locationId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name} {loc.building ? `(${loc.building})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={form.status}
                onValueChange={(val) => handleSelectChange("status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                  <SelectItem value="Disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Date */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Purchase Date</label>
              <Input
                type="date"
                name="purchaseDate"
                value={form.purchaseDate}
                onChange={handleChange}
              />
            </div>

            {/* Serial */}
            {/* <div className="flex flex-col">
              <label className="text-sm font-medium">Serial No</label>
              <Input
                name="serialNo"
                value={form.serialNo}
                onChange={handleChange}
              />
            </div> */}

            {/* Remarks */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium">Remarks</label>
              <Input
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#800000] hover:bg-[#a10000] text-white"
              >
                {loading ? "Saving..." : "Add Asset"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="shadow-sm border border-gray-200 mt-6">
        <CardHeader>
          <CardTitle>Assets List</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Serial</th>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Category</th>
                <th className="border px-2 py-1">Brand</th>
                <th className="border px-2 py-1">Model</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Purchase Date</th>
                <th className="border px-2 py-1">Location</th>
              </tr>
            </thead>

            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-3">
                    No assets found.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id}>
                    <td className="border px-2 py-1">{asset.serialNo}</td>
                    <td className="border px-2 py-1">{asset.assetName}</td>
                    <td className="border px-2 py-1">
                      {asset.categoryId?.name || "-"}
                    </td>
                    <td className="border px-2 py-1">{asset.brand || "-"}</td>
                    <td className="border px-2 py-1">{asset.model || "-"}</td>
                    <td className="border px-2 py-1">{asset.status}</td>
                    <td className="border px-2 py-1">
                      {asset.purchaseDate
                        ? new Date(asset.purchaseDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {asset.locationId?.name || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
