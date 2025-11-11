"use client";

import React from "react";
import { X } from "lucide-react";

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  standardRoleGroup: string;
  actualRoleName: string;
  onStandardRoleGroupChange: (value: string) => void;
  onActualRoleNameChange: (value: string) => void;
  addTrainee: boolean;
  onAddTraineeChange: (value: boolean) => void;
  traineeActualRoleName: string;
  onTraineeActualRoleNameChange: (value: string) => void;
  traineePercentage: string;
  onTraineePercentageChange: (value: string) => void;
  onSave: () => void;
}

export function AddRoleModal({
  isOpen,
  onClose,
  standardRoleGroup,
  actualRoleName,
  onStandardRoleGroupChange,
  onActualRoleNameChange,
  addTrainee,
  onAddTraineeChange,
  traineeActualRoleName,
  onTraineeActualRoleNameChange,
  traineePercentage,
  onTraineePercentageChange,
  onSave,
}: AddRoleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Add Role Mapping
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Standard Role Group
            </label>
            <input
              type="text"
              value={standardRoleGroup}
              onChange={(e) => onStandardRoleGroupChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., FRONT, BACK, FLOATER"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Role Name (from CSV)
            </label>
            <input
              type="text"
              value={actualRoleName}
              onChange={(e) => onActualRoleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., FOH, BOH"
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="addTrainee"
              checked={addTrainee}
              onChange={(e) => onAddTraineeChange(e.target.checked)}
              className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label
              htmlFor="addTrainee"
              className="text-sm font-medium text-gray-700"
            >
              Also add trainee version?
            </label>
          </div>

          {addTrainee && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trainee Actual Role Name (from CSV)
                </label>
                <input
                  type="text"
                  value={traineeActualRoleName}
                  onChange={(e) =>
                    onTraineeActualRoleNameChange(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., F_TRAINEE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trainee Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={traineePercentage}
                  onChange={(e) => onTraineePercentageChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
