"use client";

import { useState, useEffect, useMemo } from "react";
import { AddRoleModal } from "@/components/AddRoleModal";
import { AddStoreModal } from "@/components/AddStoreModal";
import { AddTraineeModal } from "@/components/AddTraineeModal";
import { AddExistingRoleModal } from "@/components/AddExistingRoleModal";
import { api } from "@/lib/api"; // apiユーティリティをインポート
import { Store } from "@/types"; // Storeインターフェースをインポート

export default function SettingsPage() {
  // タブ切り替えの状態
  const [activeTab, setActiveTab] = useState<"role" | "percentage" | "store">(
    "role"
  );

  // モーダルの状態
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [standardRoleGroup, setStandardRoleGroup] = useState("");
  const [actualRoleName, setActualRoleName] = useState("");
  const [addTrainee, setAddTrainee] = useState(false);
  const [traineeActualRoleName, setTraineeActualRoleName] = useState("");
  const [traineePercentage, setTraineePercentage] = useState("");
  const [isTraineeModalOpen, setIsTraineeModalOpen] = useState(false);
  const [selectedRoleForTrainee, setSelectedRoleForTrainee] = useState("");
  const [traineeRoleActual, setTraineeRoleActual] = useState("");
  const [traineeRolePercentage, setTraineeRolePercentage] = useState("");
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeAbbreviation, setStoreAbbreviation] = useState("");
  const [isAddExistingRoleModalOpen, setIsAddExistingRoleModalOpen] =
    useState(false);
  const [selectedExistingRole, setSelectedExistingRole] = useState("");
  const [isRoleSettingEditMode, setIsRoleSettingEditMode] = useState(false);
  const [editedRoleMappings, setEditedRoleMappings] = useState<any>([]);

  // Store Setting関連のステート
  const [storeMappings, setStoreMappings] = useState<Store[]>([]); // Storeインターフェースを使用
  const [isLoadingStores, setIsLoadingStores] = useState(false); // ストア読み込み中
  const [storeError, setStoreError] = useState<string | null>(null); // ストア関連のエラーメッセージ
  const [isAddingStore, setIsAddingStore] = useState(false); // ストア追加中

  // モックデータ: Role Mapping（将来的にSupabaseから取得）
  const roleMappings = [
    {
      standardRoleGroup: "FRONT",
      actualRoleName: "FOH",
      traineeActualRoleName: "F_TRAINEE",
      traineePercentage: 50,
    },
    {
      standardRoleGroup: "BACK",
      actualRoleName: "BOH",
      traineeActualRoleName: "B_TRAINEE",
      traineePercentage: 75,
    },
    {
      standardRoleGroup: "FLOATER",
      actualRoleName: "FLOATER",
      traineeActualRoleName: "",
      traineePercentage: 0,
    },
  ];

  // ストアデータをAPIから取得する関数
  const fetchStores = async () => {
    setIsLoadingStores(true);
    setStoreError(null);
    try {
      const data = await api.stores.getStores();
      setStoreMappings(data);
    } catch (error: any) {
      console.error("Failed to fetch stores:", error);
      setStoreError(error.message || "Failed to load stores.");
    } finally {
      setIsLoadingStores(false);
    }
  };

  // コンポーネントマウント時、またはactiveTabが"store"になったときにストアデータを取得
  useEffect(() => {
    if (activeTab === "store") {
      fetchStores();
    }
  }, [activeTab]);

  // 新しいストアを追加するハンドラ
  const handleAddStore = async () => {
    if (!storeName || !storeAbbreviation) {
      setStoreError("Store name and abbreviation are required.");
      return;
    }
    setIsAddingStore(true);
    setStoreError(null);
    try {
      await api.stores.addStore(storeName, storeAbbreviation);
      await fetchStores(); // ストア追加後に一覧を再取得
      setIsStoreModalOpen(false);
      setStoreName("");
      setStoreAbbreviation("");
    } catch (error: any) {
      console.error("Failed to add store:", error);
      setStoreError(error.message || "Failed to add store.");
    } finally {
      setIsAddingStore(false);
    }
  };

  // パターン生成: 2^n - 1個のパターン（000を除外）
  const generatePatterns = (roleCount: number) => {
    const patterns: number[][] = [];
    const totalCombinations = Math.pow(2, roleCount);

    for (let i = 1; i < totalCombinations; i++) {
      const pattern: number[] = [];
      for (let j = roleCount - 1; j >= 0; j--) {
        pattern.push((i >> j) & 1);
      }
      patterns.push(pattern);
    }

    return patterns;
  };

  const patterns = useMemo(() => {
    const unsorted = generatePatterns(roleMappings.length);
    // Sort patterns by number of roles: single role first, then multi-role
    return unsorted.sort((a, b) => {
      const aCount = a.reduce((sum, val) => sum + val, 0);
      const bCount = b.reduce((sum, val) => sum + val, 0);
      return aCount - bCount;
    });
  }, [roleMappings.length]);

  // パーセンテージの状態管理（モック）
  // 構造: { roleIndex: { patternIndex: percentage } }
  const [percentages, setPercentages] = useState<
    Record<number, Record<number, string>>
  >(() => {
    const patternsForInit = generatePatterns(roleMappings.length);
    const initial: Record<number, Record<number, string>> = {};
    roleMappings.forEach((_, roleIndex) => {
      initial[roleIndex] = {};
      patternsForInit.forEach((_, patternIndex) => {
        initial[roleIndex][patternIndex] = "";
      });
    });
    return initial;
  });

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* タブボタン */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab("role")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "role"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Role Setting
          </button>
          <button
            onClick={() => setActiveTab("percentage")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "percentage"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tip Pool Distribution
          </button>
          <button
            onClick={() => setActiveTab("store")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "store"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Store Setting
          </button>
        </div>

        {/* Role タブのコンテンツ */}
        {activeTab === "role" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Role Mapping
              </h3>
              <button
                onClick={() => {
                  if (!isRoleSettingEditMode) {
                    setEditedRoleMappings(
                      JSON.parse(JSON.stringify(roleMappings))
                    );
                  }
                  setIsRoleSettingEditMode(!isRoleSettingEditMode);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title={isRoleSettingEditMode ? "Editing" : "Edit"}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Standard Role Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Actual Role Name (from CSV)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trainee Actual Role Name (from CSV)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(isRoleSettingEditMode
                    ? editedRoleMappings
                    : roleMappings
                  ).map((mapping, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {isRoleSettingEditMode ? (
                          <input
                            type="text"
                            value={mapping.standardRoleGroup}
                            onChange={(e) => {
                              const updated = [...editedRoleMappings];
                              updated[index].standardRoleGroup = e.target.value;
                              setEditedRoleMappings(updated);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          mapping.standardRoleGroup
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {isRoleSettingEditMode ? (
                          <input
                            type="text"
                            value={mapping.actualRoleName}
                            onChange={(e) => {
                              const updated = [...editedRoleMappings];
                              updated[index].actualRoleName = e.target.value;
                              setEditedRoleMappings(updated);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          mapping.actualRoleName
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {isRoleSettingEditMode ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={mapping.traineeActualRoleName}
                              onChange={(e) => {
                                const updated = [...editedRoleMappings];
                                updated[index].traineeActualRoleName =
                                  e.target.value;
                                setEditedRoleMappings(updated);
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-"
                            />
                            <input
                              type="number"
                              value={mapping.traineePercentage}
                              onChange={(e) => {
                                const updated = [...editedRoleMappings];
                                updated[index].traineePercentage =
                                  parseInt(e.target.value) || 0;
                                setEditedRoleMappings(updated);
                              }}
                              className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                              placeholder="%"
                            />
                            <span>%</span>
                          </div>
                        ) : (
                          <>
                            {mapping.traineeActualRoleName ? (
                              <div className="flex items-center gap-2">
                                <span>{mapping.traineeActualRoleName}</span>
                                <input
                                  type="number"
                                  value={mapping.traineePercentage}
                                  readOnly
                                  className="w-16 px-2 py-1 border border-gray-300 rounded bg-gray-50 text-center"
                                  placeholder="%"
                                />
                                <span>%</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setStandardRoleGroup("");
                  setActualRoleName("");
                  setAddTrainee(false);
                  setTraineeActualRoleName("");
                  setIsRoleModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Role
              </button>
              {isRoleSettingEditMode && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsRoleSettingEditMode(false);
                      setEditedRoleMappings([]);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsRoleSettingEditMode(false);
                      setEditedRoleMappings([]);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Percentage タブのコンテンツ */}
        {activeTab === "percentage" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Tip Pool Distribution
              </h3>
              <button
                onClick={() => {
                  setSelectedExistingRole("");
                  setIsAddExistingRoleModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Role Tip Pool
              </button>
            </div>
            <div className="overflow-x-auto">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${roleMappings.length}, 1fr)`,
                }}
              >
                {/* ロールヘッダー */}
                {roleMappings.map((mapping, roleIndex) => (
                  <div key={roleIndex} className="flex flex-col">
                    <div className="text-center font-semibold text-gray-800 mb-2 p-2 bg-gray-50 rounded">
                      {mapping.standardRoleGroup}
                    </div>
                    {/* 各パターンに対する入力ボックスまたは0%表示 */}
                    {patterns.map((pattern, patternIndex) => {
                      const isRolePresent = pattern[roleIndex] === 1;
                      const rolesInPattern = pattern.reduce(
                        (sum, val) => sum + val,
                        0
                      );
                      const isOnlyRole = rolesInPattern === 1 && isRolePresent;
                      return (
                        <div key={patternIndex} className="mb-2">
                          {isRolePresent ? (
                            <input
                              type="text"
                              value={
                                isOnlyRole &&
                                (percentages[roleIndex]?.[patternIndex] ===
                                  "" ||
                                  percentages[roleIndex]?.[patternIndex] ===
                                    undefined)
                                  ? "100%"
                                  : percentages[roleIndex]?.[patternIndex] || ""
                              }
                              onChange={(e) => {
                                setPercentages((prev) => ({
                                  ...prev,
                                  [roleIndex]: {
                                    ...prev[roleIndex],
                                    [patternIndex]: e.target.value,
                                  },
                                }));
                              }}
                              disabled={
                                isOnlyRole &&
                                (percentages[roleIndex]?.[patternIndex] ===
                                  "" ||
                                  percentages[roleIndex]?.[patternIndex] ===
                                    undefined)
                              }
                              className={`w-full px-3 py-2 border rounded-lg text-center ${
                                isOnlyRole &&
                                (percentages[roleIndex]?.[patternIndex] ===
                                  "" ||
                                  percentages[roleIndex]?.[patternIndex] ===
                                    undefined)
                                  ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                                  : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              }`}
                              placeholder="%"
                            />
                          ) : (
                            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-center text-gray-500">
                              0%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Store タブのコンテンツ */}
        {activeTab === "store" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Store Mapping
            </h3>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Store Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store Abbreviation
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingStores ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        Loading stores...
                      </td>
                    </tr>
                  ) : storeError ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-center text-red-500"
                      >
                        {storeError}
                      </td>
                    </tr>
                  ) : storeMappings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        No stores found. Add one!
                      </td>
                    </tr>
                  ) : (
                    storeMappings.map((mapping, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {mapping.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {mapping.abbreviation}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setIsStoreModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Store
            </button>
          </div>
        )}

        {/* Add Role モーダル */}
        <AddRoleModal
          isOpen={isRoleModalOpen}
          onClose={() => {
            setIsRoleModalOpen(false);
            setStandardRoleGroup("");
            setActualRoleName("");
            setAddTrainee(false);
            setTraineeActualRoleName("");
            setTraineePercentage("");
          }}
          standardRoleGroup={standardRoleGroup}
          actualRoleName={actualRoleName}
          onStandardRoleGroupChange={setStandardRoleGroup}
          onActualRoleNameChange={setActualRoleName}
          addTrainee={addTrainee}
          onAddTraineeChange={setAddTrainee}
          traineeActualRoleName={traineeActualRoleName}
          onTraineeActualRoleNameChange={setTraineeActualRoleName}
          traineePercentage={traineePercentage}
          onTraineePercentageChange={setTraineePercentage}
          onSave={() => {
            // Save機能はなし（モック）
            setIsRoleModalOpen(false);
            setStandardRoleGroup("");
            setActualRoleName("");
            setAddTrainee(false);
            setTraineeActualRoleName("");
            setTraineePercentage("");
          }}
        />

        {/* Add Trainee モーダル */}
        <AddTraineeModal
          isOpen={isTraineeModalOpen}
          onClose={() => {
            setIsTraineeModalOpen(false);
            setSelectedRoleForTrainee("");
            setTraineeRoleActual("");
            setTraineeRolePercentage("");
          }}
          selectedRole={selectedRoleForTrainee}
          traineeActualRoleName={traineeRoleActual}
          onTraineeActualRoleNameChange={setTraineeRoleActual}
          traineePercentage={traineeRolePercentage}
          onTraineePercentageChange={setTraineeRolePercentage}
          onSave={() => {
            // Save機能はなし（モック）
            setIsTraineeModalOpen(false);
            setSelectedRoleForTrainee("");
            setTraineeRoleActual("");
            setTraineeRolePercentage("");
          }}
        />

        {/* Add Store モーダル */}
        <AddStoreModal
          isOpen={isStoreModalOpen}
          onClose={() => {
            setIsStoreModalOpen(false);
            setStoreName("");
            setStoreAbbreviation("");
          }}
          storeName={storeName}
          storeAbbreviation={storeAbbreviation}
          onStoreNameChange={setStoreName}
          onStoreAbbreviationChange={setStoreAbbreviation}
          onSave={handleAddStore}
          isAddingStore={isAddingStore}
          storeError={storeError}
        />

        {/* Add Existing Role モーダル */}
        <AddExistingRoleModal
          isOpen={isAddExistingRoleModalOpen}
          onClose={() => {
            setIsAddExistingRoleModalOpen(false);
            setSelectedExistingRole("");
          }}
          selectedRole={selectedExistingRole}
          onSelectedRoleChange={setSelectedExistingRole}
          availableRoles={roleMappings.map((r) => r.standardRoleGroup)}
          onSave={() => {
            // Save機能はなし（モック）
            setIsAddExistingRoleModalOpen(false);
            setSelectedExistingRole("");
          }}
        />
      </div>
    </div>
  );
}
