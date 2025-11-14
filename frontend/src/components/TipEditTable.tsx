"use client";

import { FormattedTipData } from "@/types";

interface TipRecord {
  order_date: string; // MM/DD/YY形式で表示
  payment_time: string; // HH:MM形式で表示（nullの場合は空文字）
  tips: string; // 数値として表示
}

interface TipEditTableProps {
  data?: FormattedTipData[];
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

/**
 * Convert time string (HH:MM:SS) to HH:MM format
 */
function formatTime(timeString: string | null): string {
  if (!timeString) return "";
  // Remove seconds if present
  return timeString.slice(0, 5);
}

export function TipEditTable({ data }: TipEditTableProps) {
  // データが提供されている場合は変換、そうでなければ空配列を使用
  const displayData: TipRecord[] = data
    ? data.map((record) => ({
        order_date: formatDate(record.order_date),
        payment_time: formatTime(record.payment_time),
        tips: record.tips,
      }))
    : [];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Order Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Payment Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tips
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayData.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-3 text-center text-sm text-gray-500"
              >
                No tip data available.
              </td>
            </tr>
          ) : (
            displayData.map((record, index) => (
              <tr key={index}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  {record.order_date}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  {record.payment_time}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {record.tips}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
