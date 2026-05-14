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
    locationId: "",
    status: "ACTIVE",
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
  // INPUT HANDLER
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // SELECT HANDLER
  // =========================
  const handleSelectChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // ADD SINGLE ASSET
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const payload = {
        assetName: form.assetName?.toUpperCase(),
        brand: form.brand?.toUpperCase(),
        model: form.model?.toUpperCase(),
        categoryId: form.categoryId,
        locationId: form.locationId,
        status: form.status,
        purchaseDate: form.purchaseDate,
        serialNo: form.serialNo?.toUpperCase(),
        remarks: form.remarks?.toUpperCase(),
      };

      const res = await axiosInstance.post("asset/assets", payload);

      const { asset } = res.data;

      alert(`✅ Asset added successfully!\nSerial: ${asset.serialNo}`);

      setForm({
        assetName: "",
        brand: "",
        model: "",
        categoryId: "",
        locationId: "",
        status: "ACTIVE",
        purchaseDate: "",
        serialNo: "",
        remarks: "",
      });

      fetchAssets();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "❌ Failed to add asset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="p-6 space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Property Tagging
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Add Asset
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Categories</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{categories.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Locations</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{locations.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Existing Assets</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{assets.length}</p>
              </div>
            </div>
          </div>
        </div>

        <PropertyTaggingTabs />

        <Card className="overflow-hidden shadow-sm border border-gray-200">
          <CardHeader className="items-center gap-4">
            <div>
              <CardTitle>Add New Asset</CardTitle>
              <p className="text-sm text-slate-500">Enter the details for the tagged asset you want to add.</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Asset Name</label>
                <Input name="assetName" value={form.assetName} onChange={handleChange} required />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Brand</label>
                <Input name="brand" value={form.brand} onChange={handleChange} />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Model</label>
                <Input name="model" value={form.model} onChange={handleChange} />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <Select value={form.categoryId} onValueChange={(val) => handleSelectChange("categoryId", val)}>
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

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Location</label>
                <Select value={form.locationId} onValueChange={(val) => handleSelectChange("locationId", val)}>
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

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select value={form.status} onValueChange={(val) => handleSelectChange("status", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="BROKEN">BROKEN</SelectItem>
                    <SelectItem value="DISPOSED">DISPOSED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Purchase Date</label>
                <Input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Remarks</label>
                <Input name="remarks" value={form.remarks} onChange={handleChange} />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={loading} className="bg-[#800000] hover:bg-[#a10000] text-white">
                  {loading ? "Saving..." : "Add Asset"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle>Assets List</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-3 text-left">Serial</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Brand</th>
                  <th className="p-3 text-left">Model</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Purchase Date</th>
                  <th className="p-3 text-left">Location</th>
                </tr>
              </thead>

              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-slate-500">
                      No assets found.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset._id} className="border-b bg-white transition hover:bg-slate-50">
                      <td className="p-3">{asset.serialNo}</td>
                      <td className="p-3">{asset.assetName}</td>
                      <td className="p-3">{asset.categoryId?.name || "-"}</td>
                      <td className="p-3">{asset.brand || "-"}</td>
                      <td className="p-3">{asset.model || "-"}</td>
                      <td className="p-3">{asset.status}</td>
                      <td className="p-3">
                        {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-3">{asset.locationId?.name || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
