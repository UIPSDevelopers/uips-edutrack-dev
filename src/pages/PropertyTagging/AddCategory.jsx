"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/lib/axios";
import PropertyTaggingTabs from "./PropertyTaggingTabs";

export default function AddCategory() {
  const [form, setForm] = useState({
    name: "",
    code: "",
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      setCategories(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit category
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name.toUpperCase(),
        code: form.code.toUpperCase(),
      };

      const res = await axiosInstance.post("/categories", payload);

      alert(`✅ Category added successfully: ${res.data.data.name}`);

      // reset form
      setForm({
        name: "",
        code: "",
      });

      fetchCategories();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "❌ Failed to add category.";
      alert(msg);
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
                Add Category
              </h1>
            </div>
          </div>
        </div>

        <PropertyTaggingTabs />

        <Card className="overflow-hidden shadow-sm border border-gray-200">
          <CardHeader className="items-center gap-4">
            <div>
              <CardTitle>Add New Category</CardTitle>
              <p className="text-sm text-slate-500">Create a category to classify assets consistently.</p>
            </div>
          </CardHeader>

          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col md:col-span-1">
                <label className="text-sm font-medium text-slate-700">Category Name</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Electronics, Furniture"
                  required
                />
              </div>

              <div className="flex flex-col md:col-span-1">
                <label className="text-sm font-medium text-slate-700">Category Code</label>
                <Input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g., ELEC, FURN"
                />
              </div>

              <div className="md:col-span-2 flex justify-end mt-2">
                <Button type="submit" className="bg-[#800000] hover:bg-[#a10000] text-white" disabled={loading}>
                  {loading ? "Saving..." : "Add Category"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle>Categories List</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Code</th>
                </tr>
              </thead>

              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-4 text-slate-500">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat._id} className="border-b bg-white transition hover:bg-slate-50">
                      <td className="p-3">{cat.name}</td>
                      <td className="p-3">{cat.code || "-"}</td>
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
