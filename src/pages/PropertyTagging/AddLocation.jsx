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

  // ======================
  // FETCH LOCATIONS
  // ======================
  const fetchLocations = async () => {
    try {
      const res = await axiosInstance.get("/locations");
      setLocations(res.data.data || []);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // ======================
  // INPUT HANDLER
  // ======================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================
  // SELECT HANDLER
  // ======================
  const handleSelectChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ======================
  // SUBMIT LOCATION
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosInstance.post("/locations", form);

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
      {/* ======================
          TABS
      ====================== */}
      <PropertyTaggingTabs />

      {/* ======================
          HEADER
      ====================== */}
      <div className="mt-4 mb-3">
        <h1 className="text-2xl font-semibold text-gray-800">Add Location</h1>
      </div>

      {/* ======================
          FORM CARD
      ====================== */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle>Create New Location</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* NAME */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Location Name *
              </label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Room 101"
                required
              />
            </div>

            {/* BUILDING */}
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

            {/* FLOOR */}
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

            {/* DESCRIPTION */}
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

            {/* SUBMIT */}
            <div className="md:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#800000] hover:bg-[#a10000] text-white"
              >
                {loading ? "Saving..." : "Add Location"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ======================
          TABLE CARD
      ====================== */}
      <Card className="shadow-sm border border-gray-200 mt-6">
        <CardHeader>
          <CardTitle>Locations List</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Building</th>
                <th className="p-2 border">Floor</th>
                <th className="p-2 border">Description</th>
              </tr>
            </thead>

            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-3">
                    No locations found
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc._id} className="hover:bg-gray-50">
                    <td className="p-2 border">{loc.name}</td>
                    <td className="p-2 border">{loc.building || "-"}</td>
                    <td className="p-2 border">{loc.floor || "-"}</td>
                    <td className="p-2 border">{loc.description || "-"}</td>
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
