"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AddRoleModal } from "@/components/AddRoleModal";
import { AddExistingRoleModal } from "@/components/AddExistingRoleModal";
import { InviteCodeModal } from "@/components/InviteCodeModal";
import { api } from "@/lib/api";
import { Store, RoleMapping, RolePercentage } from "@/types";

export default function SettingsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"role" | "percentage" | "store">(
    "role"
  );

  // Store state
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  // Role Mapping state
  const [roleMappings, setRoleMappings] = useState<RoleMapping[]>([]);
  const [isRoleEditMode, setIsRoleEditMode] = useState(false);
  const [editedRoleMappings, setEditedRoleMappings] = useState<RoleMapping[]>(
    []
  );
  const [deletedRoleMappingIds, setDeletedRoleMappingIds] = useState<string[]>(
    []
  );
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Add Role Modal state
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleStandardGroup, setNewRoleStandardGroup] = useState("");
  const [newRoleActualName, setNewRoleActualName] = useState("");
  const [addTrainee, setAddTrainee] = useState(false);
  const [newTraineeRoleName, setNewTraineeRoleName] = useState("");
  const [newTraineePercentage, setNewTraineePercentage] = useState("");

  // Tip Pool state
  const [tipPoolData, setTipPoolData] = useState<RolePercentage[]>([]);
  const [isTipPoolEditMode, setIsTipPoolEditMode] = useState(false);
  const [editedTipPoolData, setEditedTipPoolData] = useState<RolePercentage[]>(
    []
  );
  const [isLoadingTipPool, setIsLoadingTipPool] = useState(false);
  const [tipPoolError, setTipPoolError] = useState<string | null>(null);

  // Add Distribution Modal state
  const [isAddDistributionModalOpen, setIsAddDistributionModalOpen] =
    useState(false);
  const [selectedDistributionRole, setSelectedDistributionRole] = useState("");

  // Invite Code Modal state
  const [isInviteCodeModalOpen, setIsInviteCodeModalOpen] = useState(false);
  const [generatedInviteCode, setGeneratedInviteCode] = useState("");
  const [inviteCodeExpiresAt, setInviteCodeExpiresAt] = useState("");
  const [selectedStoreForInvite, setSelectedStoreForInvite] =
    useState<Store | null>(null);

  // String input state for numeric fields (food_costing pattern)
  const [traineePercentageInputs, setTraineePercentageInputs] = useState<
    Map<string, string>
  >(new Map());
  const [tipPoolPercentageInputs, setTipPoolPercentageInputs] = useState<
    Map<string, string>
  >(new Map());

  // Fetch stores on mount
  useEffect(() => {
    fetchStores();
  }, []);

  // Fetch role mappings when store is selected
  useEffect(() => {
    if (
      selectedStoreId &&
      (activeTab === "role" || activeTab === "percentage")
    ) {
      if (activeTab === "role") {
        fetchRoleMappings();
      } else {
        fetchTipPool();
      }
    }
  }, [selectedStoreId, activeTab]);

  const fetchStores = async () => {
    setIsLoadingStores(true);
    setStoreError(null);
    try {
      const data = await api.stores.getStores();
      setStores(data);
      if (data.length > 0 && !selectedStoreId) {
        setSelectedStoreId(data[0].id);
      }
    } catch (error: any) {
      console.error("Failed to fetch stores:", error);
      setStoreError(error.message || "Failed to load stores.");
    } finally {
      setIsLoadingStores(false);
    }
  };

  const fetchRoleMappings = async () => {
    if (!selectedStoreId) return;
    setIsLoadingRoles(true);
    setRoleError(null);
    try {
      const data = await api.roleMappings.getRoleMappings(selectedStoreId);
      setRoleMappings(data);
    } catch (error: any) {
      console.error("Failed to fetch role mappings:", error);
      setRoleError(error.message || "Failed to load role mappings.");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const fetchTipPool = async () => {
    if (!selectedStoreId) return;
    setIsLoadingTipPool(true);
    setTipPoolError(null);
    try {
      const data = await api.tipPool.getTipPool(selectedStoreId);
      setTipPoolData(data);
    } catch (error: any) {
      console.error("Failed to fetch tip pool:", error);
      setTipPoolError(error.message || "Failed to load tip pool.");
    } finally {
      setIsLoadingTipPool(false);
    }
  };

  // Role Mapping handlers
  const handleRoleEditModeToggle = () => {
    if (isRoleEditMode) {
      // Cancel edit mode
      setIsRoleEditMode(false);
      setEditedRoleMappings([]);
      setDeletedRoleMappingIds([]);
      setRoleError(null);
      // Clear input state
      setTraineePercentageInputs(new Map());
    } else {
      // Enter edit mode
      setIsRoleEditMode(true);
      setEditedRoleMappings(JSON.parse(JSON.stringify(roleMappings)));
      setDeletedRoleMappingIds([]);
    }
  };

  const handleRoleFieldChange = (
    index: number,
    field: keyof RoleMapping,
    value: any
  ) => {
    const updated = [...editedRoleMappings];
    updated[index] = { ...updated[index], [field]: value };

    // If trainee_role_name is cleared, set trainee_percentage to 0
    if (field === "trainee_role_name" && !value) {
      updated[index].trainee_percentage = 0;
    }

    setEditedRoleMappings(updated);
  };

  const handleRoleDelete = async (roleMapping: RoleMapping) => {
    // Check if role is used in tip pool
    try {
      const tipPoolData = await api.tipPool.getTipPool(selectedStoreId);
      const isUsed = tipPoolData.some(
        (rp) => rp.role_mapping_id === roleMapping.id
      );

      if (isUsed) {
        setRoleError(
          "Cannot delete. This role is used in Tip Pool Distribution."
        );
        return;
      }

      const hasData =
        roleMapping.actual_role_name || roleMapping.trainee_role_name;
      if (
        hasData &&
        !confirm(
          `Actual Role Name (${
            roleMapping.actual_role_name || "N/A"
          }) and Trainee data will also be deleted. Continue?`
        )
      ) {
        return;
      }

      if (roleMapping.id && !roleMapping.id.startsWith("temp-")) {
        setDeletedRoleMappingIds([...deletedRoleMappingIds, roleMapping.id]);
        await api.roleMappings.deleteRoleMapping(roleMapping.id);
      }

      const updated = editedRoleMappings.filter((_, i) => {
        const currentRoleMapping = editedRoleMappings[i];
        return currentRoleMapping.id !== roleMapping.id;
      });
      setEditedRoleMappings(updated);
      await fetchRoleMappings();
    } catch (error: any) {
      console.error("Failed to delete role:", error);
      setRoleError(error.message || "Failed to delete role.");
    }
  };

  const handleRoleAdd = () => {
    setNewRoleStandardGroup("");
    setNewRoleActualName("");
    setAddTrainee(false);
    setNewTraineeRoleName("");
    setNewTraineePercentage("");
    setIsAddRoleModalOpen(true);
  };

  const handleRoleModalSave = async () => {
    setRoleError(null);
    try {
      if (!newRoleStandardGroup) {
        setRoleError("Standard Role Group is required.");
        return;
      }

      // Validate trainee: percentage without name is not allowed
      if (newTraineePercentage && !newTraineeRoleName) {
        setRoleError(
          "Trainee Actual Role Name is required when percentage is specified."
        );
        return;
      }

      await api.roleMappings.addRoleMapping({
        storeId: selectedStoreId,
        roleName: newRoleStandardGroup,
        actualRoleName: newRoleActualName || undefined,
        traineeRoleName: newTraineeRoleName || undefined,
        traineePercentage: newTraineePercentage
          ? parseInt(newTraineePercentage)
          : undefined,
      });

      await fetchRoleMappings();
      setIsAddRoleModalOpen(false);
      setNewRoleStandardGroup("");
      setNewRoleActualName("");
      setAddTrainee(false);
      setNewTraineeRoleName("");
      setNewTraineePercentage("");
    } catch (error: any) {
      console.error("Failed to add role:", error);
      setRoleError(error.message || "Failed to add role.");
    }
  };

  const handleRoleSave = async () => {
    setRoleError(null);
    try {
      // Validate
      for (const role of editedRoleMappings) {
        if (!role.role_name) {
          setRoleError("Standard Role Group is required for all roles.");
          return;
        }
      }

      // Save updates
      for (const role of editedRoleMappings) {
        if (role.id.startsWith("temp-")) {
          // New role
          await api.roleMappings.addRoleMapping({
            storeId: selectedStoreId,
            roleName: role.role_name,
            actualRoleName: role.actual_role_name || undefined,
            traineeRoleName: role.trainee_role_name || undefined,
            traineePercentage: role.trainee_percentage || undefined,
          });
        } else {
          // Existing role
          await api.roleMappings.updateRoleMapping(role.id, {
            roleName: role.role_name,
            actualRoleName: role.actual_role_name || undefined,
            traineeRoleName: role.trainee_role_name || undefined,
            traineePercentage: role.trainee_percentage || undefined,
          });
        }
      }

      await fetchRoleMappings();
      setIsRoleEditMode(false);
      setEditedRoleMappings([]);
      setDeletedRoleMappingIds([]);
      // Clear input state
      setTraineePercentageInputs(new Map());
    } catch (error: any) {
      console.error("Failed to save roles:", error);
      setRoleError(error.message || "Failed to save roles.");
    }
  };

  // Tip Pool handlers
  const handleTipPoolEditModeToggle = () => {
    if (isTipPoolEditMode) {
      // Cancel edit mode
      setIsTipPoolEditMode(false);
      setEditedTipPoolData([]);
      setTipPoolError(null);
      // Clear input state
      setTipPoolPercentageInputs(new Map());
    } else {
      // Enter edit mode
      setIsTipPoolEditMode(true);
      setEditedTipPoolData(JSON.parse(JSON.stringify(tipPoolData)));
    }
  };

  const handleTipPoolPercentageChange = (
    roleMappingId: string,
    distributionGrouping: number,
    value: number
  ) => {
    const updated = [...editedTipPoolData];
    const index = updated.findIndex(
      (rp) =>
        rp.role_mapping_id === roleMappingId &&
        rp.distribution_grouping === distributionGrouping
    );
    if (index !== -1) {
      updated[index] = { ...updated[index], percentage: value };
      setEditedTipPoolData(updated);
    }
  };

  const handleTipPoolRoleRemove = async (roleMappingId: string) => {
    try {
      await api.tipPool.removeRole(selectedStoreId, roleMappingId);
      await fetchTipPool();
      setIsTipPoolEditMode(false);
      setEditedTipPoolData([]);
      // Clear input state
      setTipPoolPercentageInputs(new Map());
    } catch (error: any) {
      console.error("Failed to remove role from tip pool:", error);
      setTipPoolError(error.message || "Failed to remove role.");
    }
  };

  const handleTipPoolAddRole = async () => {
    setTipPoolError(null);
    try {
      const allRoles = await api.roleMappings.getRoleMappings(selectedStoreId);
      const rolesInPool = new Set(tipPoolData.map((rp) => rp.role_mapping_id));
      const availableRoles = allRoles.filter(
        (role) => !rolesInPool.has(role.id)
      );

      if (availableRoles.length === 0) {
        setTipPoolError("All roles are already in the tip pool.");
        return;
      }

      setSelectedDistributionRole("");
      setIsAddDistributionModalOpen(true);
    } catch (error: any) {
      console.error("Failed to load available roles:", error);
      setTipPoolError(error.message || "Failed to load roles.");
    }
  };

  const handleAddDistributionModalSave = async () => {
    setTipPoolError(null);
    try {
      if (!selectedDistributionRole) {
        setTipPoolError("Please select a role.");
        return;
      }

      await api.tipPool.addRole(selectedStoreId, selectedDistributionRole);
      await fetchTipPool();
      setIsAddDistributionModalOpen(false);
      setSelectedDistributionRole("");
    } catch (error: any) {
      console.error("Failed to add role to tip pool:", error);
      setTipPoolError(error.message || "Failed to add role.");
    }
  };

  const handleTipPoolSave = async () => {
    setTipPoolError(null);
    try {
      // Group by distribution_grouping
      const patternMap: {
        [key: number]: {
          role_mapping_id: string;
          percentage: number;
        }[];
      } = {};

      editedTipPoolData.forEach((rp) => {
        if (!patternMap[rp.distribution_grouping]) {
          patternMap[rp.distribution_grouping] = [];
        }
        patternMap[rp.distribution_grouping].push({
          role_mapping_id: rp.role_mapping_id,
          percentage: rp.percentage,
        });
      });

      // Validate
      for (const [grouping, percentages] of Object.entries(patternMap)) {
        const total = percentages.reduce((sum, p) => sum + p.percentage, 0);
        if (total !== 100) {
          setTipPoolError(
            `Total percentage must be 100% for pattern ${grouping} (current: ${total}%)`
          );
          return;
        }
      }

      // Check for duplicates
      const signatures = Object.values(patternMap).map((percentages) => {
        return percentages
          .map((p) => `${p.role_mapping_id}:${p.percentage}`)
          .sort()
          .join(",");
      });
      const uniqueSignatures = new Set(signatures);
      if (uniqueSignatures.size !== signatures.length) {
        setTipPoolError("Duplicate patterns are not allowed.");
        return;
      }

      // Save
      const patterns = Object.entries(patternMap).map(
        ([grouping, percentages]) => ({
          distribution_grouping: parseInt(grouping),
          percentages: percentages.map((p) => ({
            role_mapping_id: p.role_mapping_id,
            role_name: "", // Not needed for update
            percentage: p.percentage,
          })),
        })
      );

      await api.tipPool.updateTipPool(selectedStoreId, patterns);
      await fetchTipPool();
      setIsTipPoolEditMode(false);
      setEditedTipPoolData([]);
      // Clear input state
      setTipPoolPercentageInputs(new Map());
    } catch (error: any) {
      console.error("Failed to save tip pool:", error);
      setTipPoolError(error.message || "Failed to save tip pool.");
    }
  };

  // Store handlers
  const handleGenerateInviteCode = async (store: Store) => {
    try {
      const result = await api.stores.generateInviteCode(store.id);
      setGeneratedInviteCode(result.code);
      setInviteCodeExpiresAt(result.expiresAt);
      setSelectedStoreForInvite(store);
      setIsInviteCodeModalOpen(true);
    } catch (error: any) {
      console.error("Failed to generate invite code:", error);
      setStoreError(error.message || "Failed to generate invite code.");
    }
  };

  // Get unique role mappings in tip pool
  const getRolesInTipPool = () => {
    const roleMap = new Map<
      string,
      { role: RoleMapping; data: RolePercentage[] }
    >();

    (isTipPoolEditMode ? editedTipPoolData : tipPoolData).forEach((rp: any) => {
      const roleMapping = rp.role_mappings || rp;
      if (!roleMap.has(rp.role_mapping_id)) {
        roleMap.set(rp.role_mapping_id, {
          role: roleMapping,
          data: [],
        });
      }
      roleMap.get(rp.role_mapping_id)!.data.push(rp);
    });

    return Array.from(roleMap.values());
  };

  // Get unique distribution groupings
  const getDistributionGroups = () => {
    const data = isTipPoolEditMode ? editedTipPoolData : tipPoolData;
    const groupings = new Set(data.map((rp) => rp.distribution_grouping));
    return Array.from(groupings).sort((a, b) => a - b);
  };

  // Check if a specific cell is editable
  const isCellEditable = (grouping: number, roleMappingId: string): boolean => {
    if (!isTipPoolEditMode) return false;

    // Use the original tipPoolData (not edited) to determine editability
    // This prevents cells from becoming non-editable during editing
    const originalData = tipPoolData;
    const groupData = originalData.filter(
      (rp: any) => rp.distribution_grouping === grouping
    );

    // Check if pattern has any manual input (0 < percentage < 100)
    const hasManualInput = groupData.some(
      (rp: any) => rp.percentage > 0 && rp.percentage < 100
    );

    if (!hasManualInput) {
      // All cells are 0 or 100 only -> all cells are not editable (auto-determined)
      return false;
    }

    // Pattern has manual input -> check this specific cell's original value
    const originalCell = groupData.find(
      (rp: any) => rp.role_mapping_id === roleMappingId
    );

    if (!originalCell || originalCell.percentage === 0) {
      // This cell was originally 0% -> not editable (fixed)
      return false;
    }

    // This cell was originally > 0 -> editable
    return true;
  };

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tabs with Store Dropdown */}
        <div className="flex justify-between items-center border-b border-gray-200 mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("role")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "role"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Role Setting
              {activeTab === "role" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("percentage")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "percentage"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Tip Pool Distribution
              {activeTab === "percentage" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("store")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "store"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Store Setting
              {activeTab === "store" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>

          {/* Store Dropdown (Role and Tip Pool tabs only) */}
          {(activeTab === "role" || activeTab === "percentage") && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Select Store:
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                disabled={isLoadingStores}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingStores
                    ? "Loading stores..."
                    : "-- Choose a store --"}
                </option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Role Setting Tab */}
        {activeTab === "role" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Role Mapping
              </h3>
              <div className="flex items-center space-x-2">
                {isRoleEditMode ? (
                  <>
                    <button
                      onClick={handleRoleSave}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleRoleEditModeToggle}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleRoleAdd}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Add Role
                    </button>
                    <button
                      onClick={handleRoleEditModeToggle}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {roleError && (
              <div className="text-red-600 text-sm mb-4">{roleError}</div>
            )}

            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Standard Role Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Actual Role Name (From CSV)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Trainee Actual Role Name (From CSV)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      %
                    </th>
                    {isRoleEditMode && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingRoles ? (
                    <tr>
                      <td
                        colSpan={isRoleEditMode ? 5 : 4}
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : (isRoleEditMode ? editedRoleMappings : roleMappings)
                      .length === 0 ? (
                    <tr>
                      <td
                        colSpan={isRoleEditMode ? 5 : 4}
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        No roles found. Add one!
                      </td>
                    </tr>
                  ) : (
                    (isRoleEditMode ? editedRoleMappings : roleMappings).map(
                      (role, index) => (
                        <tr key={role.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                            {isRoleEditMode ? (
                              <input
                                type="text"
                                value={role.role_name}
                                onChange={(e) =>
                                  handleRoleFieldChange(
                                    index,
                                    "role_name",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              role.role_name
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                            {isRoleEditMode ? (
                              <input
                                type="text"
                                value={role.actual_role_name || ""}
                                onChange={(e) =>
                                  handleRoleFieldChange(
                                    index,
                                    "actual_role_name",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., FOH"
                              />
                            ) : (
                              role.actual_role_name || "-"
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                            {isRoleEditMode ? (
                              <input
                                type="text"
                                value={role.trainee_role_name || ""}
                                onChange={(e) =>
                                  handleRoleFieldChange(
                                    index,
                                    "trainee_role_name",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., F_TRAINEE"
                              />
                            ) : (
                              role.trainee_role_name || "-"
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {isRoleEditMode ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={
                                  traineePercentageInputs.has(role.id)
                                    ? traineePercentageInputs.get(role.id) || ""
                                    : role.trainee_percentage === 0 ||
                                      role.trainee_percentage === null
                                    ? ""
                                    : String(role.trainee_percentage)
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // 数字のみを許可（空文字列も許可）
                                  const numericPattern = /^\d*$/;
                                  if (numericPattern.test(value)) {
                                    setTraineePercentageInputs((prev) => {
                                      const newMap = new Map(prev);
                                      newMap.set(role.id, value);
                                      return newMap;
                                    });
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  // フォーカスアウト時に数値に変換
                                  const numValue =
                                    value === "" ? 0 : parseInt(value, 10) || 0;
                                  handleRoleFieldChange(
                                    index,
                                    "trainee_percentage",
                                    numValue
                                  );
                                  // 入力状態をクリア（次回表示時は実際の値から取得）
                                  setTraineePercentageInputs((prev) => {
                                    const newMap = new Map(prev);
                                    newMap.delete(role.id);
                                    return newMap;
                                  });
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              role.trainee_percentage || 0
                            )}
                          </td>
                          {isRoleEditMode && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleRoleDelete(role)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tip Pool Distribution Tab */}
        {activeTab === "percentage" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Tip Pool Distribution
              </h3>
              <div className="flex space-x-2">
                {isTipPoolEditMode ? (
                  <>
                    <button
                      onClick={handleTipPoolSave}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleTipPoolEditModeToggle}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleTipPoolAddRole}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Add Distribution
                    </button>
                    <button
                      onClick={handleTipPoolEditModeToggle}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {tipPoolError && (
              <div className="text-red-600 text-sm mb-4">{tipPoolError}</div>
            )}

            {isLoadingTipPool ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : getRolesInTipPool().length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No roles in tip pool. Add a role to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {getRolesInTipPool().map(({ role }) => (
                        <th
                          key={role.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <span>{role.role_name}</span>
                            {isTipPoolEditMode && (
                              <button
                                onClick={() => handleTipPoolRoleRemove(role.id)}
                                className="ml-2 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getDistributionGroups().map((grouping) => (
                      <tr key={grouping}>
                        {getRolesInTipPool().map(({ role }) => {
                          const data = isTipPoolEditMode
                            ? editedTipPoolData
                            : tipPoolData;
                          const rp = data.find(
                            (item) =>
                              item.role_mapping_id === role.id &&
                              item.distribution_grouping === grouping
                          );
                          const percentage = rp ? rp.percentage : 0;
                          const editable = isCellEditable(grouping, role.id);

                          return (
                            <td
                              key={`${grouping}-${role.id}`}
                              className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200"
                            >
                              {editable ? (
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={
                                    tipPoolPercentageInputs.has(
                                      `${grouping}-${role.id}`
                                    )
                                      ? tipPoolPercentageInputs.get(
                                          `${grouping}-${role.id}`
                                        ) || ""
                                      : percentage === 0
                                      ? ""
                                      : String(percentage)
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // 数字のみを許可（空文字列も許可）
                                    const numericPattern = /^\d*$/;
                                    if (numericPattern.test(value)) {
                                      setTipPoolPercentageInputs((prev) => {
                                        const newMap = new Map(prev);
                                        newMap.set(
                                          `${grouping}-${role.id}`,
                                          value
                                        );
                                        return newMap;
                                      });
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const value = e.target.value;
                                    // フォーカスアウト時に数値に変換
                                    const numValue =
                                      value === ""
                                        ? 0
                                        : parseInt(value, 10) || 0;
                                    handleTipPoolPercentageChange(
                                      role.id,
                                      grouping,
                                      numValue
                                    );
                                    // 入力状態をクリア（次回表示時は実際の値から取得）
                                    setTipPoolPercentageInputs((prev) => {
                                      const newMap = new Map(prev);
                                      newMap.delete(`${grouping}-${role.id}`);
                                      return newMap;
                                    });
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded block text-center">
                                  {percentage}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Store Setting Tab */}
        {activeTab === "store" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Store Mapping
            </h3>

            {storeError && (
              <div className="text-red-600 text-sm mb-4">{storeError}</div>
            )}

            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Store Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Store Abbreviation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingStores ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        Loading stores...
                      </td>
                    </tr>
                  ) : stores.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        No stores found. Add one!
                      </td>
                    </tr>
                  ) : (
                    stores.map((store) => (
                      <tr key={store.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {store.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {store.abbreviation}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {store.role}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {store.role === "owner" && (
                            <button
                              onClick={() => handleGenerateInviteCode(store)}
                              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs"
                            >
                              Generate Code
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() =>
                alert("Add Store functionality not implemented yet")
              }
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Store
            </button>
          </div>
        )}

        {/* Add Role Modal */}
        <AddRoleModal
          isOpen={isAddRoleModalOpen}
          onClose={() => setIsAddRoleModalOpen(false)}
          standardRoleGroup={newRoleStandardGroup}
          actualRoleName={newRoleActualName}
          onStandardRoleGroupChange={setNewRoleStandardGroup}
          onActualRoleNameChange={setNewRoleActualName}
          addTrainee={addTrainee}
          onAddTraineeChange={setAddTrainee}
          traineeActualRoleName={newTraineeRoleName}
          onTraineeActualRoleNameChange={setNewTraineeRoleName}
          traineePercentage={newTraineePercentage}
          onTraineePercentageChange={setNewTraineePercentage}
          onSave={handleRoleModalSave}
        />

        {/* Add Distribution Modal */}
        <AddExistingRoleModal
          isOpen={isAddDistributionModalOpen}
          onClose={() => setIsAddDistributionModalOpen(false)}
          selectedRole={selectedDistributionRole}
          onSelectedRoleChange={setSelectedDistributionRole}
          availableRoles={roleMappings
            .filter(
              (role) =>
                !tipPoolData.some((rp) => rp.role_mapping_id === role.id)
            )
            .map((role) => ({ id: role.id, name: role.role_name }))}
          onSave={handleAddDistributionModalSave}
        />

        {/* Invite Code Modal */}
        <InviteCodeModal
          isOpen={isInviteCodeModalOpen}
          onClose={() => setIsInviteCodeModalOpen(false)}
          code={generatedInviteCode}
          expiresAt={inviteCodeExpiresAt}
          storeName={selectedStoreForInvite?.name || ""}
        />
      </div>
    </div>
  );
}
