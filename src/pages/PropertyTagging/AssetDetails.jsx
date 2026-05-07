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

  const [locations, setLocations] = useState([]);

  // =========================
  // EDIT STATES
  // =========================
  const [editForm, setEditForm] = useState({
    locationId: "",
    status: "",
    remarks: "",
  });

  const [savingEdit, setSavingEdit] = useState(false);

  // =========================
  // SERVICE MODAL
  // =========================
  const [showDialog, setShowDialog] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    serviceType: "",
    description: "",
    cost: "",
    performedBy: "",
    serviceDate: "",
  });

  // =========================
  // FETCH ASSET
  // =========================
  const fetchAsset = async () => {
    try {
      setLoading(true);

      const [assetRes, locationRes] = await Promise.all([
        axiosInstance.get(`/property-tagging/assets/${id}`),
        axiosInstance.get("/locations"),
      ]);

      const fetchedAsset = assetRes.data.asset || null;

      setAsset(fetchedAsset);
      setServices(assetRes.data.services || []);

      setLocations(
        Array.isArray(locationRes.data)
          ? locationRes.data
          : locationRes.data?.data || [],
      );

      // PREFILL EDIT FORM
      setEditForm({
        locationId: fetchedAsset?.locationId?._id || "",
        status: fetchedAsset?.status || "Active",
        remarks: fetchedAsset?.remarks || "",
      });
    } catch (error) {
      console.error(
        "Error fetching asset:",
        error?.response?.data || error.message,
      );

      setAsset(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  // =========================
  // INPUT HANDLER
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // EDIT HANDLER
  // =========================
  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // UPDATE ASSET
  // =========================
  const handleUpdateAsset = async () => {
    try {
      setSavingEdit(true);

      await axiosInstance.put(`/property-tagging/assets/${id}`, {
        locationId: editForm.locationId,
        status: editForm.status,
        remarks: editForm.remarks,
      });

      alert("Asset updated successfully");

      fetchAsset();
    } catch (error) {
      console.error("Update asset error:", error);

      alert(error?.response?.data?.message || "Failed to update asset");
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================
  // VALID SERVICE TYPES
  // =========================
  const allowedTypes = ["Cleaning", "Repair", "Maintenance", "Inspection"];

  // =========================
  // ADD SERVICE
  // =========================
  const handleAddService = async () => {
    try {
      if (!serviceForm.serviceType) {
        alert("Please select a service type");
        return;
      }

      await axiosInstance.post(`/property-tagging/assets/${id}/service`, {
        serviceType: serviceForm.serviceType,
        description: serviceForm.description || "",
        cost: Number(serviceForm.cost || 0),
        performedBy: serviceForm.performedBy || "N/A",

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

      alert(error?.response?.data?.message || "Failed to add service");
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
  // LOADING STATES
  // =========================
  if (loading) return <p className="p-6">Loading asset...</p>;

  if (!asset) {
    return <p className="p-6 text-red-500">Asset not found</p>;
  }

  // =========================
  // UI
  // =========================
  return (
    <main className="p-6 space-y-6">
      {/* BACK */}
      <Button variant="outline" onClick={() => navigate(-1)}>
        ← Back
      </Button>

      {/* ASSET INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* VIEW DETAILS */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Serial:</strong> {asset.serialNo}
            </div>

            <div>
              <strong>Name:</strong> {asset.assetName}
            </div>

            <div>
              <strong>Category:</strong> {asset.categoryId?.name || "-"}
            </div>

            <div>
              <strong>Brand:</strong> {asset.brand || "-"}
            </div>

            <div>
              <strong>Model:</strong> {asset.model || "-"}
            </div>

            <div>
              <strong>Purchase:</strong> {formatDate(asset.purchaseDate)}
            </div>
          </div>

          {/* EDIT SECTION */}
          <div className="border rounded-lg p-4 space-y-4">
            <h2 className="font-semibold text-sm">Edit Asset Information</h2>

            {/* LOCATION */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Location</label>

              <select
                name="locationId"
                value={editForm.locationId}
                onChange={handleEditChange}
                className="w-full border rounded-md p-2 text-sm"
              >
                <option value="">Select Location</option>

                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Status</label>

              <select
                name="status"
                value={editForm.status}
                onChange={handleEditChange}
                className="w-full border rounded-md p-2 text-sm"
              >
                <option value="Active">Active</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Disposed">Disposed</option>
              </select>
            </div>

            {/* REMARKS */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Remarks</label>

              <textarea
                name="remarks"
                value={editForm.remarks}
                onChange={handleEditChange}
                className="w-full border rounded-md p-2 text-sm min-h-[100px]"
                placeholder="Enter remarks..."
              />
            </div>

            <Button
              onClick={handleUpdateAsset}
              disabled={savingEdit}
              className="bg-[#800000] hover:bg-[#a10000]"
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SERVICE HISTORY */}
      <Card>
        <CardHeader className="flex justify-between items-center">
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
                  <th className="p-3">By</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {services.map((s) => (
                  <tr key={s._id} className="border-b">
                    <td className="p-3">{s.serviceType}</td>

                    <td className="p-3">{s.description}</td>

                    <td className="p-3">{s.cost ? `AED ${s.cost}` : "-"}</td>

                    <td className="p-3">{s.performedBy}</td>

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
            {/* SERVICE TYPE */}
            <select
              name="serviceType"
              value={serviceForm.serviceType}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Select Service Type</option>

              {allowedTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

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
