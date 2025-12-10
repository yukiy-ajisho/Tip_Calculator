const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { createClient } = require("@supabase/supabase-js");

// Load env: prefer backend/.env, fallback to repo root .env
const envPaths = [
  path.join(__dirname, "..", ".env"),
  path.join(__dirname, "..", "..", ".env"),
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    require("dotenv").config({ path: p });
    break;
  }
}

const PORT = process.env.TEST_PORT || "5001";
const BASE_URL = `http://localhost:${PORT}`;
let TEST_USER_ID = process.env.TEST_USER_ID || null;

const hasEnv =
  !!process.env.SUPABASE_URL &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !!process.env.SUPABASE_ANON_KEY;

const describeIfEnv = hasEnv ? describe : describe.skip;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rootDir = path.join(__dirname, "..", "..");
const workingHoursCsvPath = path.join(
  rootDir,
  "frontend/public/correct/Tip Calculator Files - Timesheets_Table (1).csv"
);
const tipsCsvPath = path.join(
  rootDir,
  "frontend/public/correct/Tip Calculator Files - Payments_Table (1) - Tip Calculator Files - Payments_Table (1).csv (1).csv"
);

// Helpers
function readCsvLines(p) {
  return fs.readFileSync(p, "utf8").split(/\r?\n/);
}

async function createTestUser() {
  if (TEST_USER_ID) return TEST_USER_ID;
  const email = `test+${Date.now()}@example.com`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: "TestPass123!",
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(error?.message || "Failed to create test user");
  }
  TEST_USER_ID = data.user.id;
  return TEST_USER_ID;
}

async function createStoreFixtures() {
  const userId = await createTestUser();
  const storeName = `test-store-${Date.now()}`;
  const { data: store, error: storeErr } = await supabaseAdmin
    .from("stores")
    .insert({
      name: storeName,
      abbreviation: "TST",
    })
    .select()
    .single();
  if (storeErr || !store) throw new Error(storeErr?.message || "store insert");

  const { error: suErr } = await supabaseAdmin
    .from("store_users")
    .insert([{ store_id: store.id, user_id: userId, role: "owner" }]);
  if (suErr) throw new Error(suErr.message);

  // Role mappings per screenshot
  const { data: roleMappings, error: rmErr } = await supabaseAdmin
    .from("role_mappings")
    .insert([
      {
        store_id: store.id,
        role_name: "FRONT",
        actual_role_name: "FOH",
        trainee_role_name: "F_TRAINEE",
        trainee_percentage: 50,
      },
      {
        store_id: store.id,
        role_name: "BACK",
        actual_role_name: "BOH",
      },
      {
        store_id: store.id,
        role_name: "FLOATER",
        actual_role_name: "FLOATER",
      },
    ])
    .select();
  if (rmErr || !roleMappings) {
    throw new Error(rmErr?.message || "role mapping insert");
  }

  // Tip pool distribution per screenshot
  const rm = Object.fromEntries(roleMappings.map((r) => [r.role_name, r.id]));
  const patterns = [
    { FRONT: 0, BACK: 100, FLOATER: 0 },
    { FRONT: 0, BACK: 0, FLOATER: 100 },
    { FRONT: 0, BACK: 25, FLOATER: 75 },
    { FRONT: 100, BACK: 0, FLOATER: 0 },
    { FRONT: 70, BACK: 0, FLOATER: 30 },
    { FRONT: 75, BACK: 25, FLOATER: 0 },
    { FRONT: 70, BACK: 20, FLOATER: 10 },
  ];

  const insertRows = [];
  patterns.forEach((p, idx) => {
    const grouping = idx + 1;
    insertRows.push(
      {
        role_mapping_id: rm.FRONT,
        distribution_grouping: grouping,
        percentage: p.FRONT,
      },
      {
        role_mapping_id: rm.BACK,
        distribution_grouping: grouping,
        percentage: p.BACK,
      },
      {
        role_mapping_id: rm.FLOATER,
        distribution_grouping: grouping,
        percentage: p.FLOATER,
      }
    );
  });

  const { error: rpErr } = await supabaseAdmin
    .from("role_percentage")
    .insert(insertRows);
  if (rpErr) throw new Error(rpErr.message);

  return { storeId: store.id, roleMappingIds: roleMappings.map((r) => r.id) };
}

async function cleanupStoreFixtures(storeId) {
  if (!storeId) return;
  const tablesToClean = [
    "formatted_cash_tip",
    "formatted_tip_data",
    "formatted_working_hours",
  ];
  for (const table of tablesToClean) {
    await supabaseAdmin.from(table).delete().eq("stores_id", storeId);
  }
  // delete calculation results by calculation ids linked to this store
  const { data: calcs } = await supabaseAdmin
    .from("tip_calculations")
    .select("id")
    .eq("stores_id", storeId);
  const calcIds = calcs ? calcs.map((c) => c.id) : [];
  if (calcIds.length) {
    await supabaseAdmin
      .from("tip_calculation_results")
      .delete()
      .in("calculation_id", calcIds);
    await supabaseAdmin.from("tip_calculations").delete().in("id", calcIds);
  }
  const { data: roleMappings } = await supabaseAdmin
    .from("role_mappings")
    .select("id")
    .eq("store_id", storeId);
  const roleIds = roleMappings ? roleMappings.map((r) => r.id) : [];
  if (roleIds.length) {
    await supabaseAdmin
      .from("role_percentage")
      .delete()
      .in("role_mapping_id", roleIds);
  }
  await supabaseAdmin.from("role_mappings").delete().eq("store_id", storeId);
  await supabaseAdmin.from("store_users").delete().eq("store_id", storeId);
  await supabaseAdmin.from("stores").delete().eq("id", storeId);

  // delete test user if we created one
  if (!process.env.TEST_USER_ID && TEST_USER_ID) {
    await supabaseAdmin.auth.admin.deleteUser(TEST_USER_ID);
    TEST_USER_ID = null;
  }
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["server.js"], {
      cwd: path.join(__dirname, ".."),
      env: {
        ...process.env,
        PORT,
        TEST_BYPASS_AUTH: "true",
        TEST_USER_ID,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const onData = (data) => {
      const msg = data.toString();
      if (msg.includes("Server is running")) {
        resolve(child);
      }
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", (data) => {
      // eslint-disable-next-line no-console
      console.error(data.toString());
    });
    child.on("error", reject);
  });
}

async function apiFetch(pathname, options = {}) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: {
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  return { status: res.status, body: json };
}

describeIfEnv("Tip calculation integration (backend)", () => {
  let server;
  let storeId;

  beforeAll(async () => {
    const fixtures = await createStoreFixtures();
    storeId = fixtures.storeId;
    server = await startServer();
  }, 120000);

  afterAll(async () => {
    if (server) {
      server.kill();
    }
    if (storeId) {
      await cleanupStoreFixtures(storeId);
    }
  });

  test("full flow: format working hours + tip data -> calculate -> fetch results", async () => {
    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.SUPABASE_ANON_KEY
    ) {
      return;
    }

    const workingLines = readCsvLines(workingHoursCsvPath);
    const tipsLines = readCsvLines(tipsCsvPath);

    const fwRes = await apiFetch("/api/tips/format-working-hours", {
      method: "POST",
      body: JSON.stringify({ stores_id: storeId, csvData: workingLines }),
    });
    expect(fwRes.status).toBe(200);
    expect(fwRes.body.success).toBe(true);
    expect(fwRes.body.calculationId).toBeTruthy();

    const ftRes = await apiFetch("/api/tips/format-tip-data", {
      method: "POST",
      body: JSON.stringify({ stores_id: storeId, csvData: tipsLines }),
    });
    expect(ftRes.status).toBe(200);
    expect(ftRes.body.success).toBe(true);

    const calcRes = await apiFetch("/api/tips/calculate", {
      method: "POST",
      body: JSON.stringify({ storeId }),
    });
    expect(calcRes.status).toBe(200);
    expect(calcRes.body.success).toBe(true);
    expect(calcRes.body.calculationId).toBeTruthy();

    const resultRes = await apiFetch(
      `/api/tips/calculation-results?calculationId=${calcRes.body.calculationId}`
    );
    expect(resultRes.status).toBe(200);
    expect(resultRes.body.success).toBe(true);
    expect(resultRes.body.data).toBeDefined();
    expect(Array.isArray(resultRes.body.data.results)).toBe(true);
    expect(resultRes.body.data.results.length).toBeGreaterThan(0);

    const expected = [
      { name: "Branden Phillip Loi Panday", tips: 724.54, cash_tips: 0 },
      { name: "Derek Zheng", tips: 807.13, cash_tips: 0 },
      { name: "Kyra (Zin Hnin Htike)", tips: 41.99, cash_tips: 0 },
      { name: "Norberto Canul Interian", tips: 546.79, cash_tips: 0 },
      { name: "Thomas (Zaw Lynn Htet)", tips: 675.1, cash_tips: 0 },
      { name: "Zac (Aung Kaung Myat)", tips: 256.15, cash_tips: 0 },
    ];

    // sort results by name for stable comparison
    const actualSorted = [...resultRes.body.data.results].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
    const expectedSorted = [...expected].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    expect(actualSorted.length).toBe(expectedSorted.length);
    actualSorted.forEach((r, idx) => {
      expect(r.name).toBe(expectedSorted[idx].name);
      expect(Number(r.tips).toFixed(2)).toBe(
        expectedSorted[idx].tips.toFixed(2)
      );
      expect(Number(r.cash_tips || 0).toFixed(2)).toBe(
        expectedSorted[idx].cash_tips.toFixed(2)
      );
    });
  }, 120000);
});
