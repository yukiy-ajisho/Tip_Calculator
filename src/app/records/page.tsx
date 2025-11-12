"use client";

import { useState, useMemo } from "react";

export default function RecordsPage() {
  // タブ切り替えの状態
  const [activeTab, setActiveTab] = useState<
    "tipResultCombine" | "storeBreakdown"
  >("tipResultCombine");

  // モックデータ（将来的にSupabaseから取得）
  const Records = useMemo(
    () => [
      // 11/11/2024, Store: SF
      {
        periodStart: "11/11/2024",
        store: "SF",
        name: "Sandra Pixtun",
        tips: 100.5,
        cashTips: 0,
      },
      {
        periodStart: "11/11/2024",
        store: "SF",
        name: "Suguru Ishikawa",
        tips: 0,
        cashTips: 0,
      },
      {
        periodStart: "11/11/2024",
        store: "SF",
        name: "Yuki Tadokoro",
        tips: 250.75,
        cashTips: 0,
      },
      // 11/11/2024, Store: BG
      {
        periodStart: "11/11/2024",
        store: "BG",
        name: "Adelina Perez",
        tips: 0,
        cashTips: 50.0,
      },
      {
        periodStart: "11/11/2024",
        store: "BG",
        name: "Alan Martinez",
        tips: 150.25,
        cashTips: 0,
      },
      {
        periodStart: "11/11/2024",
        store: "BG",
        name: "Alexis Bartolon",
        tips: 200.0,
        cashTips: 0,
      },
      // 11/25/2024, Store: BG
      {
        periodStart: "11/25/2024",
        store: "BG",
        name: "Adelina Perez",
        tips: 0,
        cashTips: 50.0,
      },
      {
        periodStart: "11/25/2024",
        store: "BG",
        name: "Alan Martinez",
        tips: 150.25,
        cashTips: 0,
      },
      {
        periodStart: "11/25/2024",
        store: "BG",
        name: "Alexis Bartolon",
        tips: 200.0,
        cashTips: 0,
      },
      // 11/25/2024, Store: SF
      {
        periodStart: "11/25/2024",
        store: "SF",
        name: "Sandra Pixtun",
        tips: 100.5,
        cashTips: 0,
      },
      {
        periodStart: "11/25/2024",
        store: "SF",
        name: "Suguru Ishikawa",
        tips: 0,
        cashTips: 0,
      },
      {
        periodStart: "11/25/2024",
        store: "SF",
        name: "Yuki Tadokoro",
        tips: 250.75,
        cashTips: 0,
      },
    ],
    []
  );

  // 日付ごとにグループ化（Storeは無視）
  const groupedByDate = useMemo(() => {
    const grouped: Record<
      string,
      { name: string; tips: number; cashTips: number }[]
    > = {};

    Records.forEach((record) => {
      const date = record.periodStart;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push({
        name: record.name,
        tips: record.tips,
        cashTips: record.cashTips,
      });
    });

    return grouped;
  }, [Records]);

  // 各日付の合計を計算
  const getDateTotal = (date: string) => {
    const records = groupedByDate[date] || [];
    return records.reduce(
      (sum, record) => sum + record.tips + record.cashTips,
      0
    );
  };

  // Store Breakdown用: 日付ごとにグループ化（Storeを考慮）
  const storeBreakdownByDate = useMemo(() => {
    const grouped: Record<string, typeof Records> = {};

    Records.forEach((record) => {
      const date = record.periodStart;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });

    return grouped;
  }, [Records]);

  // 初期選択: 最初の日付を選択
  const availableDates = useMemo(() => {
    return Object.keys(storeBreakdownByDate).sort();
  }, [storeBreakdownByDate]);

  // Store Breakdown用: 選択された日付の状態（null = "All"を選択）
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Store Breakdown用: 各日付の合計を計算（Storeを考慮）
  const getStoreBreakdownDateTotal = (date: string) => {
    const records = storeBreakdownByDate[date] || [];
    return records.reduce(
      (sum, record) => sum + record.tips + record.cashTips,
      0
    );
  };

  // Store Breakdown用: 選択された日付のデータを取得し、名前でグループ化
  const getFilteredAndGroupedRecords = useMemo(() => {
    // selectedDateがnullの場合はすべての日付のデータを返す
    let records: typeof Records = [];

    if (selectedDate === null) {
      // すべての日付のデータを結合
      records = Object.values(storeBreakdownByDate).flat();
    } else {
      records = storeBreakdownByDate[selectedDate] || [];
    }

    // 名前でソート（同じ名前の人は近くに配置）
    const sorted = [...records].sort((a, b) => {
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      // 同じ名前の場合は日付でソート
      if (a.periodStart !== b.periodStart) {
        return a.periodStart.localeCompare(b.periodStart);
      }
      return a.store.localeCompare(b.store);
    });

    return sorted;
  }, [selectedDate, storeBreakdownByDate]);

  // 将来的にSupabaseからデータ取得
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const data = await fetchFromSupabase();
  //     setTipResultCombineData(data.tipResultCombine);
  //     setStoreBreakdownData(data.storeBreakdown);
  //   };
  //   fetchData();
  // }, []);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* タブボタン */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab("tipResultCombine")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "tipResultCombine"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tip Result Combine
          </button>
          <button
            onClick={() => setActiveTab("storeBreakdown")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "storeBreakdown"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Store Breakdown
          </button>
        </div>

        {/* Tip Result Combine タブのコンテンツ */}
        {activeTab === "tipResultCombine" && (
          <>
            {/* フィルターカード */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Year
                  </label>
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Period
                  </label>
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Name
                  </label>
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All</option>
                  </select>
                </div>
              </div>
            </div>
            {/* データ表示カード */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="space-y-6">
                {Object.keys(groupedByDate)
                  .sort()
                  .map((date) => {
                    const records = groupedByDate[date];
                    const total = getDateTotal(date);

                    return (
                      <div
                        key={date}
                        className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                      >
                        <div className="flex gap-6 mb-4">
                          {/* 左側: 日付と合計 */}
                          <div className="flex items-center gap-4 min-w-[200px]">
                            <span className="text-lg font-semibold text-gray-800">
                              {date}
                            </span>
                            <span className="text-lg font-semibold text-gray-800">
                              ${total.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* 右側: テーブル */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Tip
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Cash Tip
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {records.map((record, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {record.name}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {record.tips.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {record.cashTips.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}

        {/* Store Breakdown タブのコンテンツ */}
        {activeTab === "storeBreakdown" && (
          <>
            {/* フィルターカード */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Year
                  </label>
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Period
                  </label>
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Name
                  </label>
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All</option>
                  </select>
                </div>
              </div>
            </div>
            {/* データ表示エリア: 左サイドバー + 右テーブル */}
            <div className="flex gap-6">
              {/* 左サイドバー: 日付リスト */}
              <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="overflow-y-auto max-h-[600px]">
                  {/* "All" ボタン */}
                  <button
                    onClick={() => setSelectedDate(null)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedDate === null
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">All</div>
                  </button>

                  {availableDates.map((date) => {
                    const total = getStoreBreakdownDateTotal(date);
                    const isSelected = selectedDate === date;
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : ""
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {date}
                        </div>
                        <div className="text-sm text-gray-600">
                          ${total.toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 右テーブル: 選択された日付のデータ */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period Start
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Store
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tips
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cash Tips
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredAndGroupedRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No records found
                          </td>
                        </tr>
                      ) : (
                        getFilteredAndGroupedRecords.map((record, index) => {
                          // 前のレコードと同じ名前かチェック（グループ化の視覚的区切り）
                          const prevRecord =
                            index > 0
                              ? getFilteredAndGroupedRecords[index - 1]
                              : null;
                          const isNewGroup =
                            !prevRecord || prevRecord.name !== record.name;

                          return (
                            <tr
                              key={`${record.periodStart}-${record.store}-${record.name}-${index}`}
                              className={
                                isNewGroup ? "border-t-2 border-gray-300" : ""
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.periodStart}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.store}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${record.tips.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${record.cashTips.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
