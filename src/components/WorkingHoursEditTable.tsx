"use client";

interface WorkingHoursRecord {
  name: string;
  date: string;
  day: string;
  start: string;
  end: string;
  role: string;
}

export function WorkingHoursEditTable() {
  // モックデータ（画像に基づく）
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
          {mockData.map((record, index) => (
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
