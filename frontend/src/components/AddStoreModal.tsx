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
  inviteCode: string;
  onInviteCodeChange: (value: string) => void;
  onSave: () => void;
  onJoin: () => void;
  isAddingStore: boolean;
  isJoiningStore: boolean;
  storeError: string | null;
}

export function AddStoreModal({
  isOpen,
  onClose,
  storeName,
  storeAbbreviation,
  onStoreNameChange,
  onStoreAbbreviationChange,
  inviteCode,
  onInviteCodeChange,
  onSave,
  onJoin,
  isAddingStore,
  isJoiningStore,
  storeError,
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
          {storeError && (
            <div className="text-red-600 text-sm mb-4">{storeError}</div>
          )}

          {/* 新規店舗作成セクション */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Create New Store
            </h3>
            <div className="space-y-4">
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
                  disabled={isAddingStore || isJoiningStore}
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
                  disabled={isAddingStore || isJoiningStore}
                />
              </div>
            </div>
          </div>

          {/* 区切り線 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* 招待コードで参加セクション */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Join Store with Invite Code
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => onInviteCodeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="Enter invitation code"
                disabled={isAddingStore || isJoiningStore}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={isAddingStore || isJoiningStore}
          >
            Cancel
          </button>
          {inviteCode.trim() ? (
            <button
              onClick={onJoin}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isJoiningStore
                  ? "bg-blue-300 text-white cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              disabled={isJoiningStore || isAddingStore}
            >
              {isJoiningStore ? "Joining..." : "Join Store"}
            </button>
          ) : (
            <button
              onClick={onSave}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isAddingStore
                  ? "bg-blue-300 text-white cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              disabled={isAddingStore || isJoiningStore}
            >
              {isAddingStore ? "Adding..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
