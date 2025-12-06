export interface Store {
  id: string;
  name: string;
  abbreviation: string;
  role?: "owner" | "manager"; // ユーザーがそのストアに対して持つ権限
  off_hours_adjustment_before_hours?: number | null;
  off_hours_adjustment_after_hours?: number | null;
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
  id: string;
  name: string;
  date: string | null;
  start: string | null;
  end: string | null;
  role: string | null;
  is_complete_on_import: boolean; // インポート時の状態（変更しない）
  is_complete: boolean; // 現在の完全性（編集時に更新）
  stores_id: string;
}

export interface FormatWorkingHoursResponse {
  success: boolean;
  calculationId: string;
}

export interface GetFormattedWorkingHoursResponse {
  success: boolean;
  data: FormattedWorkingHours[];
}

export interface UpdateFormattedWorkingHoursResponse {
  success: boolean;
  message?: string;
}

export interface FormattedTipData {
  id?: string;
  order_date: string; // DATE型 (YYYY-MM-DD)
  payment_time: string | null; // TIME型 (HH:MM:SS) または null
  original_payment_time?: string | null; // TIME型 (HH:MM:SS) または null
  is_adjusted?: boolean; // 調整済みかどうか
  tips: string; // NUMERIC型 (文字列として)
  stores_id?: string;
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

export interface TipCalculationResult {
  id: string;
  calculation_id: string;
  name: string | null;
  date: string; // DATE型 (YYYY-MM-DD)
  tips: number | null;
  cash_tips: number | null;
}

export interface CalculationInfo {
  id: string;
  stores_id: string;
  period_start: string | null; // DATE型 (YYYY-MM-DD)
  period_end: string | null; // DATE型 (YYYY-MM-DD)
  status: string | null;
  store_name?: string; // JOINで取得
}

export interface GetCalculationResultsResponse {
  success: boolean;
  data: {
    calculation: CalculationInfo;
    results: TipCalculationResult[];
  };
}
