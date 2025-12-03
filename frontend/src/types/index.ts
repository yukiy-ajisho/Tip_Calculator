export interface Store {
  id: string;
  name: string;
  abbreviation: string;
  role?: "owner" | "manager"; // ユーザーがそのストアに対して持つ権限
}

export interface StoreInvitation {
  id: string;
  store_id: string;
  code: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}

export interface RoleMapping {
  id: string;
  role_name: string; // Standard Role Group (FRONT, BACK, FLOATER)
  actual_role_name: string | null; // Actual role name in CSV (FOH, BOH)
  trainee_role_name: string | null; // Trainee role name in CSV (F_TRAINEE)
  trainee_percentage: number | null; // Trainee percentage (0-100)
  store_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface RolePercentage {
  id: string;
  role_mapping_id: string;
  percentage: number;
  distribution_grouping: number;
  created_at?: string;
  updated_at?: string;
}

export interface TipPoolPattern {
  distribution_grouping: number;
  percentages: {
    role_mapping_id: string;
    role_name: string;
    percentage: number;
  }[];
}

export interface FormattedWorkingHours {
  name: string;
  date: string;
  start: string;
  end: string;
  role: string;
  is_complete_on_import: boolean;
}

export interface FormatWorkingHoursResponse {
  success: boolean;
  calculationId: string;
}

export interface GetFormattedWorkingHoursResponse {
  success: boolean;
  data: FormattedWorkingHours[];
}

export interface FormattedTipData {
  order_date: string; // DATE型 (YYYY-MM-DD)
  payment_time: string | null; // TIME型 (HH:MM:SS) または null
  tips: string; // NUMERIC型 (文字列として)
}

export interface FormatTipDataResponse {
  success: boolean;
}

export interface GetFormattedTipDataResponse {
  success: boolean;
  data: FormattedTipData[];
}

export interface FormattedCashTip {
  date: string; // DATE型 (YYYY-MM-DD)
  cash_tips: string; // NUMERIC型 (文字列として)
}

export interface FormatCashTipResponse {
  success: boolean;
}

export interface GetFormattedCashTipResponse {
  success: boolean;
  data: FormattedCashTip[];
}
