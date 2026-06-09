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

  
  
  
  const [editType, setEditType] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [editForm, setEditForm] = useState({
    locationId: "",
    status: "",
    remarks: "",
  });

  const [savingEdit, setSavingEdit] = useState(false);

  
  
  
  const [showDialog, setShowDialog] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    serviceType: "",
    description: "",
    cost: "",
    performedBy: "",
    serviceDate: "",
  });

  
  
  
  const fetchAsset = async () => {
    try {
      setLoading(true);

      const [assetRes, locationRes] = await Promise.all([
        axiosInstance.get(`/asset/assets/${id}`),
        axiosInstance.get("/locations"),
      ]);

      const fetchedAsset = assetRes.data.asset || null;

      setAsset(fetchedAsset);
      setServices(assetRes.data.services || []);
      setHistory(assetRes.data.history || []);

      setLocations(
        Array.isArray(locationRes.data)
          ? locationRes.data
          : locationRes.data?.data || [],
      );

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

  
  
  
  const handleChange = (e) => {
    const { name, value } = e.target;

    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  
  
  const handleUpdateAsset = async () => {
    try {
      setSavingEdit(true);

      await axiosInstance.put(`/asset/assets/${id}`, {
        locationId: editForm.locationId,
        status: editForm.status,
        remarks: editForm.remarks,
      });

      alert("Asset updated successfully");

      setShowEditDialog(false);

      fetchAsset();
    } catch (error) {
      console.error("Update asset error:", error);

      alert(error?.response?.data?.message || "Failed to update asset");
    } finally {
      setSavingEdit(false);
    }
  };

  
  
  
  const allowedTypes = ["Cleaning", "Repair", "Maintenance", "Inspection"];

  
  
  
  const handleAddService = async () => {
    try {
      if (!serviceForm.serviceType) {
        alert("Please select a service type");
        return;
      }

      await axiosInstance.post(`/asset/assets/${id}/service`, {
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

  
  
  
  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  };

  const [history, setHistory] = useState([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  
  
  
  if (loading) return <p className="p-6">Loading asset...</p>;

  if (!asset) {
    return <p className="p-6 text-red-500">Asset not found</p>;
  }

  
  
  
  return (
    <main className="p-6 space-y-6">
      {}
      <Button variant="outline" onClick={() => navigate(-1)}>
        ← Back
      </Button>

      {}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Asset Details</CardTitle>

          <Button variant="outline" onClick={() => setShowHistoryDialog(true)}>
            View History
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {}
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

          {}
          <div className="grid md:grid-cols-3 gap-4">
            {}
            <div className="border rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 mb-1">Location</p>

                <p className="font-medium">{asset.locationId?.name || "-"}</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditType("location");
                  setShowEditDialog(true);
                }}
              >
                Edit
              </Button>
            </div>

            {}
            <div className="border rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>

                <p className="font-medium">{asset.status}</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditType("status");
                  setShowEditDialog(true);
                }}
              >
                Edit
              </Button>
            </div>

            {}
            <div className="border rounded-xl p-4 flex justify-between items-start">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Remarks</p>

                <p className="font-medium break-words">
                  {asset.remarks || "-"}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditType("remarks");
                  setShowEditDialog(true);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {}
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

      {}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {}
            {editType === "location" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>

                <select
                  name="locationId"
                  value={editForm.locationId}
                  onChange={handleEditChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select Location</option>

                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {}
            {editType === "status" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>

                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="BROKEN">BROKEN</option>
                  <option value="DISPOSED">DISPOSED</option>
                </select>
              </div>
            )}

            {}
            {editType === "remarks" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>

                <textarea
                  name="remarks"
                  value={editForm.remarks}
                  onChange={handleEditChange}
                  className="w-full border rounded-md p-2 min-h-[120px]"
                  placeholder="Enter remarks..."
                />
              </div>
            )}

            <Button
              onClick={handleUpdateAsset}
              disabled={savingEdit}
              className="w-full bg-[#800000] hover:bg-[#a10000]"
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
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

      {}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset History</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No history records found.</p>
            ) : (
              history.map((item) => (
                <div
                  key={item._id}
                  className="border rounded-xl p-4 bg-gray-50"
                >
                  {}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold text-sm">
                        {item.actionType?.replaceAll("_", " ").toUpperCase()}
                      </p>

                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {}
                  {item.changes?.location && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Location:</span>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                          {item.changes.location.old || "None"}
                        </span>

                        <span>→</span>

                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                          {item.changes.location.new || "None"}
                        </span>
                      </div>
                    </div>
                  )}

                  {}
                  {item.changes?.status && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Status:</span>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                          {item.changes.status.old || "None"}
                        </span>

                        <span>→</span>

                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                          {item.changes.status.new || "None"}
                        </span>
                      </div>
                    </div>
                  )}

                  {}
                  {item.changes?.remarks && (
                    <div className="text-sm">
                      <span className="font-medium">Remarks:</span>

                      <div className="mt-1 flex flex-col gap-2">
                        <div className="bg-red-100 text-red-700 p-2 rounded">
                          <strong>Old:</strong>{" "}
                          {item.changes.remarks.old || "-"}
                        </div>

                        <div className="bg-green-100 text-green-700 p-2 rounded">
                          <strong>New:</strong>{" "}
                          {item.changes.remarks.new || "-"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
