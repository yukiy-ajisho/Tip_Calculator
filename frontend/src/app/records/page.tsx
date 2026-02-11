"use client";

import { useState, useMemo, useEffect } from "react";
import { api } from "@/lib/api";
import { RecordItem } from "@/types";
import { useUserSettings } from "@/hooks/useUserSettings";

export default function RecordsPage() {
  // ユーザー設定を取得
  const { showArchivedRecords, timeFormat } = useUserSettings();

  // タブ切り替えの状態
  const [activeTab, setActiveTab] = useState<
    "tipResultCombine" | "storeBreakdown"
  >("storeBreakdown");

  // データ取得の状態
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editモードの状態（Tip Result Combine）
  const [isEditingTipResultCombine, setIsEditingTipResultCombine] =
    useState(false);
  const [selectedRecords, setSelectedRecords] = useState<
    Record<string, "delete" | "archive">
  >({});
  // 編集モードに入る際の既にアーカイブされているレコードのIDを記録（Tip Result Combine）
  const [initialArchivedRecordIds, setInitialArchivedRecordIds] = useState<
    Set<string>
  >(new Set());
  // Tip Result Combine用の編集値（tips, cashTips）
  const [editingValuesTipResultCombine, setEditingValuesTipResultCombine] =
    useState<Record<string, { tips: number; cashTips: number }>>({});
  // Tip Result Combine用の入力中の文字列（tips, cashTips）
  const [tipInputsTipResultCombine, setTipInputsTipResultCombine] = useState<
    Map<string, string>
  >(new Map());
  const [cashTipInputsTipResultCombine, setCashTipInputsTipResultCombine] =
    useState<Map<string, string>>(new Map());

  // Editモードの状態（Store Breakdown）
  const [isEditingStoreBreakdown, setIsEditingStoreBreakdown] = useState(false);
  const [selectedRecordsStoreBreakdown, setSelectedRecordsStoreBreakdown] =
    useState<Record<string, "delete" | "archive">>({});
  // 編集モードに入る際の既にアーカイブされているレコードのIDを記録（Store Breakdown）
  const [
    initialArchivedRecordIdsStoreBreakdown,
    setInitialArchivedRecordIdsStoreBreakdown,
  ] = useState<Set<string>>(new Set());
  // Store Breakdown用の編集値（tips, cashTips）
  const [editingValuesStoreBreakdown, setEditingValuesStoreBreakdown] =
    useState<Record<string, { tips: number; cashTips: number }>>({});
  // Store Breakdown用の入力中の文字列（tips, cashTips）
  const [tipInputsStoreBreakdown, setTipInputsStoreBreakdown] = useState<
    Map<string, string>
  >(new Map());
  const [cashTipInputsStoreBreakdown, setCashTipInputsStoreBreakdown] =
    useState<Map<string, string>>(new Map());

  // フィルター用のstate（Tip Result Combine）
  const [selectedYearTipResultCombine, setSelectedYearTipResultCombine] =
    useState<string>("");
  const [selectedPeriodTipResultCombine, setSelectedPeriodTipResultCombine] =
    useState<string>("");
  const [selectedNameTipResultCombine, setSelectedNameTipResultCombine] =
    useState<string>("");

  // フィルター用のstate（Store Breakdown）
  const [selectedYearStoreBreakdown, setSelectedYearStoreBreakdown] =
    useState<string>("");
  const [selectedPeriodStoreBreakdown, setSelectedPeriodStoreBreakdown] =
    useState<string>("");
  const [selectedNameStoreBreakdown, setSelectedNameStoreBreakdown] =
    useState<string>("");
  const [selectedStoreStoreBreakdown, setSelectedStoreStoreBreakdown] =
    useState<string>("");

  // 日付をフォーマット（YYYY-MM-DD → MM/DD/YY）
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${month}/${day}/${year.slice(-2)}`;
  };

  // アーカイブ日時をフォーマット（ISO 8601 → MM/DD/YYYY HH:MM AM/PM または MM/DD/YYYY HH:MM）
  const formatArchivedAt = (archivedAt: string | null): string => {
    if (!archivedAt) return "";
    try {
      const date = new Date(archivedAt);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");

      if (timeFormat === "12h") {
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
      } else {
        // 24h format
        return `${month}/${day}/${year} ${String(hours).padStart(
          2,
          "0"
        )}:${minutes}`;
      }
    } catch (error) {
      console.error("Error formatting archived_at:", error);
      return "";
    }
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

  // タブ切り替え時に前のタブの編集モードをリセット
  useEffect(() => {
    if (activeTab === "tipResultCombine") {
      // Tip Result Combineタブに切り替わったら、Store Breakdownの編集モードをリセット
      setIsEditingStoreBreakdown(false);
      setSelectedRecordsStoreBreakdown({});
      setInitialArchivedRecordIdsStoreBreakdown(new Set());
      setEditingValuesStoreBreakdown({});
      setTipInputsStoreBreakdown(new Map());
      setCashTipInputsStoreBreakdown(new Map());
    } else if (activeTab === "storeBreakdown") {
      // Store Breakdownタブに切り替わったら、Tip Result Combineの編集モードをリセット
      setIsEditingTipResultCombine(false);
      setSelectedRecords({});
      setInitialArchivedRecordIds(new Set());
      setEditingValuesTipResultCombine({});
      setTipInputsTipResultCombine(new Map());
      setCashTipInputsTipResultCombine(new Map());
    }
  }, [activeTab]);

  // データをRecordsの形式に変換（日付フォーマットを変換、showArchivedRecordsに基づいてフィルタリング）
  const Records = useMemo(
    () =>
      records
        .filter((record) => (showArchivedRecords ? true : !record.isArchived))
        .map((record) => ({
          id: record.id,
          periodStart: formatDate(record.periodStart),
          store: record.store,
          name: record.name,
          tips: record.tips,
          cashTips: record.cashTips,
          isArchived: record.isArchived,
          archivedAt: record.archivedAt,
        })),
    [records, showArchivedRecords]
  );

  // 日付ごとにグループ化（Storeは無視）
  const groupedByDate = useMemo(() => {
    const grouped: Record<
      string,
      {
        id: string;
        name: string;
        tips: number;
        cashTips: number;
        isArchived: boolean;
        archivedAt: string | null;
      }[]
    > = {};

    Records.forEach((record) => {
      const date = record.periodStart;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push({
        id: record.id,
        name: record.name,
        tips: record.tips,
        cashTips: record.cashTips,
        isArchived: record.isArchived,
        archivedAt: record.archivedAt,
      });
    });

    return grouped;
  }, [Records]);

  // Tip Result Combine用: フィルターオプションを生成
  const filterOptionsTipResultCombine = useMemo(() => {
    const years = new Set<string>();
    const periods = new Set<string>();
    const names = new Set<string>();

    Records.forEach((record) => {
      // Year: periodStartから年を抽出（MM/DD/YY形式なので、最後の2桁が年）
      const periodParts = record.periodStart.split("/");
      if (periodParts.length === 3) {
        const year = "20" + periodParts[2]; // YY → 20YY
        years.add(year);
      }
      // Period: periodStartをそのまま使用
      if (record.periodStart) {
        periods.add(record.periodStart);
      }
      // Name: nameをそのまま使用
      if (record.name) {
        names.add(record.name);
      }
    });

    return {
      years: Array.from(years).sort((a, b) => b.localeCompare(a)), // 降順
      periods: Array.from(periods).sort(),
      names: Array.from(names).sort(),
    };
  }, [Records]);

  // Tip Result Combine用: フィルタリングされたgroupedByDate
  const filteredGroupedByDate = useMemo(() => {
    // フィルター条件に一致するレコードを抽出
    const filteredRecords = Records.filter((record) => {
      // Yearフィルター
      if (selectedYearTipResultCombine) {
        const periodParts = record.periodStart.split("/");
        if (periodParts.length === 3) {
          const year = "20" + periodParts[2];
          if (year !== selectedYearTipResultCombine) return false;
        } else {
          return false;
        }
      }
      // Periodフィルター
      if (selectedPeriodTipResultCombine) {
        if (record.periodStart !== selectedPeriodTipResultCombine)
          return false;
      }
      // Nameフィルター
      if (selectedNameTipResultCombine) {
        if (record.name !== selectedNameTipResultCombine) return false;
      }
      return true;
    });

    // フィルターされたレコードを日付ごとにグループ化
    const grouped: Record<
      string,
      {
        id: string;
        name: string;
        tips: number;
        cashTips: number;
        isArchived: boolean;
        archivedAt: string | null;
      }[]
    > = {};

    filteredRecords.forEach((record) => {
      const date = record.periodStart;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push({
        id: record.id,
        name: record.name,
        tips: record.tips,
        cashTips: record.cashTips,
        isArchived: record.isArchived,
        archivedAt: record.archivedAt,
      });
    });

    return grouped;
  }, [
    Records,
    selectedYearTipResultCombine,
    selectedPeriodTipResultCombine,
    selectedNameTipResultCombine,
  ]);

  // 各日付の合計を計算（フィルター適用後）
  const getDateTotal = (date: string) => {
    const records = filteredGroupedByDate[date] || [];
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

  // Store Breakdown用: フィルターオプションを生成
  const filterOptionsStoreBreakdown = useMemo(() => {
    const years = new Set<string>();
    const periods = new Set<string>();
    const names = new Set<string>();
    const stores = new Set<string>();

    Records.forEach((record) => {
      // Year: periodStartから年を抽出（MM/DD/YY形式なので、最後の2桁が年）
      const periodParts = record.periodStart.split("/");
      if (periodParts.length === 3) {
        const year = "20" + periodParts[2]; // YY → 20YY
        years.add(year);
      }
      // Period: periodStartをそのまま使用
      if (record.periodStart) {
        periods.add(record.periodStart);
      }
      // Name: nameをそのまま使用
      if (record.name) {
        names.add(record.name);
      }
      // Store: storeをそのまま使用
      if (record.store) {
        stores.add(record.store);
      }
    });

    return {
      years: Array.from(years).sort((a, b) => b.localeCompare(a)), // 降順
      periods: Array.from(periods).sort(),
      names: Array.from(names).sort(),
      stores: Array.from(stores).sort(),
    };
  }, [Records]);

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

    // フィルターを適用
    const filteredRecords = records.filter((record) => {
      // Yearフィルター
      if (selectedYearStoreBreakdown) {
        const periodParts = record.periodStart.split("/");
        if (periodParts.length === 3) {
          const year = "20" + periodParts[2];
          if (year !== selectedYearStoreBreakdown) return false;
        } else {
          return false;
        }
      }
      // Periodフィルター
      if (selectedPeriodStoreBreakdown) {
        if (record.periodStart !== selectedPeriodStoreBreakdown) return false;
      }
      // Nameフィルター
      if (selectedNameStoreBreakdown) {
        if (record.name !== selectedNameStoreBreakdown) return false;
      }
      // Storeフィルター
      if (selectedStoreStoreBreakdown) {
        if (record.store !== selectedStoreStoreBreakdown) return false;
      }
      return true;
    });

    // ソート: 最後にクリックした列を優先
    const sorted = [...filteredRecords].sort((a, b) => {
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
  }, [
    selectedDate,
    storeBreakdownByDate,
    nameSortOrder,
    storeSortOrder,
    selectedYearStoreBreakdown,
    selectedPeriodStoreBreakdown,
    selectedNameStoreBreakdown,
    selectedStoreStoreBreakdown,
  ]);

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

  // Editモードのハンドラー（Tip Result Combine）
  const handleEditTipResultCombine = () => {
    setIsEditingTipResultCombine(true);
    // 既にアーカイブされているレコードをselectedRecordsに初期化
    // Records（フィルタリング済み、表示されているレコードのみ）を使用
    const initialSelectedRecords: Record<string, "delete" | "archive"> = {};
    const archivedIds = new Set<string>();
    const initialEditingValues: Record<
      string,
      { tips: number; cashTips: number }
    > = {};
    Records.forEach((record) => {
      if (record.isArchived) {
        initialSelectedRecords[record.id] = "archive";
        archivedIds.add(record.id);
      }
      // 編集値を初期化（現在の値をコピー）
      initialEditingValues[record.id] = {
        tips: record.tips,
        cashTips: record.cashTips,
      };
    });
    setSelectedRecords(initialSelectedRecords);
    setInitialArchivedRecordIds(archivedIds);
    setEditingValuesTipResultCombine(initialEditingValues);
  };

  const handleCancelEditTipResultCombine = () => {
    setIsEditingTipResultCombine(false);
    setSelectedRecords({});
    setInitialArchivedRecordIds(new Set());
    setEditingValuesTipResultCombine({});
    setTipInputsTipResultCombine(new Map());
    setCashTipInputsTipResultCombine(new Map());
  };

  const handleToggleRecordSelection = (
    recordId: string,
    action: "delete" | "archive"
  ) => {
    setSelectedRecords((prev) => {
      const newSelection = { ...prev };
      const currentAction = newSelection[recordId];

      if (currentAction === action) {
        // 同じアクションを再度クリックした場合は解除
        delete newSelection[recordId];
      } else {
        // 新しいアクションを設定（排他的：既存のアクションを上書き）
        newSelection[recordId] = action;
      }
      return newSelection;
    });
  };

  const handleSaveTipResultCombine = async () => {
    try {
      const deleteIds: string[] = [];
      const archiveIds: string[] = [];
      const unarchiveIds: string[] = [];
      const updatePromises: Promise<any>[] = [];

      Object.entries(selectedRecords).forEach(([id, action]) => {
        if (action === "delete") {
          deleteIds.push(id);
        } else if (action === "archive") {
          archiveIds.push(id);
        }
      });

      // 既にアーカイブされているが、selectedRecordsに"archive"として含まれていない（チェックが外されている）レコードをアーカイブ解除
      // ただし、削除対象のレコードは除外（削除するレコードをアーカイブ解除する必要はない）
      initialArchivedRecordIds.forEach((id) => {
        if (
          selectedRecords[id] !== "archive" &&
          selectedRecords[id] !== "delete"
        ) {
          unarchiveIds.push(id);
        }
      });

      // 編集値が変更されたレコードを更新
      Object.entries(editingValuesTipResultCombine).forEach(([id, values]) => {
        // 削除対象のレコードは更新しない
        if (selectedRecords[id] === "delete") return;

        const originalRecord = Records.find((r) => r.id === id);
        if (!originalRecord) return;

        // 値が変更されているかチェック
        const hasChanged =
          Math.abs(values.tips - originalRecord.tips) > 0.01 ||
          Math.abs(values.cashTips - originalRecord.cashTips) > 0.01;

        if (hasChanged) {
          updatePromises.push(
            api.tips.updateCalculationResult(id, {
              tips: values.tips,
              cash_tips: values.cashTips,
            })
          );
        }
      });

      // 削除、アーカイブ、アーカイブ解除、更新を並列実行
      await Promise.all([
        ...deleteIds.map((id) => api.tips.deleteCalculationResult(id)),
        ...archiveIds.map((id) => api.tips.archiveCalculationResult(id)),
        ...unarchiveIds.map((id) => api.tips.unarchiveCalculationResult(id)),
        ...updatePromises,
      ]);

      // データを再取得
      const response = await api.tips.getRecords();
      if (response.success) {
        setRecords(response.data);
      }

      // Editモードを終了
      setIsEditingTipResultCombine(false);
      setSelectedRecords({});
      setInitialArchivedRecordIds(new Set());
      setEditingValuesTipResultCombine({});
      setTipInputsTipResultCombine(new Map());
      setCashTipInputsTipResultCombine(new Map());
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  // Editモードのハンドラー（Store Breakdown）
  const handleEditStoreBreakdown = () => {
    setIsEditingStoreBreakdown(true);
    // 既にアーカイブされているレコードをselectedRecordsStoreBreakdownに初期化
    // Records（フィルタリング済み、表示されているレコードのみ）を使用
    const initialSelectedRecords: Record<string, "delete" | "archive"> = {};
    const archivedIds = new Set<string>();
    const initialEditingValues: Record<
      string,
      { tips: number; cashTips: number }
    > = {};
    Records.forEach((record) => {
      if (record.isArchived) {
        initialSelectedRecords[record.id] = "archive";
        archivedIds.add(record.id);
      }
      // 編集値を初期化（現在の値をコピー）
      initialEditingValues[record.id] = {
        tips: record.tips,
        cashTips: record.cashTips,
      };
    });
    setSelectedRecordsStoreBreakdown(initialSelectedRecords);
    setInitialArchivedRecordIdsStoreBreakdown(archivedIds);
    setEditingValuesStoreBreakdown(initialEditingValues);
  };

  const handleCancelEditStoreBreakdown = () => {
    setIsEditingStoreBreakdown(false);
    setSelectedRecordsStoreBreakdown({});
    setInitialArchivedRecordIdsStoreBreakdown(new Set());
    setEditingValuesStoreBreakdown({});
    setTipInputsStoreBreakdown(new Map());
    setCashTipInputsStoreBreakdown(new Map());
  };

  const handleToggleRecordSelectionStoreBreakdown = (
    recordId: string,
    action: "delete" | "archive"
  ) => {
    setSelectedRecordsStoreBreakdown((prev) => {
      const newSelection = { ...prev };
      const currentAction = newSelection[recordId];

      if (currentAction === action) {
        // 同じアクションを再度クリックした場合は解除
        delete newSelection[recordId];
      } else {
        // 新しいアクションを設定（排他的：既存のアクションを上書き）
        newSelection[recordId] = action;
      }
      return newSelection;
    });
  };

  const handleSaveStoreBreakdown = async () => {
    try {
      const deleteIds: string[] = [];
      const archiveIds: string[] = [];
      const unarchiveIds: string[] = [];

      Object.entries(selectedRecordsStoreBreakdown).forEach(([id, action]) => {
        if (action === "delete") {
          deleteIds.push(id);
        } else if (action === "archive") {
          archiveIds.push(id);
        }
      });

      // 既にアーカイブされているが、selectedRecordsStoreBreakdownに"archive"として含まれていない（チェックが外されている）レコードをアーカイブ解除
      // ただし、削除対象のレコードは除外（削除するレコードをアーカイブ解除する必要はない）
      initialArchivedRecordIdsStoreBreakdown.forEach((id) => {
        if (
          selectedRecordsStoreBreakdown[id] !== "archive" &&
          selectedRecordsStoreBreakdown[id] !== "delete"
        ) {
          unarchiveIds.push(id);
        }
      });

      // 編集値が変更されたレコードを更新
      const updatePromises: Promise<any>[] = [];
      Object.entries(editingValuesStoreBreakdown).forEach(([id, values]) => {
        // 削除対象のレコードは更新しない
        if (selectedRecordsStoreBreakdown[id] === "delete") return;

        const originalRecord = Records.find((r) => r.id === id);
        if (!originalRecord) return;

        // 値が変更されているかチェック
        const hasChanged =
          Math.abs(values.tips - originalRecord.tips) > 0.01 ||
          Math.abs(values.cashTips - originalRecord.cashTips) > 0.01;

        if (hasChanged) {
          updatePromises.push(
            api.tips.updateCalculationResult(id, {
              tips: values.tips,
              cash_tips: values.cashTips,
            })
          );
        }
      });

      // 削除、アーカイブ、アーカイブ解除、更新を並列実行
      await Promise.all([
        ...deleteIds.map((id) => api.tips.deleteCalculationResult(id)),
        ...archiveIds.map((id) => api.tips.archiveCalculationResult(id)),
        ...unarchiveIds.map((id) => api.tips.unarchiveCalculationResult(id)),
        ...updatePromises,
      ]);

      // データを再取得
      const response = await api.tips.getRecords();
      if (response.success) {
        setRecords(response.data);
      }

      // Editモードを終了
      setIsEditingStoreBreakdown(false);
      setSelectedRecordsStoreBreakdown({});
      setInitialArchivedRecordIdsStoreBreakdown(new Set());
      setEditingValuesStoreBreakdown({});
      setTipInputsStoreBreakdown(new Map());
      setCashTipInputsStoreBreakdown(new Map());
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to save changes. Please try again.");
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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* タブボタンとEditボタン */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
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
          </div>
          {/* Editボタン（Tip Result CombineまたはStore Breakdown） */}
          <div className="flex gap-3">
            {activeTab === "tipResultCombine" ? (
              !isEditingTipResultCombine ? (
                <button
                  onClick={handleEditTipResultCombine}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelEditTipResultCombine}
                    className="px-4 py-2 text-sm rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTipResultCombine}
                    className="px-4 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    Save
                  </button>
                </>
              )
            ) : activeTab === "storeBreakdown" ? (
              !isEditingStoreBreakdown ? (
                <button
                  onClick={handleEditStoreBreakdown}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelEditStoreBreakdown}
                    className="px-4 py-2 text-sm rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveStoreBreakdown}
                    className="px-4 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    Save
                  </button>
                </>
              )
            ) : null}
          </div>
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
                  <select
                    value={selectedYearTipResultCombine}
                    onChange={(e) =>
                      setSelectedYearTipResultCombine(e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {filterOptionsTipResultCombine.years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Period
                  </label>
                  <select
                    value={selectedPeriodTipResultCombine}
                    onChange={(e) =>
                      setSelectedPeriodTipResultCombine(e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {filterOptionsTipResultCombine.periods.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Name
                  </label>
                  <select
                    value={selectedNameTipResultCombine}
                    onChange={(e) =>
                      setSelectedNameTipResultCombine(e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {filterOptionsTipResultCombine.names.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* データ表示カード */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              {Object.keys(filteredGroupedByDate).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No records found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(filteredGroupedByDate)
                    .sort()
                    .map((date) => {
                      const records = filteredGroupedByDate[date];
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
                                Period Start: {date}
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
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Name
                                  </th>
                                  {/* 編集時はDelete/Archive列を表示 */}
                                  {isEditingTipResultCombine && (
                                    <>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Delete
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Archive
                                      </th>
                                    </>
                                  )}
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Tip
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Cash Tip
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {records.map((record, index) => (
                                  <tr key={record.id || index}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      <div className="flex items-center gap-2">
                                        <span>{record.name}</span>
                                        {/* 非編集時のみarchivedAtバッジを表示 */}
                                        {!isEditingTipResultCombine &&
                                          record.isArchived &&
                                          record.archivedAt && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                              {formatArchivedAt(
                                                record.archivedAt
                                              )}
                                            </span>
                                          )}
                                      </div>
                                    </td>
                                    {/* 編集時はDelete/Archiveチェックボックスを表示 */}
                                    {isEditingTipResultCombine && (
                                      <>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                          <input
                                            type="checkbox"
                                            checked={
                                              selectedRecords[record.id] ===
                                              "delete"
                                            }
                                            onChange={() =>
                                              handleToggleRecordSelection(
                                                record.id,
                                                "delete"
                                              )
                                            }
                                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                          />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={
                                                selectedRecords[record.id] ===
                                                "archive"
                                              }
                                              onChange={() =>
                                                handleToggleRecordSelection(
                                                  record.id,
                                                  "archive"
                                                )
                                              }
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            {/* 編集時はArchiveチェックボックスの右側にarchivedAtバッジを表示 */}
                                            {record.isArchived &&
                                              record.archivedAt && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                  {formatArchivedAt(
                                                    record.archivedAt
                                                  )}
                                                </span>
                                              )}
                                          </div>
                                        </td>
                                      </>
                                    )}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {isEditingTipResultCombine ? (
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          value={
                                            tipInputsTipResultCombine.has(
                                              record.id
                                            )
                                              ? tipInputsTipResultCombine.get(
                                                  record.id
                                                )!
                                              : String(
                                                  editingValuesTipResultCombine[
                                                    record.id
                                                  ]?.tips ?? record.tips
                                                )
                                          }
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            // 数字と小数点のみを許可（空文字列も許可）
                                            const numericPattern =
                                              /^(\d+\.?\d*|\.\d+)?$/;
                                            if (numericPattern.test(value)) {
                                              setTipInputsTipResultCombine(
                                                (prev) => {
                                                  const newMap = new Map(prev);
                                                  newMap.set(record.id, value);
                                                  return newMap;
                                                }
                                              );
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const value = e.target.value;
                                            // フォーカスアウト時に数値に変換
                                            const numValue =
                                              value === "" || value === "."
                                                ? 0
                                                : parseFloat(value) || 0;
                                            setEditingValuesTipResultCombine(
                                              (prev) => ({
                                                ...prev,
                                                [record.id]: {
                                                  tips: numValue,
                                                  cashTips:
                                                    prev[record.id]?.cashTips ??
                                                    record.cashTips,
                                                },
                                              })
                                            );
                                            // 入力中の文字列をクリア
                                            setTipInputsTipResultCombine(
                                              (prev) => {
                                                const newMap = new Map(prev);
                                                newMap.delete(record.id);
                                                return newMap;
                                              }
                                            );
                                          }}
                                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      ) : (
                                        `$${record.tips.toFixed(2)}`
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {isEditingTipResultCombine ? (
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          value={
                                            cashTipInputsTipResultCombine.has(
                                              record.id
                                            )
                                              ? cashTipInputsTipResultCombine.get(
                                                  record.id
                                                )!
                                              : String(
                                                  editingValuesTipResultCombine[
                                                    record.id
                                                  ]?.cashTips ??
                                                    record.cashTips
                                                )
                                          }
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            // 数字と小数点のみを許可（空文字列も許可）
                                            const numericPattern =
                                              /^(\d+\.?\d*|\.\d+)?$/;
                                            if (numericPattern.test(value)) {
                                              setCashTipInputsTipResultCombine(
                                                (prev) => {
                                                  const newMap = new Map(prev);
                                                  newMap.set(record.id, value);
                                                  return newMap;
                                                }
                                              );
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const value = e.target.value;
                                            // フォーカスアウト時に数値に変換
                                            const numValue =
                                              value === "" || value === "."
                                                ? 0
                                                : parseFloat(value) || 0;
                                            setEditingValuesTipResultCombine(
                                              (prev) => ({
                                                ...prev,
                                                [record.id]: {
                                                  tips:
                                                    prev[record.id]?.tips ??
                                                    record.tips,
                                                  cashTips: numValue,
                                                },
                                              })
                                            );
                                            // 入力中の文字列をクリア
                                            setCashTipInputsTipResultCombine(
                                              (prev) => {
                                                const newMap = new Map(prev);
                                                newMap.delete(record.id);
                                                return newMap;
                                              }
                                            );
                                          }}
                                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      ) : (
                                        `$${record.cashTips.toFixed(2)}`
                                      )}
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
              )}
            </div>
          </>
        )}

        {/* Store Breakdown タブのコンテンツ */}
        {activeTab === "storeBreakdown" && (
          <>
            {/* フィルターカード */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Year
                  </label>
                  <select
                    value={selectedYearStoreBreakdown}
                    onChange={(e) =>
                      setSelectedYearStoreBreakdown(e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {filterOptionsStoreBreakdown.years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Period
                  </label>
                  <select
                    value={selectedPeriodStoreBreakdown}
                    onChange={(e) =>
                      setSelectedPeriodStoreBreakdown(e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {filterOptionsStoreBreakdown.periods.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Name
                  </label>
                  <select
                    value={selectedNameStoreBreakdown}
                    onChange={(e) =>
                      setSelectedNameStoreBreakdown(e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {filterOptionsStoreBreakdown.names.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Store
                  </label>
                  <select
                    value={selectedStoreStoreBreakdown}
                    onChange={(e) =>
                      setSelectedStoreStoreBreakdown(e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {filterOptionsStoreBreakdown.stores.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
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
                        {/* 編集時はDelete/Archive列を表示 */}
                        {isEditingStoreBreakdown && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Delete
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Archive
                            </th>
                          </>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Period Start
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Tips
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Cash Tips
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredAndGroupedRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={isEditingStoreBreakdown ? 7 : 5}
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
                                <div className="flex items-center gap-2">
                                  <span>{record.name}</span>
                                  {!isEditingStoreBreakdown &&
                                    record.isArchived &&
                                    record.archivedAt && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                        {formatArchivedAt(record.archivedAt)}
                                      </span>
                                    )}
                                </div>
                              </td>
                              {/* 編集時はDelete/Archiveチェックボックスを表示 */}
                              {isEditingStoreBreakdown && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <input
                                      type="checkbox"
                                      checked={
                                        selectedRecordsStoreBreakdown[
                                          record.id
                                        ] === "delete"
                                      }
                                      onChange={() =>
                                        handleToggleRecordSelectionStoreBreakdown(
                                          record.id,
                                          "delete"
                                        )
                                      }
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={
                                          selectedRecordsStoreBreakdown[
                                            record.id
                                          ] === "archive"
                                        }
                                        onChange={() =>
                                          handleToggleRecordSelectionStoreBreakdown(
                                            record.id,
                                            "archive"
                                          )
                                        }
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      {isEditingStoreBreakdown &&
                                        record.isArchived &&
                                        record.archivedAt && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                            {formatArchivedAt(
                                              record.archivedAt
                                            )}
                                          </span>
                                        )}
                                    </div>
                                  </td>
                                </>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.periodStart}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.store}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {isEditingStoreBreakdown ? (
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      tipInputsStoreBreakdown.has(record.id)
                                        ? tipInputsStoreBreakdown.get(
                                            record.id
                                          )!
                                        : String(
                                            editingValuesStoreBreakdown[
                                              record.id
                                            ]?.tips ?? record.tips
                                          )
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // 数字と小数点のみを許可（空文字列も許可）
                                      const numericPattern =
                                        /^(\d+\.?\d*|\.\d+)?$/;
                                      if (numericPattern.test(value)) {
                                        setTipInputsStoreBreakdown((prev) => {
                                          const newMap = new Map(prev);
                                          newMap.set(record.id, value);
                                          return newMap;
                                        });
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const value = e.target.value;
                                      // フォーカスアウト時に数値に変換
                                      const numValue =
                                        value === "" || value === "."
                                          ? 0
                                          : parseFloat(value) || 0;
                                      setEditingValuesStoreBreakdown((prev) => ({
                                        ...prev,
                                        [record.id]: {
                                          tips: numValue,
                                          cashTips:
                                            prev[record.id]?.cashTips ??
                                            record.cashTips,
                                        },
                                      }));
                                      // 入力中の文字列をクリア
                                      setTipInputsStoreBreakdown((prev) => {
                                        const newMap = new Map(prev);
                                        newMap.delete(record.id);
                                        return newMap;
                                      });
                                    }}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  `$${record.tips.toFixed(2)}`
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {isEditingStoreBreakdown ? (
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      cashTipInputsStoreBreakdown.has(
                                        record.id
                                      )
                                        ? cashTipInputsStoreBreakdown.get(
                                            record.id
                                          )!
                                        : String(
                                            editingValuesStoreBreakdown[
                                              record.id
                                            ]?.cashTips ?? record.cashTips
                                          )
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // 数字と小数点のみを許可（空文字列も許可）
                                      const numericPattern =
                                        /^(\d+\.?\d*|\.\d+)?$/;
                                      if (numericPattern.test(value)) {
                                        setCashTipInputsStoreBreakdown(
                                          (prev) => {
                                            const newMap = new Map(prev);
                                            newMap.set(record.id, value);
                                            return newMap;
                                          }
                                        );
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const value = e.target.value;
                                      // フォーカスアウト時に数値に変換
                                      const numValue =
                                        value === "" || value === "."
                                          ? 0
                                          : parseFloat(value) || 0;
                                      setEditingValuesStoreBreakdown((prev) => ({
                                        ...prev,
                                        [record.id]: {
                                          tips:
                                            prev[record.id]?.tips ??
                                            record.tips,
                                          cashTips: numValue,
                                        },
                                      }));
                                      // 入力中の文字列をクリア
                                      setCashTipInputsStoreBreakdown((prev) => {
                                        const newMap = new Map(prev);
                                        newMap.delete(record.id);
                                        return newMap;
                                      });
                                    }}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  `$${record.cashTips.toFixed(2)}`
                                )}
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
