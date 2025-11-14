export interface Store {
  id: string;
  name: string;
  abbreviation: string;
}

export interface RoleMapping {
  standardRoleGroup: string;
  actualRoleName: string;
  traineeActualRoleName: string;
  traineePercentage: number;
}

export interface FormattedWorkingHours {
  name: string;
  date: string;
  start: string;
  end: string;
  role: string;
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
