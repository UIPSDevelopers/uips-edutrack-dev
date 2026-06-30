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
import { useNavigate } from "react-router-dom";
import { canManageLocations } from "@/utils/roles";

export default function AddLocation() {
  const navigate = useNavigate();

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const role = user?.role;

  useEffect(() => {
    if (!canManageLocations(role)) {
      navigate("/property-tagging");
    }
  }, [role, navigate]);

  const [form, setForm] = useState({
    name: "",
    building: "",
    floor: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);

  
  
  
  const fetchLocations = async () => {
    try {
      const res = await axiosInstance.get("/locations/all");
      setLocations(res.data.data || []);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  
  
  
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  
  
  const handleSelectChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name.toUpperCase(),
        building: form.building.toUpperCase(),
        floor: form.floor.toUpperCase(),
        description: form.description.toUpperCase(),
      };

      const res = await axiosInstance.post("/locations", payload);

      alert(`✅ Location added: ${res.data.data.name}`);

      setForm({
        name: "",
        building: "",
        floor: "",
        description: "",
      });

      fetchLocations();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "❌ Failed to add location");
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
                Add Location
              </h1>
            </div>
          </div>
        </div>

        <PropertyTaggingTabs />

        <Card className="overflow-hidden shadow-sm border border-gray-200">
          <CardHeader className="items-center gap-4">
            <div>
              <CardTitle>Create New Location</CardTitle>
              <p className="text-sm text-slate-500">Add the location details for the tagged asset inventory.</p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Location Name *</label>
                <Input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Room 101" required />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Building</label>
                <Select value={form.building} onValueChange={(val) => handleSelectChange("building", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Building" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Block A">BLOCK A</SelectItem>
                    <SelectItem value="Block B">BLOCK B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700">Floor</label>
                <Select value={form.floor} onValueChange={(val) => handleSelectChange("floor", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Floor">GROUND FLOOR</SelectItem>
                    <SelectItem value="2nd Floor">2ND FLOOR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Input name="description" value={form.description} onChange={handleChange} placeholder="Optional description" />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={loading} className="bg-[#800000] hover:bg-[#a10000] text-white">
                  {loading ? "Saving..." : "Add Location"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle>Locations List</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Building</th>
                  <th className="p-3 text-left">Floor</th>
                  <th className="p-3 text-left">Description</th>
                </tr>
              </thead>

              <tbody>
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-slate-500">
                      No locations found
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => (
                    <tr key={loc._id} className="border-b bg-white transition hover:bg-slate-50">
                      <td className="p-3">{loc.name}</td>
                      <td className="p-3">{loc.building || "-"}</td>
                      <td className="p-3">{loc.floor || "-"}</td>
                      <td className="p-3">{loc.description || "-"}</td>
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
