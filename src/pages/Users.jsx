"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newUser, setNewUser] = useState({
    firstname: "",
    lastname: "",
    email: "",
    role: "InventoryStaff",
    password: "",
  });

  const [editUser, setEditUser] = useState(null);

  // ✅ Sidebar state (for mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // 👤 Get current user + role
  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;

  // 🚫 IT-only access
  const canAccessUsers = role === "IT";

  // 🧠 Fetch all users (only if IT)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/users");
        setUsers(res.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    if (!canAccessUsers) {
      setLoading(false);
      setUsers([]);
      return;
    }

    fetchUsers();
  }, [canAccessUsers]);

  // ➕ Add User Handler
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (
      !newUser.firstname ||
      !newUser.lastname ||
      !newUser.email ||
      !newUser.password
    ) {
      return toast.error("Please fill all fields");
    }

    try {
      // axiosInstance already has baseURL, just use relative path
      const res = await axiosInstance.post("/users", newUser);

      const createdUser = res.data.user || res.data;
      setUsers((prev) => [...prev, createdUser]);

      toast.success("User added successfully");
      setNewUser({
        firstname: "",
        lastname: "",
        email: "",
        role: "InventoryStaff",
        password: "",
      });
      document.getElementById("closeAddDialogBtn")?.click();
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error.response?.data?.message || "Failed to add user");
    }
  };

  // ✏️ Edit User Handler
  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!editUser) return;

    try {
      console.log("🔹 Updating user:", editUser);

      // 🆕 Build payload and avoid sending empty password
      const payload = { ...editUser };
      if (!payload.password) {
        delete payload.password; // don't update password if left blank
      }

      const res = await axiosInstance.put(`/users/${editUser.userId}`, payload);

      console.log("✅ Update user response:", res.data);

      const updatedUser = res.data.user || res.data;

      setUsers((prev) =>
        prev.map((u) =>
          u.userId === editUser.userId || u._id === editUser._id
            ? updatedUser
            : u
        )
      );

      toast.success("User updated successfully");
      setEditUser(null);

      const closeBtn = document.getElementById("closeEditDialogBtn");
      if (closeBtn) closeBtn.click();
    } catch (error) {
      console.error("❌ Error updating user:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to update user";
      toast.error(msg);
    }
  };

  return (
    <>
        {/* 🚫 Unauthorized overlay (IT-only) */}
        {!canAccessUsers && (
          <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white shadow-lg border border-red-300 rounded-xl p-8 text-center w-[350px]">
              <h2 className="text-xl font-semibold text-red-700 mb-2">
                Unauthorized Access
              </h2>
              <p className="text-sm text-gray-600">
                You do not have permission to access the Users Management
                section.
              </p>
            </div>
          </div>
        )}

        <main
          className={`p-6 space-y-6 ${
            !canAccessUsers ? "pointer-events-none opacity-20" : ""
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-semibold text-gray-800">Users</h1>

              {/* Add User Modal */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-[#800000] hover:bg-[#a10000] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add User
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleAddUser} className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>First Name</Label>
                        <Input
                          type="text"
                          placeholder="Enter first name"
                          value={newUser.firstname}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              firstname: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Last Name</Label>
                        <Input
                          type="text"
                          placeholder="Enter last name"
                          value={newUser.lastname}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              lastname: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        placeholder="Set initial password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) =>
                          setNewUser({ ...newUser, role: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Accounts">Accounts</SelectItem>
                          <SelectItem value="InventoryStaff">
                            Inventory Staff
                          </SelectItem>
                          <SelectItem value="InventoryAdmin">
                            Inventory Admin
                          </SelectItem>
                          <SelectItem value="Security">Security</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        type="button"
                        id="closeAddDialogBtn"
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#800000] hover:bg-[#a10000] text-white"
                      >
                        Add User
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* User List */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-sm text-gray-500">
                  User Accounts
                </CardTitle>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <p className="text-gray-500 text-sm">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-gray-500 text-sm">No users found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 text-left">
                          <th className="p-3 font-medium">#</th>
                          <th className="p-3 font-medium">User ID</th>
                          <th className="p-3 font-medium">Name</th>
                          <th className="p-3 font-medium">Email</th>
                          <th className="p-3 font-medium">Role</th>
                          <th className="p-3 font-medium text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user, i) => (
                          <tr
                            key={user.userId}
                            className="border-b hover:bg-gray-50 transition"
                          >
                            <td className="p-3">{i + 1}</td>
                            <td className="p-3 text-gray-500">{user.userId}</td>
                            <td className="p-3 font-medium">
                              {user.firstname} {user.lastname}
                            </td>
                            <td className="p-3">{user.email}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  user.role === "IT"
                                    ? "bg-red-100 text-red-700"
                                    : user.role === "Accounts"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setEditUser({ ...user, password: "" })
                                    }
                                  >
                                    <Pencil size={14} className="mr-1" /> Edit
                                  </Button>
                                </DialogTrigger>

                                {/* Edit Dialog */}
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Edit User</DialogTitle>
                                  </DialogHeader>

                                  <form
                                    onSubmit={handleEditUser}
                                    className="space-y-4 mt-2"
                                  >
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <Label>First Name</Label>
                                        <Input
                                          type="text"
                                          value={editUser?.firstname || ""}
                                          onChange={(e) =>
                                            setEditUser({
                                              ...editUser,
                                              firstname: e.target.value,
                                            })
                                          }
                                          required
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label>Last Name</Label>
                                        <Input
                                          type="text"
                                          value={editUser?.lastname || ""}
                                          onChange={(e) =>
                                            setEditUser({
                                              ...editUser,
                                              lastname: e.target.value,
                                            })
                                          }
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <Label>Email</Label>
                                      <Input
                                        type="email"
                                        value={editUser?.email || ""}
                                        onChange={(e) =>
                                          setEditUser({
                                            ...editUser,
                                            email: e.target.value,
                                          })
                                        }
                                        required
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <Label>New Password (optional)</Label>
                                      <Input
                                        type="password"
                                        placeholder="Leave blank to keep current password"
                                        value={editUser?.password || ""}
                                        onChange={(e) =>
                                          setEditUser({
                                            ...editUser,
                                            password: e.target.value,
                                          })
                                        }
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <Label>Role</Label>
                                      <Select
                                        value={editUser?.role || ""}
                                        onValueChange={(value) =>
                                          setEditUser({
                                            ...editUser,
                                            role: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="IT">IT</SelectItem>
                                          <SelectItem value="Accounts">
                                            Accounts
                                          </SelectItem>
                                          <SelectItem value="InventoryStaff">
                                            Inventory Staff
                                          </SelectItem>
                                          <SelectItem value="InventoryAdmin">
                                            Inventory Admin
                                          </SelectItem>
                                          <SelectItem value="Security">
                                            Security
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button
                                        type="button"
                                        id="closeEditDialogBtn"
                                        className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        type="submit"
                                        className="bg-[#800000] hover:bg-[#a10000] text-white"
                                      >
                                        Save Changes
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>
    </>
  );
}
