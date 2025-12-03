const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 4000;

// Supabaseクライアントの初期化（Service Role Key - データベース操作用）
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// CORS設定（本番環境ではFRONTEND_URLを設定）
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ExpressのRequest型を拡張してuser情報を追加
app.use((req, res, next) => {
  req.user = undefined;
  next();
});

// 認証ミドルウェア関数
// Authorizationヘッダーからトークンを取得し、Supabaseで検証
async function authMiddleware(req, res, next) {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7); // "Bearer "を除去

    // トークンが空文字列の場合はエラー
    if (!token || token.trim() === "") {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    // Supabaseクライアントを作成（ANON_KEYを使用してトークンを検証）
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // トークンを検証してユーザー情報を取得
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // リクエストオブジェクトにユーザー情報を追加
    req.user = {
      id: user.id,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

// ルート
// ヘルスチェックエンドポイント（認証不要）
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// 認証が必要なルート
// ユーザーに紐づくストア一覧取得用APIエンドポイント
app.get("/api/stores", authMiddleware, async (req, res) => {
  try {
    const { data: stores, error } = await supabase
      .from("store_users")
      .select("stores(*), role") // store_usersテーブルを介してstoresテーブルの全カラムとroleを取得
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: error.message });
    }

    // 取得したデータは { stores: { id, name, abbreviation }, role: 'owner'|'manager' } の形になっているので整形
    const formattedStores = stores.map((su) => ({
      ...su.stores,
      role: su.role, // role情報を追加
    }));

    res.status(200).json(formattedStores);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ストア追加用APIエンドポイント
app.post("/api/stores", authMiddleware, async (req, res) => {
  const { storeName, storeAbbreviation } = req.body;

  if (!storeName || !storeAbbreviation) {
    return res
      .status(400)
      .json({ error: "Store name and abbreviation are required." });
  }

  try {
    // 1. storesテーブルに新しいストアを挿入
    const { data: newStoreData, error: storeError } = await supabase
      .from("stores")
      .insert([{ name: storeName, abbreviation: storeAbbreviation }])
      .select();

    if (storeError) {
      console.error("Supabase insert store error:", storeError);
      return res.status(500).json({ error: storeError.message });
    }

    const newStore = newStoreData[0];

    // 2. store_usersテーブルにユーザーとストアの関連を挿入（role='owner'）
    const { error: storeUserError } = await supabase
      .from("store_users")
      .insert([{ store_id: newStore.id, user_id: req.user.id, role: "owner" }]);

    if (storeUserError) {
      console.error("Supabase insert store_user error:", storeUserError);
      return res.status(500).json({ error: storeUserError.message });
    }

    res
      .status(201)
      .json({ message: "Store added successfully!", data: newStore });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// 招待コード発行用APIエンドポイント
app.post("/api/stores/:storeId/invite", authMiddleware, async (req, res) => {
  const { storeId } = req.params;

  try {
    // 1. ユーザーがそのストアのオーナーか確認
    const { data: storeUser, error: storeUserError } = await supabase
      .from("store_users")
      .select("role")
      .eq("store_id", storeId)
      .eq("user_id", req.user.id)
      .single();

    if (storeUserError || !storeUser) {
      return res
        .status(404)
        .json({ error: "Store not found or access denied" });
    }

    if (storeUser.role !== "owner") {
      return res
        .status(403)
        .json({ error: "Only owners can generate invitation codes" });
    }

    // 2. ランダムなコードを生成（12文字の英数字）
    const generateCode = () => {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let code = "";
      for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // ユニークなコードを生成（最大10回試行）
    while (!isUnique && attempts < maxAttempts) {
      code = generateCode();
      const { data: existing } = await supabase
        .from("store_invitations")
        .select("id")
        .eq("code", code)
        .single();

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res
        .status(500)
        .json({ error: "Failed to generate unique code. Please try again." });
    }

    // 3. 有効期限を設定（2分後）
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 2);

    // 4. store_invitationsテーブルに保存
    const { data: invitation, error: inviteError } = await supabase
      .from("store_invitations")
      .insert([
        {
          store_id: storeId,
          code: code,
          created_by: req.user.id,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (inviteError) {
      console.error("Supabase insert invitation error:", inviteError);
      return res.status(500).json({ error: inviteError.message });
    }

    res.status(201).json({
      message: "Invitation code generated successfully",
      code: code,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// 招待コード検証・参加用APIエンドポイント
app.post("/api/stores/join", authMiddleware, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Invitation code is required" });
  }

  try {
    const now = new Date();

    // 1. コードが存在し、有効期限内で未使用か確認（条件付きUPDATEで競合を防止）
    // このUPDATEは、used_at IS NULL AND expires_at >= NOW() の場合のみ成功する
    const { data: updatedInvitation, error: updateError } = await supabase
      .from("store_invitations")
      .update({
        used_at: now.toISOString(),
        used_by: req.user.id,
      })
      .eq("code", code)
      .is("used_at", null) // まだ使用されていない場合のみ
      .gte("expires_at", now.toISOString()) // 有効期限内の場合のみ
      .select()
      .single();

    // 2. 更新が失敗した場合（コードが存在しない、既に使用済み、または有効期限切れ）
    if (updateError || !updatedInvitation) {
      // コードが存在するか確認（エラーメッセージを適切にするため）
      const { data: invitation } = await supabase
        .from("store_invitations")
        .select("*")
        .eq("code", code)
        .single();

      if (!invitation) {
        return res.status(404).json({ error: "Invalid invitation code" });
      }

      if (invitation.used_at) {
        // 使用済みコードは削除
        await supabase
          .from("store_invitations")
          .delete()
          .eq("id", invitation.id);
        return res
          .status(400)
          .json({ error: "This invitation code has already been used" });
      }

      // 有効期限切れの場合は削除（自動削除ジョブが実行されていない場合に備えて）
      if (new Date(invitation.expires_at) < now) {
        await supabase
          .from("store_invitations")
          .delete()
          .eq("id", invitation.id);
        return res
          .status(400)
          .json({ error: "This invitation code has expired" });
      }

      // その他の場合（競合など）
      return res
        .status(400)
        .json({ error: "This invitation code has already been used" });
    }

    // 3. 既にそのストアのメンバーか確認
    const { data: existingMember } = await supabase
      .from("store_users")
      .select("id")
      .eq("store_id", updatedInvitation.store_id)
      .eq("user_id", req.user.id)
      .single();

    if (existingMember) {
      // 既にメンバーの場合、コードを削除（used_atは既に設定されているが削除する）
      await supabase
        .from("store_invitations")
        .delete()
        .eq("id", updatedInvitation.id);
      return res
        .status(400)
        .json({ error: "You are already a member of this store" });
    }

    // 4. store_usersテーブルに追加（role='manager'）
    const { error: storeUserError } = await supabase
      .from("store_users")
      .insert([
        {
          store_id: updatedInvitation.store_id,
          user_id: req.user.id,
          role: "manager",
        },
      ]);

    if (storeUserError) {
      console.error("Supabase insert store_user error:", storeUserError);
      // store_usersへの追加に失敗した場合、コードを再度有効化する必要はない
      // （既にused_atが設定されているため）
      return res.status(500).json({ error: storeUserError.message });
    }

    // 5. ストア情報を取得して返す
    const { data: store } = await supabase
      .from("stores")
      .select("*")
      .eq("id", updatedInvitation.store_id)
      .single();

    res.status(200).json({
      message: "Successfully joined the store",
      store: store,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ============================================
// Helper Functions for Working Hours CSV Processing
// ============================================

/**
 * Extract period information from CSV data
 * @param {string[]} csvData - Array of CSV rows
 * @returns {Object} { periodStart: string, periodEnd: string }
 */
function extractPeriodInfo(csvData) {
  // csvData[1] が "Payroll Period,10/27/2025 To 11/09/2025" の形式
  if (!csvData || csvData.length < 2) {
    throw new Error("Invalid CSV format: Missing period information");
  }

  const periodLine = csvData[1];
  // "Payroll Period,10/27/2025 To 11/09/2025" から期間を抽出
  const periodMatch = periodLine.match(
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+To\s+(\d{1,2}\/\d{1,2}\/\d{4})/
  );

  if (!periodMatch) {
    throw new Error("Invalid period format in CSV");
  }

  const periodStart = convertToDate(periodMatch[1]); // "10/27/2025" → "2025-10-27"
  const periodEnd = convertToDate(periodMatch[2]); // "11/09/2025" → "2025-11-09"

  return { periodStart, periodEnd };
}

/**
 * Convert date string to DATE format
 * @param {string} dateString - Date string in format "MM/DD/YYYY"
 * @returns {string} Date string in format "YYYY-MM-DD"
 */
function convertToDate(dateString) {
  const [month, day, year] = dateString.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * Convert month name date string to DATE format
 * @param {string} dateString - Date string in format "October 28 2025"
 * @returns {string} Date string in format "YYYY-MM-DD"
 */
function convertMonthNameToDate(dateString) {
  const monthNames = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  };

  const parts = dateString.trim().split(/\s+/);
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  const month = monthNames[parts[0]];
  const day = parts[1].padStart(2, "0");
  const year = parts[2];

  if (!month) {
    throw new Error(`Invalid month name: ${parts[0]}`);
  }

  return `${year}-${month}-${day}`;
}

/**
 * Convert 12-hour time format to 24-hour TIME format
 * @param {string} timeString - Time string in format "11:14 AM" or "1:50 PM"
 * @returns {string} Time string in format "HH:MM:SS"
 */
function convertTo24HourTime(timeString) {
  if (!timeString || timeString.trim() === "") {
    return null;
  }

  const trimmed = timeString.trim();
  const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

  if (!match) {
    throw new Error(`Invalid time format: ${timeString}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

/**
 * Format working hours data from CSV
 * @param {string[]} csvData - Array of CSV rows
 * @returns {Array} Formatted working hours records
 */
function formatWorkingHoursData(csvData) {
  const formattedData = [];

  // ヘッダー行を特定（"Name,Clock in date,..." を含む行）
  let headerRowIndex = -1;
  for (let i = 0; i < csvData.length; i++) {
    if (csvData[i].includes("Name") && csvData[i].includes("Clock in date")) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Header row not found in CSV");
  }

  // ヘッダー行からカラムインデックスを取得
  const headerRow = csvData[headerRowIndex].split(",");
  const nameIndex = headerRow.indexOf("Name");
  const clockInDateIndex = headerRow.indexOf("Clock in date");
  const clockInTimeIndex = headerRow.indexOf("Clock in time");
  const clockOutDateIndex = headerRow.indexOf("Clock out date");
  const clockOutTimeIndex = headerRow.indexOf("Clock out time");
  const breakStartIndex = headerRow.indexOf("Break start");
  const breakEndIndex = headerRow.indexOf("Break end");
  const roleIndex = headerRow.indexOf("Role");

  // データ行を処理（ヘッダー行の次から）
  let currentName = null;

  for (let i = headerRowIndex + 1; i < csvData.length; i++) {
    const row = csvData[i].split(",");

    // 空行、区切り行、Totals行をスキップ
    const nameValue = row[nameIndex]?.trim() || "";
    if (
      row.length === 0 ||
      row[0].trim() === "" ||
      row[0].trim() === "-" ||
      row[0].trim().startsWith("Totals") ||
      nameValue.startsWith("Totals")
    ) {
      continue;
    }

    // 次のヘッダー行が見つかったら、次の従業員セクションに移る
    if (row[nameIndex] && row[nameIndex].trim() === "Name") {
      currentName = null;
      continue;
    }

    // 従業員名の行（シフトデータがない場合）
    const name = row[nameIndex]?.trim();
    if (name && name !== "" && !row[clockInDateIndex]?.trim()) {
      // nameだけで他のデータがない行も保存する（date, start, end は NULL）
      const employeeName = name;
      formattedData.push({
        name: employeeName,
        date: null,
        start: null,
        end: null,
        role: "",
      });
      currentName = employeeName;
      continue;
    }

    // シフトデータの行
    const clockInDate = row[clockInDateIndex]?.trim();
    const clockInTime = row[clockInTimeIndex]?.trim();
    const clockOutTime = row[clockOutTimeIndex]?.trim();
    const breakStart = row[breakStartIndex]?.trim();
    const breakEnd = row[breakEndIndex]?.trim();
    const role = row[roleIndex]?.trim();

    // 必要なデータがない場合の処理
    if (!clockInDate || !clockInTime || !clockOutTime) {
      // 従業員名だけの行の可能性がある
      const employeeName = name && name !== "" ? name : currentName;
      if (employeeName) {
        // nameだけで他のデータがない行も保存する（date, start, end は NULL）
        formattedData.push({
          name: employeeName,
          date: null,
          start: null,
          end: null,
          role: role || "",
        });
        currentName = employeeName;
      }
      continue;
    }

    // 従業員名を取得（現在の行にない場合は、前回の従業員名を使用）
    const employeeName = name && name !== "" ? name : currentName;
    if (!employeeName) {
      continue;
    }

    // 日付を変換
    const date = convertMonthNameToDate(clockInDate);

    // Break情報がある場合
    if (breakStart && breakEnd && breakStart !== "" && breakEnd !== "") {
      // 2つのレコードに分割
      formattedData.push({
        name: employeeName,
        date: date,
        start: convertTo24HourTime(clockInTime),
        end: convertTo24HourTime(breakStart),
        role: role || "",
      });

      formattedData.push({
        name: employeeName,
        date: date,
        start: convertTo24HourTime(breakEnd),
        end: convertTo24HourTime(clockOutTime),
        role: role || "",
      });
    } else {
      // Break情報がない場合、1つのレコードのまま
      formattedData.push({
        name: employeeName,
        date: date,
        start: convertTo24HourTime(clockInTime),
        end: convertTo24HourTime(clockOutTime),
        role: role || "",
      });
    }

    // 従業員名を更新
    currentName = employeeName;
  }

  // 全レコード生成後、一括してis_complete_on_importを判定
  for (let i = 0; i < formattedData.length; i++) {
    const record = formattedData[i];

    // 完全なレコードの判定: name, date, start, end が全て存在
    const hasName = record.name && record.name.trim() !== "";
    const hasDate = !!record.date;
    const hasStart = !!record.start;
    const hasEnd = !!record.end;

    // !! で明示的にbooleanに変換
    const isComplete = !!(hasName && hasDate && hasStart && hasEnd);

    formattedData[i].is_complete_on_import = isComplete;
  }

  return formattedData;
}

// ============================================
// Helper Functions for Tip CSV Processing
// ============================================

/**
 * Detect Tip CSV format (Toast or Clover)
 * @param {string[]} csvData - Array of CSV rows
 * @returns {string} "toast" or "clover"
 */
function detectTipCsvFormat(csvData) {
  if (!csvData || csvData.length === 0) {
    throw new Error("Invalid CSV: Empty data");
  }

  // ヘッダー行を探す
  const headerRow = csvData[0].toLowerCase();

  if (headerRow.includes("opened")) {
    return "toast";
  } else if (headerRow.includes("order date")) {
    return "clover";
  } else {
    throw new Error("Unknown Tip CSV format: Could not detect Toast or Clover");
  }
}

/**
 * Convert MM/DD/YY format to DATE format (YYYY-MM-DD)
 * @param {string} dateString - Date string in format "MM/DD/YY"
 * @returns {string} Date string in format "YYYY-MM-DD"
 */
function convertTipDateToDate(dateString) {
  const [month, day, year] = dateString.split("/");
  // YY形式の年をYYYY形式に変換（20XX年を想定）
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * Convert time string (HH:MM) to TIME format (HH:MM:SS)
 * @param {string} timeString - Time string in format "HH:MM"
 * @returns {string} Time string in format "HH:MM:SS"
 */
function convertTimeToTime(timeString) {
  if (!timeString || timeString.trim() === "") {
    return null;
  }
  // HH:MM形式をHH:MM:SS形式に変換
  return `${timeString.trim()}:00`;
}

/**
 * Format Toast Tip CSV data
 * @param {string[]} csvData - Array of CSV rows
 * @returns {Array} Formatted tip data records
 */
function formatToastTipData(csvData) {
  const formattedData = [];

  // ヘッダー行を特定
  let headerRowIndex = -1;
  for (let i = 0; i < csvData.length; i++) {
    if (csvData[i].toLowerCase().includes("opened")) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Header row not found in Toast Tip CSV");
  }

  // ヘッダー行からカラムインデックスを取得
  const headerRow = csvData[headerRowIndex].split(",");
  const openedIndex = headerRow.findIndex(
    (col) => col.toLowerCase().trim() === "opened"
  );
  const tipIndex = headerRow.findIndex(
    (col) => col.toLowerCase().trim() === "tip"
  );

  if (openedIndex === -1 || tipIndex === -1) {
    throw new Error("Required columns not found in Toast Tip CSV");
  }

  // データ行を処理
  for (let i = headerRowIndex + 1; i < csvData.length; i++) {
    const row = csvData[i].split(",");

    // 空行をスキップ
    if (row.length === 0 || row[0].trim() === "") {
      continue;
    }

    const openedValue = row[openedIndex]?.trim();
    const tipValue = row[tipIndex]?.trim();

    if (!openedValue || !tipValue) {
      continue;
    }

    // "10/19/25 16:21" 形式を分割
    const openedParts = openedValue.split(/\s+/);
    if (openedParts.length < 2) {
      continue;
    }

    const orderDateStr = openedParts[0]; // "10/19/25"
    const paymentTimeStr = openedParts[1]; // "16:21"

    // 日付と時刻を変換
    const orderDate = convertTipDateToDate(orderDateStr);
    const paymentTime = convertTimeToTime(paymentTimeStr);

    formattedData.push({
      order_date: orderDate,
      payment_time: paymentTime,
      tips: tipValue,
    });
  }

  return formattedData;
}

/**
 * Format Clover Tip CSV data
 * @param {string[]} csvData - Array of CSV rows
 * @returns {Array} Formatted tip data records
 */
function formatCloverTipData(csvData) {
  const formattedData = [];

  // ヘッダー行を特定
  let headerRowIndex = -1;
  for (let i = 0; i < csvData.length; i++) {
    if (csvData[i].toLowerCase().includes("order date")) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Header row not found in Clover Tip CSV");
  }

  // ヘッダー行からカラムインデックスを取得
  const headerRow = csvData[headerRowIndex].split(",");
  const orderDateIndex = headerRow.findIndex(
    (col) => col.toLowerCase().trim() === "order date"
  );
  const tipIndex = headerRow.findIndex(
    (col) => col.toLowerCase().trim() === "tip"
  );

  if (orderDateIndex === -1 || tipIndex === -1) {
    throw new Error("Required columns not found in Clover Tip CSV");
  }

  // 月名を数値に変換するマップ
  const monthNames = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  // データ行を処理
  for (let i = headerRowIndex + 1; i < csvData.length; i++) {
    const row = csvData[i].split(",");

    // 空行をスキップ
    if (row.length === 0 || row[0].trim() === "") {
      continue;
    }

    const orderDateValue = row[orderDateIndex]?.trim();
    const tipValue = row[tipIndex]?.trim();

    if (!orderDateValue || !tipValue) {
      continue;
    }

    // "02-Nov-2025 08:09 PM PST" 形式を分割
    const orderDateParts = orderDateValue.split(/\s+/);
    if (orderDateParts.length < 3) {
      continue;
    }

    const datePart = orderDateParts[0]; // "02-Nov-2025"
    const timePart = orderDateParts[1]; // "08:09"
    const periodPart = orderDateParts[2]?.toUpperCase(); // "PM"

    // 日付を変換 "02-Nov-2025" → "11/02/25" → "2025-11-02"
    const dateMatch = datePart.match(/(\d{2})-(\w{3})-(\d{4})/);
    if (!dateMatch) {
      continue;
    }

    const day = dateMatch[1];
    const monthName = dateMatch[2];
    const year = dateMatch[3];

    const month = monthNames[monthName];
    if (!month) {
      continue;
    }

    const orderDate = `${year}-${month}-${day}`;

    // 時刻を24時間形式に変換 "08:09 PM" → "20:09:00"
    let paymentTime = null;
    if (timePart && periodPart) {
      const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2];

        if (periodPart === "PM" && hours !== 12) {
          hours += 12;
        } else if (periodPart === "AM" && hours === 12) {
          hours = 0;
        }

        paymentTime = `${hours.toString().padStart(2, "0")}:${minutes}:00`;
      }
    }

    formattedData.push({
      order_date: orderDate,
      payment_time: paymentTime,
      tips: tipValue,
    });
  }

  return formattedData;
}

/**
 * Format Tip CSV data (unified entry point)
 * @param {string[]} csvData - Array of CSV rows
 * @returns {Array} Formatted tip data records
 */
function formatTipData(csvData) {
  const format = detectTipCsvFormat(csvData);

  if (format === "toast") {
    return formatToastTipData(csvData);
  } else if (format === "clover") {
    return formatCloverTipData(csvData);
  } else {
    throw new Error(`Unknown format: ${format}`);
  }
}

// ============================================
// API Endpoints for Tip Calculation
// ============================================

// POST /api/tips/format-working-hours
app.post("/api/tips/format-working-hours", authMiddleware, async (req, res) => {
  const { stores_id, csvData } = req.body;

  if (!stores_id || !csvData) {
    return res
      .status(400)
      .json({ error: "stores_id and csvData are required" });
  }

  try {
    // 1. 期間情報を抽出（2行目から）
    const periodInfo = extractPeriodInfo(csvData);

    // 2. tip_calculationsテーブルに期間情報を保存（status: "processing"）
    const { data: calculation, error: calcError } = await supabase
      .from("tip_calculations")
      .insert({
        stores_id: stores_id,
        period_start: periodInfo.periodStart,
        period_end: periodInfo.periodEnd,
        status: "processing",
      })
      .select()
      .single();

    if (calcError) {
      console.error("Supabase insert error:", calcError);
      throw new Error(`Failed to save period info: ${calcError.message}`);
    }

    const calculationId = calculation.id;

    // 3. CSVデータを整形
    const formattedData = formatWorkingHoursData(csvData);

    // 4. formatted_working_hoursテーブルに保存
    if (formattedData.length > 0) {
      const insertData = formattedData.map((record) => ({
        stores_id: stores_id,
        name: record.name,
        date: record.date || null,
        start: record.start || null,
        end: record.end || null, // "end" is a reserved keyword, so it's quoted
        role: record.role || "",
        is_complete_on_import: record.is_complete_on_import || false,
      }));

      const { error: insertError } = await supabase
        .from("formatted_working_hours")
        .insert(insertData);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(`Failed to save working hours: ${insertError.message}`);
      }
    }

    // 5. 成功ステータスのみ返す（データは返さない）
    res.status(200).json({
      success: true,
      calculationId,
    });
  } catch (error) {
    console.error("Error formatting working hours:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tips/formatted-working-hours
app.get(
  "/api/tips/formatted-working-hours",
  authMiddleware,
  async (req, res) => {
    try {
      // 1. ユーザーが権限を持つ店を取得（store_usersテーブルから）
      const { data: storeUsers, error: storeUsersError } = await supabase
        .from("store_users")
        .select("store_id")
        .eq("user_id", req.user.id);

      if (storeUsersError) {
        console.error("Supabase select store_users error:", storeUsersError);
        throw new Error(
          `Failed to fetch user stores: ${storeUsersError.message}`
        );
      }

      if (!storeUsers || storeUsers.length === 0) {
        // ユーザーが権限を持つ店がない場合は空配列を返す
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      // 2. ユーザーが権限を持つ店のIDのリストを作成
      const storeIds = storeUsers.map((su) => su.store_id);

      // 3. その店のIDで formatted_working_hours からデータを取得
      // データが存在する場合、それは必ず一店舗分のデータセットのみ
      const { data, error } = await supabase
        .from("formatted_working_hours")
        .select("*")
        .in("stores_id", storeIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase select formatted_working_hours error:", error);
        throw new Error(`Failed to fetch working hours: ${error.message}`);
      }

      // データが存在しない場合は空配列を返す
      res.status(200).json({
        success: true,
        data: data || [],
      });
    } catch (error) {
      console.error("Error fetching formatted working hours:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/tips/format-tip-data
app.post("/api/tips/format-tip-data", authMiddleware, async (req, res) => {
  const { stores_id, csvData } = req.body;

  if (!stores_id || !csvData) {
    return res
      .status(400)
      .json({ error: "stores_id and csvData are required" });
  }

  try {
    // 1. CSVデータを整形
    const formattedData = formatTipData(csvData);

    // 2. formatted_tip_dataテーブルに保存
    if (formattedData.length > 0) {
      const insertData = formattedData.map((record) => ({
        stores_id: stores_id,
        order_date: record.order_date,
        payment_time: record.payment_time || null,
        tips: record.tips,
      }));

      const { error: insertError } = await supabase
        .from("formatted_tip_data")
        .insert(insertData);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(`Failed to save tip data: ${insertError.message}`);
      }
    }

    // 3. 成功ステータスのみ返す（データは返さない）
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Error formatting tip data:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tips/formatted-tip-data
app.get("/api/tips/formatted-tip-data", authMiddleware, async (req, res) => {
  try {
    // 1. ユーザーが権限を持つ店を取得（store_usersテーブルから）
    const { data: storeUsers, error: storeUsersError } = await supabase
      .from("store_users")
      .select("store_id")
      .eq("user_id", req.user.id);

    if (storeUsersError) {
      console.error("Supabase select store_users error:", storeUsersError);
      throw new Error(
        `Failed to fetch user stores: ${storeUsersError.message}`
      );
    }

    if (!storeUsers || storeUsers.length === 0) {
      // ユーザーが権限を持つ店がない場合は空配列を返す
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // 2. ユーザーが権限を持つ店のIDのリストを作成
    const storeIds = storeUsers.map((su) => su.store_id);

    // 3. その店のIDで formatted_tip_data からデータを取得
    // データが存在する場合、それは必ず一店舗分のデータセットのみ
    const { data, error } = await supabase
      .from("formatted_tip_data")
      .select("*")
      .in("stores_id", storeIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase select formatted_tip_data error:", error);
      throw new Error(`Failed to fetch tip data: ${error.message}`);
    }

    // データが存在しない場合は空配列を返す
    res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Error fetching formatted tip data:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Format Cash Tip data from CsvTextPasteInput
 * @param {Array} data - Array of objects with Date and Cash Tips properties
 * @returns {Array} Formatted cash tip data records
 */
function formatCashTipData(data) {
  const formattedData = [];

  for (const row of data) {
    const dateValue = row.Date?.trim();
    const cashTipsValue = row["Cash Tips"]?.trim();

    // Date と Cash Tips の両方が存在する場合のみ処理
    if (!dateValue || !cashTipsValue) {
      continue;
    }

    // 日付を変換 (MM/DD/YY → YYYY-MM-DD)
    const date = convertTipDateToDate(dateValue);

    // 数値として検証
    const cashTips = parseFloat(cashTipsValue);
    if (isNaN(cashTips)) {
      continue; // 無効な数値はスキップ
    }

    formattedData.push({
      date: date,
      cash_tips: cashTipsValue, // 文字列として保存（NUMERIC型）
    });
  }

  return formattedData;
}

// POST /api/tips/format-cash-tip
app.post("/api/tips/format-cash-tip", authMiddleware, async (req, res) => {
  const { stores_id, data } = req.body;

  if (!stores_id || !data) {
    return res.status(400).json({ error: "stores_id and data are required" });
  }

  try {
    // 1. データを整形
    const formattedData = formatCashTipData(data);

    // 2. formatted_cash_tipテーブルに保存
    if (formattedData.length > 0) {
      const insertData = formattedData.map((record) => ({
        stores_id: stores_id,
        date: record.date,
        cash_tips: record.cash_tips,
      }));

      const { error: insertError } = await supabase
        .from("formatted_cash_tip")
        .insert(insertData);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(`Failed to save cash tip data: ${insertError.message}`);
      }
    }

    // 3. 成功ステータスのみ返す（データは返さない）
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Error formatting cash tip data:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tips/formatted-cash-tip
app.get("/api/tips/formatted-cash-tip", authMiddleware, async (req, res) => {
  try {
    // 1. ユーザーが権限を持つ店を取得（store_usersテーブルから）
    const { data: storeUsers, error: storeUsersError } = await supabase
      .from("store_users")
      .select("store_id")
      .eq("user_id", req.user.id);

    if (storeUsersError) {
      console.error("Supabase select store_users error:", storeUsersError);
      throw new Error(
        `Failed to fetch user stores: ${storeUsersError.message}`
      );
    }

    if (!storeUsers || storeUsers.length === 0) {
      // ユーザーが権限を持つ店がない場合は空配列を返す
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // 2. ユーザーが権限を持つ店のIDのリストを作成
    const storeIds = storeUsers.map((su) => su.store_id);

    // 3. その店のIDで formatted_cash_tip からデータを取得
    // データが存在する場合、それは必ず一店舗分のデータセットのみ
    const { data, error } = await supabase
      .from("formatted_cash_tip")
      .select("*")
      .in("stores_id", storeIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase select formatted_cash_tip error:", error);
      throw new Error(`Failed to fetch cash tip data: ${error.message}`);
    }

    // データが存在しない場合は空配列を返す
    res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Error fetching formatted cash tip data:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Role Mapping API ====================

// Get role mappings for a store
app.get("/api/role-mappings", authMiddleware, async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: "storeId is required" });
    }

    // Verify user has access to this store
    const { data: storeUser, error: storeUserError } = await supabase
      .from("store_users")
      .select("*")
      .eq("store_id", storeId)
      .eq("user_id", req.user.id)
      .single();

    if (storeUserError || !storeUser) {
      return res
        .status(404)
        .json({ error: "Store not found or access denied" });
    }

    // Get role mappings
    const { data: roleMappings, error } = await supabase
      .from("role_mappings")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase select role_mappings error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(roleMappings || []);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Add new role mapping
app.post("/api/role-mappings", authMiddleware, async (req, res) => {
  try {
    const {
      storeId,
      roleName,
      actualRoleName,
      traineeRoleName,
      traineePercentage,
    } = req.body;

    if (!storeId || !roleName) {
      return res
        .status(400)
        .json({ error: "storeId and roleName are required" });
    }

    // Verify user has access to this store
    const { data: storeUser, error: storeUserError } = await supabase
      .from("store_users")
      .select("*")
      .eq("store_id", storeId)
      .eq("user_id", req.user.id)
      .single();

    if (storeUserError || !storeUser) {
      return res
        .status(404)
        .json({ error: "Store not found or access denied" });
    }

    // Check for duplicate role_name (Standard Role Group)
    const { data: existingByRoleName } = await supabase
      .from("role_mappings")
      .select("*")
      .eq("store_id", storeId)
      .eq("role_name", roleName)
      .maybeSingle();

    if (existingByRoleName) {
      return res.status(400).json({
        error: `Standard Role Group "${roleName}" already exists.`,
      });
    }

    // Check for duplicate actual_role_name (if provided)
    if (actualRoleName) {
      const { data: existingByActualName } = await supabase
        .from("role_mappings")
        .select("*")
        .eq("store_id", storeId)
        .eq("actual_role_name", actualRoleName)
        .maybeSingle();

      if (existingByActualName) {
        return res.status(400).json({
          error: `Actual Role Name "${actualRoleName}" already exists.`,
        });
      }
    }

    // Check for duplicate trainee_role_name (if provided)
    if (traineeRoleName) {
      const { data: existingByTraineeName } = await supabase
        .from("role_mappings")
        .select("*")
        .eq("store_id", storeId)
        .eq("trainee_role_name", traineeRoleName)
        .maybeSingle();

      if (existingByTraineeName) {
        return res.status(400).json({
          error: `Trainee Actual Role Name "${traineeRoleName}" already exists.`,
        });
      }
    }

    // Insert new role mapping
    const { data: newRoleMapping, error } = await supabase
      .from("role_mappings")
      .insert([
        {
          store_id: storeId,
          role_name: roleName,
          actual_role_name: actualRoleName || null,
          trainee_role_name: traineeRoleName || null,
          trainee_percentage: traineePercentage || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert role_mappings error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(newRoleMapping);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Update role mapping
app.put("/api/role-mappings/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName, actualRoleName, traineeRoleName, traineePercentage } =
      req.body;

    // Get existing role mapping
    const { data: existingRoleMapping, error: fetchError } = await supabase
      .from("role_mappings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingRoleMapping) {
      return res.status(404).json({ error: "Role mapping not found" });
    }

    // Verify user has access to this store
    const { data: storeUser, error: storeUserError } = await supabase
      .from("store_users")
      .select("*")
      .eq("store_id", existingRoleMapping.store_id)
      .eq("user_id", req.user.id)
      .single();

    if (storeUserError || !storeUser) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update role mapping
    const { data: updatedRoleMapping, error } = await supabase
      .from("role_mappings")
      .update({
        role_name: roleName,
        actual_role_name: actualRoleName || null,
        trainee_role_name: traineeRoleName || null,
        trainee_percentage: traineePercentage || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update role_mappings error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(updatedRoleMapping);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Delete role mapping
app.delete("/api/role-mappings/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing role mapping
    const { data: existingRoleMapping, error: fetchError } = await supabase
      .from("role_mappings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingRoleMapping) {
      return res.status(404).json({ error: "Role mapping not found" });
    }

    // Verify user has access to this store
    const { data: storeUser, error: storeUserError } = await supabase
      .from("store_users")
      .select("*")
      .eq("store_id", existingRoleMapping.store_id)
      .eq("user_id", req.user.id)
      .single();

    if (storeUserError || !storeUser) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if role is used in tip pool
    const { data: rolePercentages, error: rolePercentageError } = await supabase
      .from("role_percentage")
      .select("id")
      .eq("role_mapping_id", id);

    if (rolePercentageError) {
      console.error(
        "Supabase select role_percentage error:",
        rolePercentageError
      );
      return res.status(500).json({ error: rolePercentageError.message });
    }

    if (rolePercentages && rolePercentages.length > 0) {
      return res.status(400).json({
        error: "Cannot delete. This role is used in Tip Pool Distribution.",
      });
    }

    // Delete role mapping
    const { error } = await supabase
      .from("role_mappings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete role_mappings error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: "Role mapping deleted successfully" });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ==================== Tip Pool Distribution API ====================

// Get tip pool distribution for a store
app.get("/api/tip-pool", authMiddleware, async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: "storeId is required" });
    }

    // Verify user has access to this store
    const { data: storeUser, error: storeUserError } = await supabase
      .from("store_users")
      .select("*")
      .eq("store_id", storeId)
      .eq("user_id", req.user.id)
      .single();

    if (storeUserError || !storeUser) {
      return res
        .status(404)
        .json({ error: "Store not found or access denied" });
    }

    // Get role percentages with role mappings
    const { data: rolePercentages, error } = await supabase
      .from("role_percentage")
      .select("*, role_mappings!inner(*)")
      .eq("role_mappings.store_id", storeId)
      .order("distribution_grouping", { ascending: true });

    if (error) {
      console.error("Supabase select role_percentage error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(rolePercentages || []);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Add role to tip pool
app.post("/api/tip-pool/add-role", authMiddleware, async (req, res) => {
  try {
    const { storeId, roleMappingId } = req.body;

    if (!storeId || !roleMappingId) {
      return res
        .status(400)
        .json({ error: "storeId and roleMappingId are required" });
    }

    // Verify user has access to this store
    const { data: storeUser, error: storeUserError } = await supabase
      .from("store_users")
      .select("*")
      .eq("store_id", storeId)
      .eq("user_id", req.user.id)
      .single();

    if (storeUserError || !storeUser) {
      return res
        .status(404)
        .json({ error: "Store not found or access denied" });
    }

    // Verify role mapping exists and belongs to this store
    const { data: roleMapping, error: roleMappingError } = await supabase
      .from("role_mappings")
      .select("*")
      .eq("id", roleMappingId)
      .eq("store_id", storeId)
      .single();

    if (roleMappingError || !roleMapping) {
      return res.status(404).json({ error: "Role mapping not found" });
    }

    // Check if role is already in tip pool
    const { data: existingRolePercentage } = await supabase
      .from("role_percentage")
      .select("id")
      .eq("role_mapping_id", roleMappingId)
      .limit(1);

    if (existingRolePercentage && existingRolePercentage.length > 0) {
      return res.status(400).json({ error: "Role is already in tip pool" });
    }

    // Get all role mappings currently in tip pool for this store
    const { data: currentRoleMappingsInPool } = await supabase
      .from("role_percentage")
      .select("role_mapping_id, role_mappings!inner(store_id)")
      .eq("role_mappings.store_id", storeId);

    const uniqueRoleMappingIds = [
      ...new Set(currentRoleMappingsInPool.map((rp) => rp.role_mapping_id)),
    ];

    // Get existing distribution groups
    const { data: existingGroups } = await supabase
      .from("role_percentage")
      .select(
        "distribution_grouping, role_mapping_id, percentage, role_mappings!inner(store_id)"
      )
      .eq("role_mappings.store_id", storeId)
      .order("distribution_grouping", { ascending: true });

    // Group by distribution_grouping
    const groupedPatterns = {};
    if (existingGroups) {
      existingGroups.forEach((rp) => {
        if (!groupedPatterns[rp.distribution_grouping]) {
          groupedPatterns[rp.distribution_grouping] = {};
        }
        groupedPatterns[rp.distribution_grouping][rp.role_mapping_id] =
          rp.percentage;
      });
    }

    // Add new role with percentage=0 to existing groups
    const newRecords = [];
    Object.keys(groupedPatterns).forEach((groupNum) => {
      newRecords.push({
        role_mapping_id: roleMappingId,
        percentage: 0,
        distribution_grouping: parseInt(groupNum),
      });
    });

    // Generate new patterns with the new role
    const allRoleMappingIds = [...uniqueRoleMappingIds, roleMappingId];
    const n = allRoleMappingIds.length;

    // Generate all possible patterns (2^n - 1)
    const newPatterns = [];
    for (let i = 1; i < Math.pow(2, n); i++) {
      const pattern = {};
      let hasNonZero = false;

      for (let j = 0; j < n; j++) {
        if ((i & (1 << j)) !== 0) {
          pattern[allRoleMappingIds[j]] = -1; // Placeholder for non-zero
          hasNonZero = true;
        } else {
          pattern[allRoleMappingIds[j]] = 0;
        }
      }

      if (hasNonZero) {
        newPatterns.push(pattern);
      }
    }

    // Check if pattern already exists in existing groups
    const newUniquePatterns = newPatterns.filter((newPattern) => {
      return !Object.values(groupedPatterns).some((existingPattern) => {
        return allRoleMappingIds.every((rmId) => {
          const newVal = newPattern[rmId];
          const existingVal = existingPattern[rmId] || 0;

          if (newVal === 0 && existingVal === 0) return true;
          if (newVal === -1 && existingVal > 0) return true;
          return false;
        });
      });
    });

    // Assign actual percentages to new patterns
    // For patterns with only one role > 0, set to 100
    // For patterns with multiple roles > 0, set default values
    newUniquePatterns.forEach((pattern) => {
      const nonZeroRoles = Object.entries(pattern).filter(
        ([_, val]) => val === -1
      );
      if (nonZeroRoles.length === 1) {
        pattern[nonZeroRoles[0][0]] = 100;
      } else {
        // Default: distribute equally
        const equalShare = Math.floor(100 / nonZeroRoles.length);
        let remainder = 100 - equalShare * nonZeroRoles.length;
        nonZeroRoles.forEach(([rmId], index) => {
          pattern[rmId] = equalShare + (index === 0 ? remainder : 0);
        });
      }
    });

    // Create new records for new unique patterns
    const maxGroup = Math.max(
      ...Object.keys(groupedPatterns).map((g) => parseInt(g)),
      0
    );
    newUniquePatterns.forEach((pattern, index) => {
      const groupNum = maxGroup + index + 1;
      allRoleMappingIds.forEach((rmId) => {
        newRecords.push({
          role_mapping_id: rmId,
          percentage: pattern[rmId],
          distribution_grouping: groupNum,
        });
      });
    });

    // Insert all new records
    if (newRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("role_percentage")
        .insert(newRecords);

      if (insertError) {
        console.error("Supabase insert role_percentage error:", insertError);
        return res.status(500).json({ error: insertError.message });
      }
    }

    // Renumber distribution_grouping to be sequential
    await renumberDistributionGrouping(storeId);

    res.status(201).json({ message: "Role added to tip pool successfully" });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Remove role from tip pool
app.delete("/api/tip-pool/remove-role", authMiddleware, async (req, res) => {
  try {
    const { storeId, roleMappingId } = req.body;

    if (!storeId || !roleMappingId) {
      return res
        .status(400)
        .json({ error: "storeId and roleMappingId are required" });
    }

    // Verify user has access to this store
    const { data: storeUser, error: storeUserError } = await supabase
      .from("store_users")
      .select("*")
      .eq("store_id", storeId)
      .eq("user_id", req.user.id)
      .single();

    if (storeUserError || !storeUser) {
      return res
        .status(404)
        .json({ error: "Store not found or access denied" });
    }

    // Get groups where this role has percentage > 0
    const { data: rolePercentages, error: fetchError } = await supabase
      .from("role_percentage")
      .select(
        "distribution_grouping, percentage, role_mappings!inner(store_id)"
      )
      .eq("role_mapping_id", roleMappingId)
      .eq("role_mappings.store_id", storeId);

    if (fetchError) {
      console.error("Supabase select role_percentage error:", fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!rolePercentages || rolePercentages.length === 0) {
      return res.status(404).json({ error: "Role not found in tip pool" });
    }

    // Identify groups to delete completely (where role percentage > 0)
    const groupsToDelete = rolePercentages
      .filter((rp) => rp.percentage > 0)
      .map((rp) => rp.distribution_grouping);

    // Delete all records in those groups
    if (groupsToDelete.length > 0) {
      // First, get all role_mapping_ids for this store
      const { data: roleMappingsInStore, error: rmError } = await supabase
        .from("role_mappings")
        .select("id")
        .eq("store_id", storeId);

      if (rmError) {
        console.error("Supabase select role_mappings error:", rmError);
        return res.status(500).json({ error: rmError.message });
      }

      const roleMappingIds = roleMappingsInStore.map((rm) => rm.id);

      // Delete all records in those groups for all roles in this store
      const { error: deleteGroupsError } = await supabase
        .from("role_percentage")
        .delete()
        .in("distribution_grouping", groupsToDelete)
        .in("role_mapping_id", roleMappingIds);

      if (deleteGroupsError) {
        console.error(
          "Supabase delete role_percentage groups error:",
          deleteGroupsError
        );
        return res.status(500).json({ error: deleteGroupsError.message });
      }
    }

    // Delete all records for this role (including percentage = 0)
    const { error: deleteRoleError } = await supabase
      .from("role_percentage")
      .delete()
      .eq("role_mapping_id", roleMappingId);

    if (deleteRoleError) {
      console.error("Supabase delete role_percentage error:", deleteRoleError);
      return res.status(500).json({ error: deleteRoleError.message });
    }

    // Renumber distribution_grouping to be sequential
    await renumberDistributionGrouping(storeId);

    res
      .status(200)
      .json({ message: "Role removed from tip pool successfully" });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Update tip pool distribution
app.put("/api/tip-pool", authMiddleware, async (req, res) => {
  try {
    const { storeId, patterns } = req.body;

    if (!storeId || !patterns || !Array.isArray(patterns)) {
      return res
        .status(400)
        .json({ error: "storeId and patterns array are required" });
    }

    // Verify user has access to this store
    const { data: storeUser, error: storeUserError } = await supabase
      .from("store_users")
      .select("*")
      .eq("store_id", storeId)
      .eq("user_id", req.user.id)
      .single();

    if (storeUserError || !storeUser) {
      return res
        .status(404)
        .json({ error: "Store not found or access denied" });
    }

    // Validate patterns
    for (const pattern of patterns) {
      const total = pattern.percentages.reduce(
        (sum, p) => sum + p.percentage,
        0
      );
      if (total !== 100) {
        return res.status(400).json({
          error: `Total percentage must be 100% for pattern ${pattern.distribution_grouping}`,
        });
      }
    }

    // Check for duplicate patterns
    const patternSignatures = patterns.map((pattern) => {
      const sorted = pattern.percentages
        .map((p) => `${p.role_mapping_id}:${p.percentage}`)
        .sort()
        .join(",");
      return sorted;
    });

    const uniqueSignatures = new Set(patternSignatures);
    if (uniqueSignatures.size !== patternSignatures.length) {
      return res
        .status(400)
        .json({ error: "Duplicate patterns are not allowed" });
    }

    // Update percentages
    for (const pattern of patterns) {
      for (const { role_mapping_id, percentage } of pattern.percentages) {
        const { error: updateError } = await supabase
          .from("role_percentage")
          .update({ percentage })
          .eq("role_mapping_id", role_mapping_id)
          .eq("distribution_grouping", pattern.distribution_grouping);

        if (updateError) {
          console.error("Supabase update role_percentage error:", updateError);
          return res.status(500).json({ error: updateError.message });
        }
      }
    }

    res
      .status(200)
      .json({ message: "Tip pool distribution updated successfully" });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Helper function to renumber distribution_grouping sequentially
async function renumberDistributionGrouping(storeId) {
  try {
    // Get all distinct distribution_grouping values for this store
    const { data: allGroups } = await supabase
      .from("role_percentage")
      .select("distribution_grouping, role_mappings!inner(store_id)")
      .eq("role_mappings.store_id", storeId)
      .order("distribution_grouping", { ascending: true });

    if (!allGroups || allGroups.length === 0) return;

    const uniqueGroups = [
      ...new Set(allGroups.map((g) => g.distribution_grouping)),
    ];

    // Create mapping from old to new group numbers
    const groupMapping = {};
    uniqueGroups.forEach((oldGroup, index) => {
      groupMapping[oldGroup] = index + 1;
    });

    // Update in batches by old group number
    for (const [oldGroup, newGroup] of Object.entries(groupMapping)) {
      if (parseInt(oldGroup) === newGroup) continue; // Skip if already correct

      // Get all role_mapping_ids for this store
      const { data: storeRoleMappings } = await supabase
        .from("role_mappings")
        .select("id")
        .eq("store_id", storeId);

      const roleMappingIds = storeRoleMappings.map((rm) => rm.id);

      // Update all records with this distribution_grouping and store's role_mapping_ids
      const { error: updateError } = await supabase
        .from("role_percentage")
        .update({ distribution_grouping: newGroup })
        .eq("distribution_grouping", parseInt(oldGroup))
        .in("role_mapping_id", roleMappingIds);

      if (updateError) {
        console.error(
          "Supabase update distribution_grouping error:",
          updateError
        );
      }
    }
  } catch (err) {
    console.error("Renumber distribution_grouping error:", err);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
