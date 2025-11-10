"use client";

import { useState, useMemo } from "react";
import { AddRoleModal } from "@/components/AddRoleModal";
import { AddStoreModal } from "@/components/AddStoreModal";

export default function SettingsPage() {
  // タブ切り替えの状態
  const [activeTab, setActiveTab] = useState<"role" | "percentage" | "store">(
    "role"
  );

  // モーダルの状態
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [standardRoleGroup, setStandardRoleGroup] = useState("");
  const [actualRoleName, setActualRoleName] = useState("");
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeAbbreviation, setStoreAbbreviation] = useState("");

  // モックデータ: Role Mapping（将来的にSupabaseから取得）
  const roleMappings = [
    {
      standardRoleGroup: "FRONT",
      actualRoleName: "FOH",
    },
    {
      standardRoleGroup: "BACK",
      actualRoleName: "BOH",
    },
    {
      standardRoleGroup: "FLOATER",
      actualRoleName: "FLOATER",
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

  const patterns = useMemo(
    () => generatePatterns(roleMappings.length),
    [roleMappings.length]
  );

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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Role Name (from CSV)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roleMappings.map((mapping, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {mapping.standardRoleGroup}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {mapping.actualRoleName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Role
            </button>
          </div>
        )}

        {/* Percentage タブのコンテンツ */}
        {activeTab === "percentage" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Percentage Settings
            </h3>
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
                      return (
                        <div key={patternIndex} className="mb-2">
                          {isRolePresent ? (
                            <input
                              type="text"
                              value={
                                percentages[roleIndex]?.[patternIndex] || ""
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                              placeholder="%"
                            />
                          ) : (
                            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500">
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
          }}
          standardRoleGroup={standardRoleGroup}
          actualRoleName={actualRoleName}
          onStandardRoleGroupChange={setStandardRoleGroup}
          onActualRoleNameChange={setActualRoleName}
          onSave={() => {
            // Save機能はなし（モック）
            setIsRoleModalOpen(false);
            setStandardRoleGroup("");
            setActualRoleName("");
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
      </div>
    </div>
  );
}
