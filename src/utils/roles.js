
export const canViewInventory = (role) =>
  ["IT", "InventoryStaff", "Accounts", "InventoryAdmin"].includes(role);

export const canEditInventory = (role) =>
  ["IT", "Accounts", "InventoryAdmin"].includes(role);

export const canDeleteInventory = (role) =>
  ["IT", "InventoryAdmin"].includes(role);

export const isITOnly = (role) => role === "IT";

// Property Tagging permissions
export const canViewPropertyTagging = (role) =>
  ["IT", "MaintenanceAdmin", "MaintenanceStaff"].includes(role);

export const canAddAsset = (role) =>
  ["IT", "MaintenanceAdmin"].includes(role);

export const canEditPropertyTagging = (role) =>
  ["IT", "MaintenanceAdmin"].includes(role);

export const canDeletePropertyTagging = (role) =>
  ["IT", "MaintenanceAdmin"].includes(role);

export const canManageCategories = (role) =>
  ["IT", "MaintenanceAdmin"].includes(role);

export const canManageLocations = (role) =>
  ["IT", "MaintenanceAdmin"].includes(role);

export const canAddService = (role) =>
  ["IT", "MaintenanceAdmin", "MaintenanceStaff"].includes(role);
