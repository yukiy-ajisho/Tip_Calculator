"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AddRoleModal } from "@/components/AddRoleModal";
import { AddExistingRoleModal } from "@/components/AddExistingRoleModal";
import { InviteCodeModal } from "@/components/InviteCodeModal";
import { TimeInput } from "@/components/TimeInput";
import { api } from "@/lib/api";
import { Store, RoleMapping, RolePercentage, UserSettings } from "@/types";
import { useUserSettings } from "@/hooks/useUserSettings";
import { convert24To12 } from "@/lib/time-format";

export default function SettingsPage() {
  const { timeFormat } = useUserSettings();
  // Tab state
  const [activeTab, setActiveTab] = useState<
    "role" | "percentage" | "store" | "user"
  >("role");

  // User Settings state
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoadingUserSettings, setIsLoadingUserSettings] = useState(false);
  const [userSettingsError, setUserSettingsError] = useState<string | null>(
    null
  );
  const [isSavingUserSettings, setIsSavingUserSettings] = useState(false);

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

  // Store Settings state
  const [isStoreSettingsEditMode, setIsStoreSettingsEditMode] = useState(false);
  const [editedStoreSettings, setEditedStoreSettings] = useState<
    Map<
      string,
      {
        beforeHours: number | null;
        afterHours: number | null;
        startTimeAdjustment: number | null;
      }
    >
  >(new Map());
  const [storeSettingsInputs, setStoreSettingsInputs] = useState<
    Map<
      string,
      { beforeHours: string; afterHours: string; startTimeAdjustment: string }
    >
  >(new Map());
  const [storeSettingsError, setStoreSettingsError] = useState<string | null>(
    null
  );

  // Fetch stores and user settings on mount
  useEffect(() => {
    fetchStores();
    fetchUserSettings();
  }, []);

  // Fetch user settings when User Settings tab is active
  useEffect(() => {
    if (activeTab === "user") {
      fetchUserSettings();
    }
  }, [activeTab]);

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

  const fetchUserSettings = async () => {
    setIsLoadingUserSettings(true);
    setUserSettingsError(null);
    try {
      const data = await api.userSettings.getUserSettings();
      setUserSettings(data);
    } catch (error: any) {
      console.error("Failed to fetch user settings:", error);
      setUserSettingsError(error.message || "Failed to fetch user settings.");
    } finally {
      setIsLoadingUserSettings(false);
    }
  };

  const handleTimeFormatChange = async (timeFormat: "24h" | "12h") => {
    setIsSavingUserSettings(true);
    setUserSettingsError(null);
    try {
      const updatedSettings = await api.userSettings.updateUserSettings({
        timeFormat,
        showArchivedRecords: userSettings?.show_archived_records ?? false,
      });
      setUserSettings(updatedSettings);
    } catch (error: any) {
      console.error("Failed to update user settings:", error);
      setUserSettingsError(error.message || "Failed to update user settings.");
    } finally {
      setIsSavingUserSettings(false);
    }
  };

  const handleArchiveDisplayChange = async (showArchived: boolean) => {
    setIsSavingUserSettings(true);
    setUserSettingsError(null);
    try {
      const updatedSettings = await api.userSettings.updateUserSettings({
        timeFormat: userSettings?.time_format || "24h",
        showArchivedRecords: showArchived,
      });
      setUserSettings(updatedSettings);
    } catch (error: any) {
      console.error("Failed to update user settings:", error);
      setUserSettingsError(error.message || "Failed to update user settings.");
    } finally {
      setIsSavingUserSettings(false);
    }
  };

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

  // Helper functions for time format conversion (minutes <-> HH:MM)
  const minutesToTimeString = (minutes: number | null): string => {
    if (minutes === null || minutes === undefined) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const timeStringToMinutes = (timeString: string): number | null => {
    if (!timeString || timeString.trim() === "") return null;

    // Support both HH:MM and integer format (for backward compatibility)
    if (/^\d+$/.test(timeString)) {
      // Integer format (hours)
      const hours = parseInt(timeString, 10);
      if (isNaN(hours) || hours < 0 || hours > 24) return null;
      return hours * 60; // Convert hours to minutes
    }

    // HH:MM format
    const timePattern = /^(\d{1,2}):(\d{2})$/;
    const match = timeString.match(timePattern);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);

    if (
      isNaN(hours) ||
      isNaN(mins) ||
      hours < 0 ||
      hours > 24 ||
      mins < 0 ||
      mins >= 60
    ) {
      return null;
    }

    const totalMinutes = hours * 60 + mins;
    if (totalMinutes > 24 * 60) return null; // Max 24 hours

    return totalMinutes;
  };

  const validateTimeString = (timeString: string): boolean => {
    if (timeString === "") return true; // Empty is valid

    // Support both HH:MM and integer format
    if (/^\d+$/.test(timeString)) {
      const hours = parseInt(timeString, 10);
      return !isNaN(hours) && hours >= 0 && hours <= 24;
    }

    // HH:MM format
    const timePattern = /^(\d{1,2}):(\d{2})$/;
    const match = timeString.match(timePattern);
    if (!match) return false;

    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);

    if (isNaN(hours) || isNaN(mins)) return false;
    if (hours < 0 || hours > 24) return false;
    if (mins < 0 || mins >= 60) return false;

    const totalMinutes = hours * 60 + mins;
    return totalMinutes <= 24 * 60;
  };

  // Store Settings handlers
  const handleStoreSettingsEditModeToggle = () => {
    if (isStoreSettingsEditMode) {
      // Cancel edit mode
      setIsStoreSettingsEditMode(false);
      setEditedStoreSettings(new Map());
      setStoreSettingsInputs(new Map());
      setStoreSettingsError(null);
    } else {
      // Enter edit mode
      setIsStoreSettingsEditMode(true);
      const newEditedSettings = new Map<
        string,
        {
          beforeHours: number | null;
          afterHours: number | null;
          startTimeAdjustment: number | null;
        }
      >();
      const newInputs = new Map<
        string,
        { beforeHours: string; afterHours: string; startTimeAdjustment: string }
      >();
      stores.forEach((store) => {
        const beforeMinutes = store.off_hours_adjustment_before_hours ?? null;
        const afterMinutes = store.off_hours_adjustment_after_hours ?? null;
        const startTimeAdjustmentMinutes =
          store.start_time_adjustment_minutes ?? null;
        newEditedSettings.set(store.id, {
          beforeHours: beforeMinutes,
          afterHours: afterMinutes,
          startTimeAdjustment: startTimeAdjustmentMinutes,
        });
        newInputs.set(store.id, {
          beforeHours: minutesToTimeString(beforeMinutes),
          afterHours: minutesToTimeString(afterMinutes),
          startTimeAdjustment:
            startTimeAdjustmentMinutes === null
              ? ""
              : String(startTimeAdjustmentMinutes),
        });
      });
      setEditedStoreSettings(newEditedSettings);
      setStoreSettingsInputs(newInputs);
    }
  };

  const handleStoreSettingsFieldChange = (
    storeId: string,
    field: "beforeHours" | "afterHours" | "startTimeAdjustment",
    value: string
  ) => {
    if (field === "startTimeAdjustment") {
      // For startTimeAdjustment, only allow digits
      const numericPattern = /^\d*$/;
      if (numericPattern.test(value)) {
        setStoreSettingsInputs((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(storeId) || {
            beforeHours: "",
            afterHours: "",
            startTimeAdjustment: "",
          };
          newMap.set(storeId, { ...current, [field]: value });
          return newMap;
        });
      }
    } else {
      // Allow HH:MM format or integer format (for backward compatibility)
      // Pattern: empty string, digits only, or HH:MM format
      const timePattern = /^(\d*:?\d*)$/;
      if (timePattern.test(value)) {
        setStoreSettingsInputs((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(storeId) || {
            beforeHours: "",
            afterHours: "",
            startTimeAdjustment: "",
          };
          newMap.set(storeId, { ...current, [field]: value });
          return newMap;
        });
      }
    }
  };

  const handleStoreSettingsFieldBlur = (
    storeId: string,
    field: "beforeHours" | "afterHours" | "startTimeAdjustment"
  ) => {
    const inputValue = storeSettingsInputs.get(storeId)?.[field] || "";

    if (field === "startTimeAdjustment") {
      // For startTimeAdjustment, validate as integer (minutes)
      const numericValue = inputValue === "" ? null : parseInt(inputValue, 10);
      if (inputValue !== "" && (isNaN(numericValue!) || numericValue! < 0)) {
        setStoreSettingsError(
          "Start Time Adjustment must be a non-negative integer (minutes)"
        );
        return;
      }

      setStoreSettingsError(null);

      // Update edited settings
      setEditedStoreSettings((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(storeId) || {
          beforeHours: null,
          afterHours: null,
          startTimeAdjustment: null,
        };
        newMap.set(storeId, { ...current, [field]: numericValue });
        return newMap;
      });

      // Update input state
      setStoreSettingsInputs((prev) => {
        const newMap = new Map(prev);
        newMap.set(storeId, {
          ...(prev.get(storeId) || {
            beforeHours: "",
            afterHours: "",
            startTimeAdjustment: "",
          }),
          [field]: inputValue,
        });
        return newMap;
      });
    } else {
      // Validate time string format
      if (!validateTimeString(inputValue)) {
        setStoreSettingsError(
          `${
            field === "beforeHours" ? "Before Hours" : "After Hours"
          } must be in HH:MM format (0:00 to 24:00) or integer (0-24)`
        );
        return;
      }

      // Convert time string to minutes
      const minutesValue = timeStringToMinutes(inputValue);

      // Additional validation: 0-1440 minutes (0-24 hours)
      if (
        minutesValue !== null &&
        (minutesValue < 0 || minutesValue > 24 * 60)
      ) {
        setStoreSettingsError(
          `${
            field === "beforeHours" ? "Before Hours" : "After Hours"
          } must be between 0:00 and 24:00`
        );
        return;
      }

      setStoreSettingsError(null);

      // Update edited settings (store as minutes)
      setEditedStoreSettings((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(storeId) || {
          beforeHours: null,
          afterHours: null,
          startTimeAdjustment: null,
        };
        newMap.set(storeId, { ...current, [field]: minutesValue });
        return newMap;
      });

      // Update input state to show formatted value (or keep empty if null)
      setStoreSettingsInputs((prev) => {
        const newMap = new Map(prev);
        newMap.set(storeId, {
          ...(prev.get(storeId) || {
            beforeHours: "",
            afterHours: "",
            startTimeAdjustment: "",
          }),
          [field]: minutesToTimeString(minutesValue),
        });
        return newMap;
      });
    }
  };

  const handleStoreSettingsSave = async () => {
    setStoreSettingsError(null);
    try {
      // Save each store's settings
      for (const [storeId, settings] of editedStoreSettings.entries()) {
        await api.stores.updateStoreSettings(storeId, {
          off_hours_adjustment_before_hours: settings.beforeHours,
          off_hours_adjustment_after_hours: settings.afterHours,
          start_time_adjustment_minutes: settings.startTimeAdjustment,
        });
      }

      // Refresh stores data
      await fetchStores();
      setIsStoreSettingsEditMode(false);
      setEditedStoreSettings(new Map());
      setStoreSettingsInputs(new Map());
    } catch (error: any) {
      console.error("Failed to save store settings:", error);
      setStoreSettingsError(error.message || "Failed to save store settings.");
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
            <button
              onClick={() => setActiveTab("user")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "user"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              User Setting
              {activeTab === "user" && (
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Store Mapping
              </h3>
              <div className="flex items-center space-x-2">
                {isStoreSettingsEditMode ? (
                  <>
                    <button
                      onClick={handleStoreSettingsSave}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleStoreSettingsEditModeToggle}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStoreSettingsEditModeToggle}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {(storeError || storeSettingsError) && (
              <div className="text-red-600 text-sm mb-4">
                {storeError || storeSettingsError}
              </div>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Before Hours Adjustment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      After Hours Adjustment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Start Time Adjustment (minutes)
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
                        colSpan={7}
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        Loading stores...
                      </td>
                    </tr>
                  ) : stores.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        No stores found. Add one!
                      </td>
                    </tr>
                  ) : (
                    stores.map((store) => {
                      const editedSettings = editedStoreSettings.get(store.id);
                      const inputState = storeSettingsInputs.get(store.id);
                      const beforeMinutes =
                        editedSettings?.beforeHours ??
                        store.off_hours_adjustment_before_hours ??
                        null;
                      const afterMinutes =
                        editedSettings?.afterHours ??
                        store.off_hours_adjustment_after_hours ??
                        null;
                      const startTimeAdjustmentMinutes =
                        editedSettings?.startTimeAdjustment ??
                        store.start_time_adjustment_minutes ??
                        null;

                      return (
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                            {isStoreSettingsEditMode ? (
                              <TimeInput
                                timeFormat={timeFormat}
                                value={
                                  inputState?.beforeHours !== undefined
                                    ? inputState.beforeHours
                                    : beforeMinutes === null
                                    ? ""
                                    : minutesToTimeString(beforeMinutes)
                                }
                                onChange={(value) => {
                                  // Update input state immediately
                                  setStoreSettingsInputs((prev) => {
                                    const newMap = new Map(prev);
                                    const current = newMap.get(store.id) || {
                                      beforeHours: "",
                                      afterHours: "",
                                      startTimeAdjustment: "",
                                    };
                                    newMap.set(store.id, {
                                      ...current,
                                      beforeHours: value,
                                    });
                                    return newMap;
                                  });
                                  // Convert to minutes and update edited settings
                                  const minutesValue =
                                    timeStringToMinutes(value);
                                  setEditedStoreSettings((prev) => {
                                    const newMap = new Map(prev);
                                    const current = newMap.get(store.id) || {
                                      beforeHours: null,
                                      afterHours: null,
                                      startTimeAdjustment: null,
                                    };
                                    newMap.set(store.id, {
                                      ...current,
                                      beforeHours: minutesValue,
                                    });
                                    return newMap;
                                  });
                                }}
                                onBlur={() => {
                                  // Validate on blur
                                  const inputValue =
                                    storeSettingsInputs.get(store.id)
                                      ?.beforeHours || "";
                                  if (
                                    inputValue &&
                                    !validateTimeString(inputValue)
                                  ) {
                                    setStoreSettingsError(
                                      "Before Hours Adjustment must be in HH:MM format (0:00 to 24:00)"
                                    );
                                  } else {
                                    setStoreSettingsError(null);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-gray-900">
                                {beforeMinutes === null
                                  ? "-"
                                  : timeFormat === "12h"
                                  ? convert24To12(
                                      minutesToTimeString(beforeMinutes)
                                    )
                                  : minutesToTimeString(beforeMinutes)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                            {isStoreSettingsEditMode ? (
                              <TimeInput
                                timeFormat={timeFormat}
                                value={
                                  inputState?.afterHours !== undefined
                                    ? inputState.afterHours
                                    : afterMinutes === null
                                    ? ""
                                    : minutesToTimeString(afterMinutes)
                                }
                                onChange={(value) => {
                                  // Update input state immediately
                                  setStoreSettingsInputs((prev) => {
                                    const newMap = new Map(prev);
                                    const current = newMap.get(store.id) || {
                                      beforeHours: "",
                                      afterHours: "",
                                      startTimeAdjustment: "",
                                    };
                                    newMap.set(store.id, {
                                      ...current,
                                      afterHours: value,
                                    });
                                    return newMap;
                                  });
                                  // Convert to minutes and update edited settings
                                  const minutesValue =
                                    timeStringToMinutes(value);
                                  setEditedStoreSettings((prev) => {
                                    const newMap = new Map(prev);
                                    const current = newMap.get(store.id) || {
                                      beforeHours: null,
                                      afterHours: null,
                                      startTimeAdjustment: null,
                                    };
                                    newMap.set(store.id, {
                                      ...current,
                                      afterHours: minutesValue,
                                    });
                                    return newMap;
                                  });
                                }}
                                onBlur={() => {
                                  // Validate on blur
                                  const inputValue =
                                    storeSettingsInputs.get(store.id)
                                      ?.afterHours || "";
                                  if (
                                    inputValue &&
                                    !validateTimeString(inputValue)
                                  ) {
                                    setStoreSettingsError(
                                      "After Hours Adjustment must be in HH:MM format (0:00 to 24:00)"
                                    );
                                  } else {
                                    setStoreSettingsError(null);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-gray-900">
                                {afterMinutes === null
                                  ? "-"
                                  : timeFormat === "12h"
                                  ? convert24To12(
                                      minutesToTimeString(afterMinutes)
                                    )
                                  : minutesToTimeString(afterMinutes)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                            {isStoreSettingsEditMode ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={
                                  inputState?.startTimeAdjustment !== undefined
                                    ? inputState.startTimeAdjustment
                                    : startTimeAdjustmentMinutes === null
                                    ? ""
                                    : String(startTimeAdjustmentMinutes)
                                }
                                onChange={(e) =>
                                  handleStoreSettingsFieldChange(
                                    store.id,
                                    "startTimeAdjustment",
                                    e.target.value
                                  )
                                }
                                onBlur={() =>
                                  handleStoreSettingsFieldBlur(
                                    store.id,
                                    "startTimeAdjustment"
                                  )
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="minutes"
                              />
                            ) : (
                              <span className="text-gray-900">
                                {startTimeAdjustmentMinutes === null
                                  ? "-"
                                  : String(startTimeAdjustmentMinutes)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {store.role === "owner" && (
                              <button
                                onClick={() => handleGenerateInviteCode(store)}
                                disabled={isStoreSettingsEditMode}
                                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500"
                              >
                                Generate Code
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
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

        {/* User Settings Tab */}
        {activeTab === "user" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {isLoadingUserSettings ? (
              <div className="text-center py-8 text-gray-500">
                Loading user settings...
              </div>
            ) : userSettingsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{userSettingsError}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Time Format Setting */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Time Format
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500">
                      This setting applies to all time input fields in the
                      application.
                    </p>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="timeFormat"
                          value="24h"
                          checked={userSettings?.time_format === "24h"}
                          onChange={() => handleTimeFormatChange("24h")}
                          disabled={isSavingUserSettings}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          24-hour format (HH:MM)
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="timeFormat"
                          value="12h"
                          checked={userSettings?.time_format === "12h"}
                          onChange={() => handleTimeFormatChange("12h")}
                          disabled={isSavingUserSettings}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          12-hour format (HH:MM AM/PM)
                        </span>
                      </label>
                      {isSavingUserSettings && (
                        <span className="text-sm text-gray-500">Saving...</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Archive Display Setting */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Archive Display
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500">
                      Control whether archived records are displayed in the
                      Records page.
                    </p>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="archiveDisplay"
                          value="hide"
                          checked={
                            (userSettings?.show_archived_records ?? false) ===
                            false
                          }
                          onChange={() => handleArchiveDisplayChange(false)}
                          disabled={isSavingUserSettings}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          Hide Archive
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="archiveDisplay"
                          value="show"
                          checked={
                            (userSettings?.show_archived_records ?? false) ===
                            true
                          }
                          onChange={() => handleArchiveDisplayChange(true)}
                          disabled={isSavingUserSettings}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          Show Archive
                        </span>
                      </label>
                      {isSavingUserSettings && (
                        <span className="text-sm text-gray-500">Saving...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
        />
      </div>
    </div>
  );
}
