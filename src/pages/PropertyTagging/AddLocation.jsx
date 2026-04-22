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

export default function AddLocation() {
  const [form, setForm] = useState({
    name: "",
    building: "",
    floor: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const res = await axiosInstance.get("/locations");
      setLocations(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch locations", err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle dropdown change
  const handleSelectChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit location
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosInstance.post("/locations", form);

      alert(`✅ Location added successfully: ${res.data.data.name}`);

      setForm({
        name: "",
        building: "",
        floor: "",
        description: "",
      });

      fetchLocations();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "❌ Failed to add location.";
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
      <div className="mt-4 mb-2">
        <h1 className="text-2xl font-semibold text-gray-800">Add Location</h1>
      </div>

      {/* FORM */}
      <Card className="shadow-sm border border-gray-200 mt-2">
        <CardHeader>
          <CardTitle>Add New Location</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            {/* Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Location Name *
              </label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Room 101, Library"
                required
              />
            </div>

            {/* Building DROPDOWN */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Building
              </label>

              <Select
                value={form.building}
                onValueChange={(val) => handleSelectChange("building", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Block A">Block A</SelectItem>
                  <SelectItem value="Block B">Block B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* FLOOR DROPDOWN */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">Floor</label>

              <Select
                value={form.floor}
                onValueChange={(val) => handleSelectChange("floor", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Floor">1st Floor</SelectItem>
                  <SelectItem value="2nd Floor">2nd Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <Input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional description"
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex justify-end mt-2">
              <Button
                type="submit"
                className="bg-[#800000] hover:bg-[#a10000] text-white"
                disabled={loading}
              >
                {loading ? "Saving..." : "Add Location"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="shadow-sm border border-gray-200 mt-6">
        <CardHeader>
          <CardTitle>Locations List</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Name
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Building
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Floor
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Description
                </th>
              </tr>
            </thead>

            <tbody>
              {locations.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-2">
                    No locations found.
                  </td>
                </tr>
              )}

              {locations.map((loc) => (
                <tr key={loc._id}>
                  <td className="border border-gray-300 px-2 py-1">
                    {loc.name}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {loc.building || "-"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {loc.floor || "-"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {loc.description || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
