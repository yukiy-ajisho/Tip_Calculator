"use client";

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  standardRoleGroup: string;
  actualRoleName: string;
  onStandardRoleGroupChange: (value: string) => void;
  onActualRoleNameChange: (value: string) => void;
  onSave: () => void;
}

export function AddRoleModal({
  isOpen,
  onClose,
  standardRoleGroup,
  actualRoleName,
  onStandardRoleGroupChange,
  onActualRoleNameChange,
  onSave,
}: AddRoleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Add Role Mapping
          </h2>
          <div className="space-y-4">
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
          </div>
          <div className="flex justify-end gap-3 mt-6">
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
    </div>
  );
}
