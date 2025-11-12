"use client";

import { useState, useMemo } from "react";
import { AddRoleModal } from "@/components/AddRoleModal";
import { AddStoreModal } from "@/components/AddStoreModal";
import { AddTraineeModal } from "@/components/AddTraineeModal";
import { AddExistingRoleModal } from "@/components/AddExistingRoleModal";

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

  // モックデータ: Store Mapping（将来的にSupabaseから取得）
  const storeMappings = [
    {
      storeName: "Burlingame",
      storeAbbreviation: "BG",
    },
    {
      storeName: "San Francisco",
      storeAbbreviation: "SF",
    },
    {
      storeName: "Downtown LA",
      storeAbbreviation: "DLA",
    },
  ];

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
            Percentage Setting
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Role Mapping
            </h3>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Trainee Actual Role Name (from CSV)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roleMappings.map((mapping, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {mapping.standardRoleGroup}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {mapping.actualRoleName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
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
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {mapping.traineeActualRoleName ? (
                          <button
                            onClick={() => {
                              // Remove trainee functionality (mock)
                              console.log(
                                `Remove trainee for ${mapping.standardRoleGroup}`
                              );
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                          >
                            Remove Trainee
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedRoleForTrainee(
                                mapping.standardRoleGroup
                              );
                              setTraineeRoleActual("");
                              setTraineeRolePercentage("");
                              setIsTraineeModalOpen(true);
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs"
                          >
                            + Trainee
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          </div>
        )}

        {/* Percentage タブのコンテンツ */}
        {activeTab === "percentage" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Percentage Setting
              </h3>
              <button
                onClick={() => {
                  setSelectedExistingRole("");
                  setIsAddExistingRoleModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Existing Role
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
                  {storeMappings.map((mapping, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {mapping.storeName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {mapping.storeAbbreviation}
                      </td>
                    </tr>
                  ))}
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
          onSave={() => {
            // Save機能はなし（モック）
            setIsStoreModalOpen(false);
            setStoreName("");
            setStoreAbbreviation("");
          }}
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
