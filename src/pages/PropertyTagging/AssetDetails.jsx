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
    serviceType: "",
    description: "",
    cost: "",
    performedBy: "",
    serviceDate: "",
  });

  // =========================
  // FETCH ASSET DETAILS
  // =========================
  const fetchAsset = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get(`/property-tagging/assets/${id}`);

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
  // HANDLE INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // ADD SERVICE
  // =========================
  const handleAddService = async () => {
    try {
      await axiosInstance.post(`/property-tagging/assets/${id}/service`, {
        ...serviceForm,
        serviceDate: serviceForm.serviceDate
          ? new Date(serviceForm.serviceDate).toISOString()
          : new Date().toISOString(),
      });

      setShowDialog(false);

      setServiceForm({
        serviceType: "",
        description: "",
        cost: "",
        performedBy: "",
        serviceDate: "",
      });

      fetchAsset();
    } catch (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service");
    }
  };

  // =========================
  // SAFE DATE FORMAT
  // =========================
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  };

  // =========================
  // UI STATES
  // =========================
  if (loading) return <p className="p-6">Loading asset...</p>;

  if (!asset) return <p className="p-6 text-red-500">Asset not found</p>;

  // =========================
  // UI
  // =========================
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
            <strong>Category:</strong> {asset.categoryId?.name || "-"}
          </div>
          <div>
            <strong>Location:</strong> {asset.locationId?.name || "-"}
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
            <strong>Purchase Date:</strong> {formatDate(asset.purchaseDate)}
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
                  <th className="p-3">Description</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Performed By</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {services.map((s) => (
                  <tr key={s._id} className="border-b">
                    <td className="p-3">{s.serviceType || "-"}</td>
                    <td className="p-3">{s.description || "-"}</td>
                    <td className="p-3">{s.cost ? `AED ${s.cost}` : "-"}</td>
                    <td className="p-3">{s.performedBy || "-"}</td>
                    <td className="p-3">{formatDate(s.serviceDate)}</td>
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
              name="serviceType"
              placeholder="Service Type (Cleaning, Repair)"
              value={serviceForm.serviceType}
              onChange={handleChange}
            />

            <Input
              name="description"
              placeholder="Description"
              value={serviceForm.description}
              onChange={handleChange}
            />

            <Input
              name="cost"
              type="number"
              placeholder="Cost"
              value={serviceForm.cost}
              onChange={handleChange}
            />

            <Input
              name="performedBy"
              placeholder="Performed By"
              value={serviceForm.performedBy}
              onChange={handleChange}
            />

            <Input
              type="date"
              name="serviceDate"
              value={serviceForm.serviceDate}
              onChange={handleChange}
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
