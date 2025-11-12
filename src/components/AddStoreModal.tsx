"use client";

import React from "react";
import { X } from "lucide-react";

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  storeAbbreviation: string;
  onStoreNameChange: (value: string) => void;
  onStoreAbbreviationChange: (value: string) => void;
  onSave: () => void;
}

export function AddStoreModal({
  isOpen,
  onClose,
  storeName,
  storeAbbreviation,
  onStoreNameChange,
  onStoreAbbreviationChange,
  onSave,
}: AddStoreModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Add Store Mapping
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
              Store Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => onStoreNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Burlingame, San Francisco"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Abbreviation
            </label>
            <input
              type="text"
              value={storeAbbreviation}
              onChange={(e) => onStoreAbbreviationChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., BG, SF"
            />
          </div>
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
