import { createClient } from "@/lib/supabase-client";
import {
  Store,
  RoleMapping,
  RolePercentage,
  TipPoolPattern,
  FormatWorkingHoursResponse,
  GetFormattedWorkingHoursResponse,
  FormatTipDataResponse,
  GetFormattedTipDataResponse,
  FormatCashTipResponse,
  GetFormattedCashTipResponse,
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
    getFormattedWorkingHours: (): Promise<GetFormattedWorkingHoursResponse> => {
      return apiRequest<GetFormattedWorkingHoursResponse>(
        "/api/tips/formatted-working-hours"
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
    getFormattedTipData: (): Promise<GetFormattedTipDataResponse> => {
      return apiRequest<GetFormattedTipDataResponse>(
        "/api/tips/formatted-tip-data"
      );
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
    getFormattedCashTip: (): Promise<GetFormattedCashTipResponse> => {
      return apiRequest<GetFormattedCashTipResponse>(
        "/api/tips/formatted-cash-tip"
      );
    },
  },
};
