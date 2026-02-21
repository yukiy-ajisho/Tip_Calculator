import { createClient } from "@/lib/supabase-client";
import {
  Store,
  RoleMapping,
  RolePercentage,
  TipPoolPattern,
  FormatWorkingHoursResponse,
  GetFormattedWorkingHoursResponse,
  UpdateFormattedWorkingHoursResponse,
  FormattedWorkingHours,
  FormatTipDataResponse,
  GetFormattedTipDataResponse,
  FormatCashTipResponse,
  GetFormattedCashTipResponse,
  GetCalculationResultsResponse,
  GetRecordsResponse,
  GetCalculationStatusResponse,
  GetCalculationStatusesResponse,
  UserSettings,
  GetUserSettingsResponse,
  UpdateUserSettingsResponse,
} from "@/types";
import { getErrorMessage } from "@/lib/is-api-error";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.access_token) {
    console.error("No session found or session error:", sessionError);
    // 認証エラー時にログインページにリダイレクト
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Authentication required.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // 401エラー（認証エラー）の場合はログインページにリダイレクト
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Authentication required.");
    }

    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new Error(getErrorMessage(errorData, "An API error occurred."));
  }

  return response.json();
}

export const api = {
  stores: {
    getStores: (): Promise<Store[]> => {
      return apiRequest<Store[]>("/api/stores");
    },
    addStore: (name: string, abbreviation: string): Promise<Store> => {
      return apiRequest<Store>("/api/stores", {
        method: "POST",
        body: JSON.stringify({
          storeName: name,
          storeAbbreviation: abbreviation,
        }),
      });
    },
    generateInviteCode: (
      storeId: string
    ): Promise<{ code: string; expiresAt: string }> => {
      return apiRequest<{ code: string; expiresAt: string }>(
        `/api/stores/${storeId}/invite`,
        {
          method: "POST",
        }
      );
    },
    joinStore: (code: string): Promise<{ store: Store }> => {
      return apiRequest<{ store: Store }>("/api/stores/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
    },
    updateStoreSettings: (
      storeId: string,
      settings: {
        off_hours_adjustment_before_hours?: number | null;
        off_hours_adjustment_after_hours?: number | null;
        start_time_adjustment_minutes?: number | null;
      }
    ): Promise<{ success: boolean }> => {
      return apiRequest<{ success: boolean }>(
        `/api/stores/${storeId}/settings`,
        {
          method: "PUT",
          body: JSON.stringify(settings),
        }
      );
    },
    getCalculationStatuses: (): Promise<GetCalculationStatusesResponse> => {
      return apiRequest<GetCalculationStatusesResponse>(
        "/api/stores/calculation-status"
      );
    },
  },
  roleMappings: {
    getRoleMappings: (storeId: string): Promise<RoleMapping[]> => {
      return apiRequest<RoleMapping[]>(`/api/role-mappings?storeId=${storeId}`);
    },
    addRoleMapping: (data: {
      storeId: string;
      roleName: string;
      actualRoleName?: string;
      traineeRoleName?: string;
      traineePercentage?: number;
    }): Promise<RoleMapping> => {
      return apiRequest<RoleMapping>("/api/role-mappings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateRoleMapping: (
      id: string,
      data: {
        roleName: string;
        actualRoleName?: string;
        traineeRoleName?: string;
        traineePercentage?: number;
      }
    ): Promise<RoleMapping> => {
      return apiRequest<RoleMapping>(`/api/role-mappings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteRoleMapping: (id: string): Promise<{ message: string }> => {
      return apiRequest<{ message: string }>(`/api/role-mappings/${id}`, {
        method: "DELETE",
      });
    },
  },
  tipPool: {
    getTipPool: (storeId: string): Promise<RolePercentage[]> => {
      return apiRequest<RolePercentage[]>(`/api/tip-pool?storeId=${storeId}`);
    },
    addRole: (
      storeId: string,
      roleMappingId: string
    ): Promise<{ message: string }> => {
      return apiRequest<{ message: string }>("/api/tip-pool/add-role", {
        method: "POST",
        body: JSON.stringify({ storeId, roleMappingId }),
      });
    },
    removeRole: (
      storeId: string,
      roleMappingId: string
    ): Promise<{ message: string }> => {
      return apiRequest<{ message: string }>("/api/tip-pool/remove-role", {
        method: "DELETE",
        body: JSON.stringify({ storeId, roleMappingId }),
      });
    },
    updateTipPool: (
      storeId: string,
      patterns: TipPoolPattern[]
    ): Promise<{ message: string }> => {
      return apiRequest<{ message: string }>("/api/tip-pool", {
        method: "PUT",
        body: JSON.stringify({ storeId, patterns }),
      });
    },
  },
  tips: {
    formatWorkingHours: (
      storesId: string,
      csvData: string[]
    ): Promise<FormatWorkingHoursResponse> => {
      return apiRequest<FormatWorkingHoursResponse>(
        "/api/tips/format-working-hours",
        {
          method: "POST",
          body: JSON.stringify({
            stores_id: storesId,
            csvData: csvData,
          }),
        }
      );
    },
    getFormattedWorkingHours: (
      storeId?: string
    ): Promise<GetFormattedWorkingHoursResponse> => {
      const url = storeId
        ? `/api/tips/formatted-working-hours?storeId=${storeId}`
        : "/api/tips/formatted-working-hours";
      return apiRequest<GetFormattedWorkingHoursResponse>(url);
    },
    updateFormattedWorkingHours: (
      data: FormattedWorkingHours[]
    ): Promise<UpdateFormattedWorkingHoursResponse> => {
      return apiRequest<UpdateFormattedWorkingHoursResponse>(
        "/api/tips/formatted-working-hours",
        {
          method: "PUT",
          body: JSON.stringify({ data }),
        }
      );
    },
    deleteFormattedWorkingHours: (
      id: string
    ): Promise<{ success: boolean; message?: string }> => {
      return apiRequest<{ success: boolean; message?: string }>(
        `/api/tips/formatted-working-hours/${id}`,
        {
          method: "DELETE",
        }
      );
    },
    formatTipData: (
      storesId: string,
      csvData: string[]
    ): Promise<FormatTipDataResponse> => {
      return apiRequest<FormatTipDataResponse>("/api/tips/format-tip-data", {
        method: "POST",
        body: JSON.stringify({
          stores_id: storesId,
          csvData: csvData,
        }),
      });
    },
    getFormattedTipData: (
      storeId?: string,
      options?: { countOnly?: boolean }
    ): Promise<GetFormattedTipDataResponse | { success: boolean; count: number }> => {
      let url = storeId
        ? `/api/tips/formatted-tip-data?storeId=${storeId}`
        : "/api/tips/formatted-tip-data";
      
      if (options?.countOnly) {
        url += storeId ? "&count_only=true" : "?count_only=true";
      }
      
      return apiRequest<GetFormattedTipDataResponse | { success: boolean; count: number }>(url);
    },
    updateFormattedTipData: (
      id: string,
      payment_time: string | null
    ): Promise<{ success: boolean }> => {
      return apiRequest<{ success: boolean }>("/api/tips/formatted-tip-data", {
        method: "PUT",
        body: JSON.stringify({ id, payment_time }),
      });
    },
    formatCashTip: (
      storesId: string,
      data: Array<{ Date: string; "Cash Tips": string }>
    ): Promise<FormatCashTipResponse> => {
      return apiRequest<FormatCashTipResponse>("/api/tips/format-cash-tip", {
        method: "POST",
        body: JSON.stringify({
          stores_id: storesId,
          data: data,
        }),
      });
    },
    getFormattedCashTip: (
      storeId?: string
    ): Promise<GetFormattedCashTipResponse> => {
      const url = storeId
        ? `/api/tips/formatted-cash-tip?storeId=${storeId}`
        : "/api/tips/formatted-cash-tip";
      return apiRequest<GetFormattedCashTipResponse>(url);
    },
    deleteCalculation: (storeId: string): Promise<{ success: boolean }> => {
      return apiRequest<{ success: boolean }>(
        `/api/tips/calculation?storeId=${storeId}`,
        {
          method: "DELETE",
        }
      );
    },
    deleteCompletedCalculation: (
      storeId: string
    ): Promise<{ success: boolean }> => {
      return apiRequest<{ success: boolean }>(
        `/api/tips/calculation/completed?storeId=${storeId}`,
        {
          method: "DELETE",
        }
      );
    },
    calculate: (
      storeId: string
    ): Promise<{ success: boolean; calculationId: string }> => {
      return apiRequest<{ success: boolean; calculationId: string }>(
        "/api/tips/calculate",
        {
          method: "POST",
          body: JSON.stringify({ storeId }),
        }
      );
    },
    getCalculationResults: (
      calculationId: string
    ): Promise<GetCalculationResultsResponse> => {
      return apiRequest<GetCalculationResultsResponse>(
        `/api/tips/calculation-results?calculationId=${calculationId}`
      );
    },
    deleteFormattedData: (
      calculationId: string
    ): Promise<{ success: boolean }> => {
      return apiRequest<{ success: boolean }>(
        `/api/tips/formatted-data?calculationId=${calculationId}`,
        {
          method: "DELETE",
        }
      );
    },
    getCalculationStatus: (
      storeId: string
    ): Promise<GetCalculationStatusResponse> => {
      return apiRequest<GetCalculationStatusResponse>(
        `/api/tips/calculation-status?storeId=${storeId}`
      );
    },
    revertCalculation: (
      calculationId: string
    ): Promise<{ success: boolean; storeId: string }> => {
      return apiRequest<{ success: boolean; storeId: string }>(
        `/api/tips/calculation/revert?calculationId=${calculationId}`,
        {
          method: "POST",
        }
      );
    },
    getRecords: (): Promise<GetRecordsResponse> => {
      return apiRequest<GetRecordsResponse>("/api/tips/records");
    },
    deleteCalculationResult: (
      id: string
    ): Promise<{ success: boolean; message?: string }> => {
      return apiRequest<{ success: boolean; message?: string }>(
        `/api/tips/calculation-results/${id}`,
        {
          method: "DELETE",
        }
      );
    },
    archiveCalculationResult: (
      id: string
    ): Promise<{ success: boolean; message?: string }> => {
      return apiRequest<{ success: boolean; message?: string }>(
        `/api/tips/calculation-results/${id}/archive`,
        {
          method: "PATCH",
        }
      );
    },
    unarchiveCalculationResult: (
      id: string
    ): Promise<{ success: boolean; message?: string }> => {
      return apiRequest<{ success: boolean; message?: string }>(
        `/api/tips/calculation-results/${id}/unarchive`,
        {
          method: "PATCH",
        }
      );
    },
    updateCalculationResult: (
      id: string,
      data: { tips?: number; cash_tips?: number }
    ): Promise<{ success: boolean; message?: string }> => {
      return apiRequest<{ success: boolean; message?: string }>(
        `/api/tips/calculation-results/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );
    },
    getEmployeeTipStatus: (
      calculationId: string
    ): Promise<{
      success: boolean;
      data: Array<{
        id: string;
        calculation_id: string;
        stores_id: string;
        employee_name: string;
        is_tipped: boolean;
      }>;
    }> => {
      return apiRequest<{
        success: boolean;
        data: Array<{
          id: string;
          calculation_id: string;
          stores_id: string;
          employee_name: string;
          is_tipped: boolean;
        }>;
      }>(`/api/tips/employee-tip-status?calculationId=${calculationId}`);
    },
    saveEmployeeTipStatus: (
      calculationId: string,
      employeeStatuses: Array<{
        employee_name: string;
        is_tipped: boolean;
      }>
    ): Promise<{ success: boolean }> => {
      return apiRequest<{ success: boolean }>("/api/tips/employee-tip-status", {
        method: "POST",
        body: JSON.stringify({
          calculationId,
          employeeStatuses,
        }),
      });
    },
    deleteEmployeeTipStatus: (
      calculationId: string,
      employeeNames?: string[]
    ): Promise<{ success: boolean }> => {
      return apiRequest<{ success: boolean }>("/api/tips/employee-tip-status", {
        method: "DELETE",
        body: JSON.stringify({
          calculationId,
          employeeNames,
        }),
      });
    },
  },
  userSettings: {
    getUserSettings: (): Promise<UserSettings> => {
      return apiRequest<UserSettings>("/api/user-settings");
    },
    updateUserSettings: (settings: {
      timeFormat?: "24h" | "12h";
      showArchivedRecords?: boolean;
    }): Promise<UserSettings> => {
      const body: {
        time_format?: "24h" | "12h";
        show_archived_records?: boolean;
      } = {};

      if (settings.timeFormat !== undefined) {
        body.time_format = settings.timeFormat;
      }

      if (settings.showArchivedRecords !== undefined) {
        body.show_archived_records = settings.showArchivedRecords;
      }

      return apiRequest<UserSettings>("/api/user-settings", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
};
