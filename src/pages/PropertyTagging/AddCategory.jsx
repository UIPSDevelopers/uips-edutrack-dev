"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/lib/axios";

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
        name: form.name,
        code: form.code,
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
      const msg =
        err.response?.data?.message || "❌ Failed to add category.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ADD CATEGORY FORM */}
      <Card className="shadow-sm border border-gray-200 mt-4">
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            {/* Category Name */}
            <div className="flex flex-col md:col-span-1">
              <label className="text-sm font-medium text-gray-700">
                Category Name
              </label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Electronics, Furniture"
                required
              />
            </div>

            {/* Category Code */}
            <div className="flex flex-col md:col-span-1">
              <label className="text-sm font-medium text-gray-700">
                Category Code
              </label>
              <Input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g., ELEC, FURN"
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex justify-end mt-2">
              <Button
                type="submit"
                className="bg-[#800000] hover:bg-[#a10000] text-white"
                disabled={loading}
              >
                {loading ? "Saving..." : "Add Category"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* CATEGORY LIST TABLE */}
      <Card className="shadow-sm border border-gray-200 mt-6">
        <CardHeader>
          <CardTitle>Categories List</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Name
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Code
                </th>
              </tr>
            </thead>

            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-2">
                    No categories found.
                  </td>
                </tr>
              )}

              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td className="border border-gray-300 px-2 py-1">
                    {cat.name}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {cat.code || "-"}
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
