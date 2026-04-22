"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import axiosInstance from "@/lib/axios";

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDialog, setShowDialog] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    type: "",
    date: "",
    remarks: "",
  });

  // =========================
  // FETCH ASSET DETAILS
  // =========================
  const fetchAsset = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get(
        `/property-tagging/assets/${id}`
      );

      setAsset(res.data.asset);
      setServices(res.data.services || []);
    } catch (error) {
      console.error("Error fetching asset:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  // =========================
  // HANDLE SERVICE ADD
  // =========================
  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddService = async () => {
    try {
      await axiosInstance.post(
        `/property-tagging/assets/${id}/service`,
        serviceForm
      );

      setShowDialog(false);
      setServiceForm({ type: "", date: "", remarks: "" });

      fetchAsset(); // refresh
    } catch (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service");
    }
  };

  // =========================
  // UI
  // =========================
  if (loading) {
    return <p className="p-6">Loading asset...</p>;
  }

  if (!asset) {
    return <p className="p-6 text-red-500">Asset not found</p>;
  }

  return (
    <main className="p-6 space-y-6">
      {/* BACK */}
      <Button variant="outline" onClick={() => navigate(-1)}>
        ← Back
      </Button>

      {/* ASSET DETAILS */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Serial No:</strong> {asset.serialNo}
          </div>
          <div>
            <strong>Name:</strong> {asset.assetName}
          </div>
          <div>
            <strong>Category:</strong>{" "}
            {asset.categoryId?.name || "-"}
          </div>
          <div>
            <strong>Location:</strong>{" "}
            {asset.locationId?.name || "-"}
          </div>
          <div>
            <strong>Brand:</strong> {asset.brand || "-"}
          </div>
          <div>
            <strong>Model:</strong> {asset.model || "-"}
          </div>
          <div>
            <strong>Status:</strong> {asset.status}
          </div>
          <div>
            <strong>Purchase Date:</strong>{" "}
            {asset.purchaseDate || "-"}
          </div>
        </CardContent>
      </Card>

      {/* SERVICE HISTORY */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Service History</CardTitle>

          <Button
            onClick={() => setShowDialog(true)}
            className="bg-[#800000] hover:bg-[#a10000]"
          >
            + Add Service
          </Button>
        </CardHeader>

        <CardContent>
          {services.length === 0 ? (
            <p className="text-gray-500">No service history</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Type</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3">{s.type}</td>
                    <td className="p-3">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="p-3">{s.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ADD SERVICE MODAL */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              name="type"
              placeholder="Service Type (Cleaning, Repair)"
              value={serviceForm.type}
              onChange={handleServiceChange}
            />

            <Input
              type="date"
              name="date"
              value={serviceForm.date}
              onChange={handleServiceChange}
            />

            <Input
              name="remarks"
              placeholder="Remarks"
              value={serviceForm.remarks}
              onChange={handleServiceChange}
            />

            <Button
              onClick={handleAddService}
              className="w-full bg-[#800000] hover:bg-[#a10000]"
            >
              Save Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
