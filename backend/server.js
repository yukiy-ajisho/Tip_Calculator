const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken"); // jsonwebtokenをインポート

const app = express();
const PORT = process.env.PORT || 4000;

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Supabase JWT Secretを環境変数から取得
const jwtSecret = process.env.SUPABASE_JWT_SECRET; // .env に追加する必要あり

app.use(cors());
app.use(express.json());

// JWT検証ミドルウェア（ベストプラクティス版）
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized: No token provided or invalid format" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // JWTを直接検証
    const decoded = jwt.verify(token, jwtSecret);

    // デコードされたトークンからユーザーIDを取得
    // SupabaseのJWTは通常 'sub' クレームにuser_idが入っている
    // req.userにユーザーIDをセット
    req.user = { id: decoded.sub };

    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid or expired token" });
  }
});

// テスト用のAPIエンドポイント
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// ユーザーに紐づくストア一覧取得用APIエンドポイント
app.get("/api/stores", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: No user session" });
  }

  try {
    const { data: stores, error } = await supabase
      .from("store_users")
      .select("stores(*)") // store_usersテーブルを介してstoresテーブルの全カラムを取得
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: error.message });
    }

    // 取得したデータは { stores: { id, name, abbreviation } } の形になっているので整形
    const formattedStores = stores.map((su) => su.stores);

    res.status(200).json(formattedStores);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ストア追加用APIエンドポイント
app.post("/api/stores", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: No user session" });
  }
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

    // 2. store_usersテーブルにユーザーとストアの関連を挿入
    const { error: storeUserError } = await supabase
      .from("store_users")
      .insert([{ store_id: newStore.id, user_id: req.user.id }]);

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
