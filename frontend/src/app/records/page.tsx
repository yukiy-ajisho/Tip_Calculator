"use client";

import { useState, useMemo, useEffect } from "react";
import { api } from "@/lib/api";
import { RecordItem } from "@/types";

export default function RecordsPage() {
  // タブ切り替えの状態
  const [activeTab, setActiveTab] = useState<
    "tipResultCombine" | "storeBreakdown"
  >("tipResultCombine");

  // データ取得の状態
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 日付をフォーマット（YYYY-MM-DD → MM/DD/YYYY）
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
  };

  // APIからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.tips.getRecords();
        if (response.success) {
          setRecords(response.data);
        } else {
          setError("Failed to load records");
        }
      } catch (err) {
        console.error("Error fetching records:", err);
        setError(err instanceof Error ? err.message : "Failed to load records");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // データをRecordsの形式に変換（日付フォーマットを変換）
  const Records = useMemo(
    () =>
      records.map((record) => ({
        periodStart: formatDate(record.periodStart),
        store: record.store,
        name: record.name,
        tips: record.tips,
        cashTips: record.cashTips,
      })),
    [records]
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
  // 日付をソート（MM/DD/YYYY形式なので、一度YYYY-MM-DDに変換してからソート）
  const availableDates = useMemo(() => {
    const dates = Object.keys(storeBreakdownByDate);
    return dates.sort((a, b) => {
      // MM/DD/YYYY → YYYY-MM-DDに変換して比較
      const convertToSortable = (dateStr: string) => {
        const parts = dateStr.split("/");
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(
          2,
          "0"
        )}`;
      };
      const dateA = convertToSortable(a);
      const dateB = convertToSortable(b);
      return dateB.localeCompare(dateA); // 降順（新しい日付が先）
    });
  }, [storeBreakdownByDate]);

  // Store Breakdown用: 選択された日付の状態（null = "All"を選択）
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Store Breakdown用: ソート状態
  const [nameSortOrder, setNameSortOrder] = useState<"asc" | "desc" | null>(
    null
  );
  const [storeSortOrder, setStoreSortOrder] = useState<"asc" | "desc" | null>(
    null
  );

  // Store Breakdown用: 各日付の合計を計算（Storeを考慮）
  const getStoreBreakdownDateTotal = (date: string) => {
    const records = storeBreakdownByDate[date] || [];
    return records.reduce(
      (sum, record) => sum + record.tips + record.cashTips,
      0
    );
  };

  // Store Breakdown用: 各日付のtip合計を計算
  const getStoreBreakdownTipTotal = (date: string) => {
    const records = storeBreakdownByDate[date] || [];
    return records.reduce((sum, record) => sum + record.tips, 0);
  };

  // Store Breakdown用: 各日付のcash tip合計を計算
  const getStoreBreakdownCashTipTotal = (date: string) => {
    const records = storeBreakdownByDate[date] || [];
    return records.reduce((sum, record) => sum + record.cashTips, 0);
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

    // ソート: 最後にクリックした列を優先
    const sorted = [...records].sort((a, b) => {
      // Storeソートが有効な場合（最後にクリックされた列）
      if (storeSortOrder !== null) {
        if (storeSortOrder === "asc") {
          return a.store.localeCompare(b.store);
        } else {
          return b.store.localeCompare(a.store);
        }
      }

      // Nameソートが有効な場合（最後にクリックされた列）
      if (nameSortOrder !== null) {
        if (nameSortOrder === "asc") {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      }

      // デフォルトソート: 日付降順 → 店舗名 → 従業員名（バックエンドと同じ順序を維持）
      const convertToSortable = (dateStr: string) => {
        const parts = dateStr.split("/");
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(
          2,
          "0"
        )}`;
      };
      const dateA = convertToSortable(a.periodStart);
      const dateB = convertToSortable(b.periodStart);
      if (dateA !== dateB) {
        if (dateA < dateB) return 1;
        if (dateA > dateB) return -1;
        return 0;
      }
      // 店舗名の比較
      if (a.store !== b.store) {
        return a.store.localeCompare(b.store);
      }
      // 従業員名の比較
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [selectedDate, storeBreakdownByDate, nameSortOrder, storeSortOrder]);

  // Name列のソートを切り替える（Storeのソートを無効化）
  const handleNameSort = () => {
    if (nameSortOrder === null) {
      setNameSortOrder("asc");
      setStoreSortOrder(null); // Storeのソートを無効化
    } else if (nameSortOrder === "asc") {
      setNameSortOrder("desc");
    } else {
      setNameSortOrder(null);
    }
  };

  // Store列のソートを切り替える（Nameのソートを無効化）
  const handleStoreSort = () => {
    if (storeSortOrder === null) {
      setStoreSortOrder("asc");
      setNameSortOrder(null); // Nameのソートを無効化
    } else if (storeSortOrder === "asc") {
      setStoreSortOrder("desc");
    } else {
      setStoreSortOrder(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
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
                    const tipTotal = getStoreBreakdownTipTotal(date);
                    const cashTipTotal = getStoreBreakdownCashTipTotal(date);
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
                          Tip: ${tipTotal.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Cash: ${cashTipTotal.toFixed(2)}
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
                          <button
                            onClick={handleNameSort}
                            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                          >
                            Name
                            <span className="text-gray-400">
                              {nameSortOrder === "asc"
                                ? "↑"
                                : nameSortOrder === "desc"
                                ? "↓"
                                : "↓"}
                            </span>
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period Start
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={handleStoreSort}
                            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                          >
                            Store
                            <span className="text-gray-400">
                              {storeSortOrder === "asc"
                                ? "↑"
                                : storeSortOrder === "desc"
                                ? "↓"
                                : "↓"}
                            </span>
                          </button>
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
