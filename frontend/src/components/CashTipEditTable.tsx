"use client";

import { FormattedCashTip } from "@/types";

interface CashTipRecord {
  date: string; // MM/DD/YY形式で表示
  cash_tips: string; // 数値として表示
}

interface CashTipEditTableProps {
  data?: FormattedCashTip[];
}

/**
 * Convert date string (YYYY-MM-DD) to MM/DD/YY format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
}

export function CashTipEditTable({ data }: CashTipEditTableProps) {
  // データが提供されている場合は変換、そうでなければ空配列を使用
  const displayData: CashTipRecord[] = data
    ? data.map((record) => ({
        date: formatDate(record.date),
        cash_tips: record.cash_tips,
      }))
    : [];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Date
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cash Tips
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayData.length === 0 ? (
            <tr>
              <td
                colSpan={2}
                className="px-3 py-2 text-center text-xs text-gray-500"
              >
                No cash tip data available.
              </td>
            </tr>
          ) : (
            displayData.map((record, index) => (
              <tr key={index}>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {record.date}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {record.cash_tips}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
