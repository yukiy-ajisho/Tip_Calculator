"use client";

import { FormattedWorkingHours } from "@/types";

interface WorkingHoursRecord {
  name: string;
  date: string;
  day: string;
  start: string;
  end: string;
  role: string;
}

interface WorkingHoursEditTableProps {
  data?: FormattedWorkingHours[];
}

/**
 * Convert date string (YYYY-MM-DD) to day of week abbreviation
 */
function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
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
function formatTime(timeString: string): string {
  if (!timeString) return "";
  // Remove seconds if present
  return timeString.slice(0, 5);
}

export function WorkingHoursEditTable({ data }: WorkingHoursEditTableProps) {
  // データが提供されていない場合はモックデータを使用
  const mockData: WorkingHoursRecord[] = [
    {
      name: "Hiroaki Arakaki",
      date: "10/19/2025",
      day: "Sun",
      start: "",
      end: "",
      role: "",
    },
    {
      name: "Hiroaki Arakaki",
      date: "10/19/2025",
      day: "Sun",
      start: "",
      end: "",
      role: "",
    },
    {
      name: "Hiroaki Arakaki",
      date: "",
      day: "",
      start: "",
      end: "",
      role: "",
    },
    {
      name: "Hiroaki Arakaki",
      date: "10/21/2025",
      day: "Tue",
      start: "",
      end: "",
      role: "",
    },
    {
      name: "Hiroaki Arakaki",
      date: "10/21/2025",
      day: "Tue",
      start: "",
      end: "",
      role: "",
    },
    {
      name: "Hiroaki Arakaki",
      date: "",
      day: "",
      start: "",
      end: "",
      role: "",
    },
    {
      name: "Hiroaki Arakaki",
      date: "",
      day: "",
      start: "",
      end: "",
      role: "",
    },
    {
      name: "Hiroaki Arakaki",
      date: "10/24/2025",
      day: "Fri",
      start: "",
      end: "",
      role: "",
    },
    {
      name: "Hiroaki Arakaki",
      date: "10/24/2025",
      day: "Fri",
      start: "",
      end: "",
      role: "",
    },
    {
      name: "Hiroaki Arakaki",
      date: "",
      day: "",
      start: "",
      end: "",
      role: "",
    },
  ];

  // データが提供されている場合は変換、そうでなければモックデータを使用
  const displayData: WorkingHoursRecord[] = data
    ? data.map((record) => ({
        name: record.name,
        date: formatDate(record.date),
        day: getDayOfWeek(record.date),
        start: formatTime(record.start),
        end: formatTime(record.end),
        role: record.role,
      }))
    : mockData;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Day
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Start
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              End
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayData.map((record, index) => (
            <tr key={index}>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                {record.name}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                {record.date}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                {record.day}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                {record.start}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                {record.end}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {record.role}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
