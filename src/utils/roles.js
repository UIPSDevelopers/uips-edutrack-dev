// src/utils/roles.js
export const canViewInventory = (role) =>
  ["IT", "InventoryStaff", "Accounts", "InventoryAdmin"].includes(role);

export const canEditInventory = (role) =>
  ["IT", "Accounts", "InventoryAdmin"].includes(role);

export const canDeleteInventory = (role) =>
  ["IT", "InventoryAdmin"].includes(role);

export const isITOnly = (role) => role === "IT";
