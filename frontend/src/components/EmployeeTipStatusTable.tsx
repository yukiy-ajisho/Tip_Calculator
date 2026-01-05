"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";

interface EmployeeTipStatus {
  id: string;
  calculation_id: string;
  stores_id: string;
  employee_name: string;
  is_tipped: boolean;
}

interface EmployeeTipStatusTableProps {
  calculationId: string | null;
  isEditing: boolean;
}

export interface EmployeeTipStatusTableRef {
  save: () => Promise<void>;
  cancel: () => void;
}

export const EmployeeTipStatusTable = forwardRef<
  EmployeeTipStatusTableRef,
  EmployeeTipStatusTableProps
>(({ calculationId, isEditing }, ref) => {
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeTipStatus[]>(
    []
  );
  const [originalStatuses, setOriginalStatuses] = useState<EmployeeTipStatus[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // データを取得
  useEffect(() => {
    const fetchEmployeeTipStatus = async () => {
      if (!calculationId) {
        setEmployeeStatuses([]);
        setOriginalStatuses([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const { api } = await import("@/lib/api");
        const response = await api.tips.getEmployeeTipStatus(calculationId);

        if (response.success) {
          setEmployeeStatuses(response.data);
          setOriginalStatuses(JSON.parse(JSON.stringify(response.data)));
        } else {
          setError("Failed to load employee tip status");
        }
      } catch (err) {
        console.error("Error fetching employee tip status:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeTipStatus();
  }, [calculationId]);

  const tippedStaff = employeeStatuses.filter((status) => status.is_tipped);
  const nonTippedStaff = employeeStatuses.filter((status) => !status.is_tipped);

  const handleEmployeeClick = (employeeName: string) => {
    if (!isEditing) return;

    setEmployeeStatuses((prev) =>
      prev.map((status) =>
        status.employee_name === employeeName
          ? { ...status, is_tipped: !status.is_tipped }
          : status
      )
    );
  };

  const handleSave = async () => {
    if (!calculationId) return;

    try {
      const { api } = await import("@/lib/api");
      const employeeStatusesToSave = employeeStatuses.map((status) => ({
        employee_name: status.employee_name,
        is_tipped: status.is_tipped,
      }));

      await api.tips.saveEmployeeTipStatus(
        calculationId,
        employeeStatusesToSave
      );

      setOriginalStatuses(JSON.parse(JSON.stringify(employeeStatuses)));
    } catch (err) {
      console.error("Error saving employee tip status:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to save employee tip status"
      );
      throw err;
    }
  };

  const handleCancel = () => {
    setEmployeeStatuses(JSON.parse(JSON.stringify(originalStatuses)));
  };

  // Save/Cancelハンドラーを親から呼び出せるように公開
  useImperativeHandle(ref, () => ({
    save: handleSave,
    cancel: handleCancel,
  }));

  if (isLoading) {
    return (
      <div className="text-sm text-gray-600">
        Loading employee tip status...
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Tipped Staff */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Tipped Staff
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tippedStaff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={1}
                      className="px-3 py-2 text-center text-xs text-gray-500"
                    >
                      No tipped staff
                    </td>
                  </tr>
                ) : (
                  tippedStaff.map((status) => (
                    <tr
                      key={status.id}
                      onClick={() => handleEmployeeClick(status.employee_name)}
                      className={`${
                        isEditing
                          ? "cursor-pointer hover:bg-blue-50 transition-colors"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {status.employee_name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Non-Tipped Staff */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Non-Tipped Staff
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {nonTippedStaff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={1}
                      className="px-3 py-2 text-center text-xs text-gray-500"
                    >
                      No non-tipped staff
                    </td>
                  </tr>
                ) : (
                  nonTippedStaff.map((status) => (
                    <tr
                      key={status.id}
                      onClick={() => handleEmployeeClick(status.employee_name)}
                      className={`${
                        isEditing
                          ? "cursor-pointer hover:bg-blue-50 transition-colors"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {status.employee_name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

EmployeeTipStatusTable.displayName = "EmployeeTipStatusTable";
