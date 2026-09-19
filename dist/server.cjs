var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express2 = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_ws2 = require("ws");
var import_url2 = require("url");

// api/index.ts
var import_express = __toESM(require("express"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_promise = __toESM(require("mysql2/promise"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_adm_zip = __toESM(require("adm-zip"), 1);
var import_ws = require("ws");
var import_url = require("url");
var import_meta = {};
var __dirname;
try {
  __dirname = import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
} catch {
  __dirname = process.cwd();
}
var getPersistentRootDir = () => {
  let currDir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const hasConfig = import_fs.default.existsSync(import_path.default.join(currDir, "config"));
    const hasVersions = import_fs.default.existsSync(import_path.default.join(currDir, "versions"));
    const hasHbuilds = currDir.endsWith("hbuilds") || currDir.includes("hbuilds");
    if (hasConfig || hasVersions || hasHbuilds) {
      return currDir;
    }
    const parentDir = import_path.default.dirname(currDir);
    if (parentDir === currDir) break;
    currDir = parentDir;
  }
  try {
    const up3 = import_path.default.resolve(process.cwd(), "../../../");
    if (import_fs.default.existsSync(import_path.default.join(up3, "config")) || import_fs.default.existsSync(import_path.default.join(up3, "versions")) || up3.includes("hbuilds")) {
      return up3;
    }
    const up4 = import_path.default.resolve(process.cwd(), "../../../../");
    if (up4.includes("hbuilds")) {
      return up4;
    }
  } catch (e) {
  }
  return process.cwd();
};
var findAndLoadEnv = () => {
  const root = getPersistentRootDir();
  const envPathRoot = import_path.default.join(root, ".env");
  if (import_fs.default.existsSync(envPathRoot)) {
    import_dotenv.default.config({ path: envPathRoot });
  }
  let currDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const envPath = import_path.default.join(currDir, ".env");
    if (import_fs.default.existsSync(envPath)) {
      import_dotenv.default.config({ path: envPath });
    }
    const parentDir = import_path.default.dirname(currDir);
    if (parentDir === currDir) break;
    currDir = parentDir;
  }
  import_dotenv.default.config();
};
findAndLoadEnv();
var app = (0, import_express.default)();
app.use((0, import_compression.default)({
  threshold: 1024,
  level: 6
}));
var wssInstance = null;
function setWssInstance(wss) {
  wssInstance = wss;
}
function broadcastWebSocketMessage(payload) {
  if (!wssInstance) return;
  const msgStr = JSON.stringify(payload);
  wssInstance.clients.forEach((client) => {
    if (client.readyState === import_ws.WebSocket.OPEN) {
      client.send(msgStr);
    }
  });
}
app.use((req, res, next) => {
  if (req.url.includes("/api/")) {
    const apiIndex = req.url.indexOf("/api/");
    req.url = req.url.substring(apiIndex);
  }
  next();
});
app.use(import_express.default.json({ limit: "10mb" }));
var getUploadDir = () => {
  if (process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim() !== "") {
    return process.env.UPLOAD_DIR;
  }
  const hostingerPath = "/home/u648273511/domains/attaroqqy.com/storage/uploads";
  try {
    if (!import_fs.default.existsSync(hostingerPath)) {
      import_fs.default.mkdirSync(hostingerPath, { recursive: true });
    }
    return hostingerPath;
  } catch (e) {
    try {
      return import_path.default.join(__dirname, "public", "uploads");
    } catch (err) {
      return import_path.default.join(process.cwd(), "public", "uploads");
    }
  }
};
console.log(">>> UPLOAD_DIR terdeteksi sebagai:", getUploadDir());
var uploadDirStatic = getUploadDir();
if (!import_fs.default.existsSync(uploadDirStatic)) {
  try {
    import_fs.default.mkdirSync(uploadDirStatic, { recursive: true });
  } catch (e) {
  }
}
app.use("/uploads", import_express.default.static(uploadDirStatic));
app.use("/api/uploads", import_express.default.static(uploadDirStatic));
app.use("/uploads", import_express.default.static(import_path.default.join(process.cwd(), "dist", "uploads")));
app.use("/api/uploads", import_express.default.static(import_path.default.join(process.cwd(), "dist", "uploads")));
var mysqlPool = null;
var memoryStore = /* @__PURE__ */ new Map();
var ensuredTablesSet = /* @__PURE__ */ new Set();
var tableColumnsCache = /* @__PURE__ */ new Map();
var permissionsTablesSeeded = false;
var mySQLThrottleUntil = 0;
var tableQueryCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 15e3;
function invalidateTableCache(table) {
  if (table) {
    tableQueryCache.delete(table);
    for (const key of Array.from(tableQueryCache.keys())) {
      if (key === table || key.startsWith(`${table}:`)) {
        tableQueryCache.delete(key);
      }
    }
  } else {
    tableQueryCache.clear();
  }
}
var DB_BACKUP_PATH = import_path.default.join(getPersistentRootDir(), "database_backup.json");
function loadMemoryStoreFromDisk() {
  try {
    const candidates = [
      DB_BACKUP_PATH,
      import_path.default.join(process.cwd(), "database_backup.json"),
      import_path.default.join(process.cwd(), "data_store.json")
    ];
    for (const filePath of candidates) {
      if (import_fs.default.existsSync(filePath)) {
        const raw = import_fs.default.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
              const existing = memoryStore.get(key) || [];
              if (existing.length === 0) {
                memoryStore.set(key, parsed[key]);
              }
            }
          }
          console.log(">>> Berhasil memuat data offline/backup dari disk:", filePath);
          break;
        }
      }
    }
  } catch (err) {
    console.warn("Could not load memoryStore from disk:", err.message);
  }
}
loadMemoryStoreFromDisk();
var saveDiskTimeout = null;
function saveMemoryStoreToDisk() {
  if (saveDiskTimeout) clearTimeout(saveDiskTimeout);
  saveDiskTimeout = setTimeout(() => {
    try {
      const obj = {};
      for (const [table, rows] of memoryStore.entries()) {
        obj[table] = rows;
      }
      import_fs.default.writeFileSync(DB_BACKUP_PATH, JSON.stringify(obj, null, 2), "utf-8");
    } catch (err) {
      console.warn("Could not save memoryStore to disk:", err.message);
    }
  }, 200);
}
function withTimeout(promise, ms = 2500) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error("Koneksi MySQL Timeout (" + ms + "ms)");
      err.code = "ETIMEDOUT";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}
function handleMySQLError(err) {
  if (!err) return;
  const msg = (err.message || "").toLowerCase();
  const code = (err.code || "").toUpperCase();
  if (msg.includes("max_connections_per_hour") || msg.includes("too many connections") || msg.includes("user limit reached") || msg.includes("resource limit") || msg.includes("etimedout") || msg.includes("timeout") || msg.includes("ehostunreach") || msg.includes("enetunreach") || msg.includes("econnrefused") || msg.includes("econnreset") || msg.includes("access denied") || code === "ER_USER_LIMIT_REACHED" || code === "ER_CON_COUNT_ERROR" || code === "PROTOCOL_CONNECTION_LOST" || code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "EHOSTUNREACH" || code === "ENETUNREACH" || code === "ECONNRESET" || code === "PROTOCOL_TIMEOUT" || code === "ER_ACCESS_DENIED_ERROR") {
    console.warn(`>>> MySQL non-aktif/unreachable (${code || msg}). Mengaktifkan fallback memoryStore & local backup selama 15 menit agar aplikasi tetap responsif tanpa hanging.`);
    mySQLThrottleUntil = Date.now() + 15 * 60 * 1e3;
    if (mysqlPool) {
      try {
        mysqlPool.end().catch(() => {
        });
      } catch (e) {
      }
      mysqlPool = null;
    }
  }
}
function getMySQLPool() {
  if (Date.now() < mySQLThrottleUntil) {
    return null;
  }
  const host = (process.env.MYSQL_HOST || process.env.DB_HOST || "localhost").trim();
  const user = (process.env.MYSQL_USER || process.env.DB_USER || "").trim();
  const password = (process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || "").trim();
  const database = (process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE || "").trim();
  const port = Number(String(process.env.MYSQL_PORT || process.env.DB_PORT || 3306).trim()) || 3306;
  if (!user || !database) {
    return null;
  }
  if (!mysqlPool) {
    try {
      const connLimit = Number(String(process.env.DB_CONNECTION_LIMIT || process.env.MYSQL_CONNECTION_LIMIT || 10).trim()) || 10;
      mysqlPool = import_promise.default.createPool({
        host,
        user,
        password,
        database,
        port,
        connectTimeout: 4e3,
        waitForConnections: true,
        connectionLimit: connLimit,
        maxIdle: connLimit,
        idleTimeout: 6e4,
        enableKeepAlive: true,
        keepAliveInitialDelay: 1e4,
        queueLimit: 0,
        dateStrings: true
      });
    } catch (err) {
      console.error("Gagal membuat koneksi MySQL Pool:", err.message);
      handleMySQLError(err);
      return null;
    }
  }
  return mysqlPool;
}
var VALID_TABLES = /* @__PURE__ */ new Set([
  "santri",
  "lembaga",
  "kelas",
  "kompleks",
  "kamar",
  "kategori_rombel",
  "kelompok_rombel",
  "rombel_assignment",
  "surat",
  "bendahara",
  "keamanan",
  "periode",
  "perizinan",
  "katalog_pelanggaran",
  "app_credentials",
  "pesantren_profile",
  "feedback",
  "permissions",
  "roles",
  "role_has_permissions",
  "document_generation_logs",
  "document_templates",
  "admin_chat",
  "tasks",
  "tugas",
  "riwayat_aktivitas"
]);
app.get("/api/db-status", async (req, res) => {
  const pool = getMySQLPool();
  if (pool) {
    try {
      await withTimeout(pool.query("SELECT 1"), 1500);
      return res.json({
        connected: true,
        type: "mysql",
        host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
        database: process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE,
        reason: "connected"
      });
    } catch (err) {
      handleMySQLError(err);
      console.warn("MySQL ping failed:", err.message);
    }
  }
  res.json({
    connected: true,
    type: "memory",
    reason: "memory_store_active"
  });
});
app.get("/api/download-sql-mysql", (req, res) => {
  const filePath = import_path.default.join(process.cwd(), "hostinger_mysql_setup.sql");
  res.download(filePath, "hostinger_mysql_setup.sql", (err) => {
    if (err) {
      res.status(500).send("Gagal mengunduh skema SQL MySQL Hostinger");
    }
  });
});
app.get("/api/storage-stats", async (req, res) => {
  const pool = getMySQLPool();
  if (pool) {
    try {
      const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE;
      const [rows] = await pool.query(
        "SELECT SUM(data_length + index_length) AS db_size FROM information_schema.TABLES WHERE table_schema = ?",
        [dbName]
      );
      const dbSize = rows?.[0]?.db_size ? Number(rows[0].db_size) : 125e4;
      return res.json({
        success: true,
        databaseSize: dbSize,
        bucketSize: 24e5,
        isFallback: false
      });
    } catch (err) {
      handleMySQLError(err);
    }
  }
  res.json({
    success: true,
    databaseSize: 125e4,
    bucketSize: 24e5,
    isFallback: true
  });
});
function stripPassword(table, data) {
  if (table !== "app_credentials" || !data) return data;
  if (Array.isArray(data)) {
    return data.map((item) => {
      const { password: password2, ...rest2 } = item;
      return rest2;
    });
  }
  const { password, ...rest } = data;
  return rest;
}
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const rawInput = (username || "").trim();
  const emailLower = rawInput.toLowerCase();
  const usernameWithoutDomain = emailLower.includes("@") ? emailLower.split("@")[0].trim() : emailLower;
  const emailWithDomain = emailLower.includes("@") ? emailLower : `${emailLower}@attaroqqy.com`;
  const inputPass = String(password || "").trim();
  const defaultUser = "superadmin@attaroqqy.com";
  const defaultPass = "1234";
  const pool = getMySQLPool();
  if (pool) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM \`app_credentials\` 
         WHERE LOWER(TRIM(\`username\`)) = ? 
            OR LOWER(TRIM(\`username\`)) = ? 
            OR LOWER(TRIM(\`username\`)) = ? 
            OR LOWER(TRIM(\`id\`)) = ? 
            OR LOWER(TRIM(\`id\`)) = ?
         LIMIT 1`,
        [emailLower, usernameWithoutDomain, emailWithDomain, emailLower, usernameWithoutDomain]
      );
      let matchedUser2 = rows?.[0];
      if (!matchedUser2 && (emailLower === defaultUser || emailLower === "superadmin") && inputPass === defaultPass) {
        const newId = "superadmin";
        await pool.query(
          "INSERT INTO `app_credentials` (`id`, `username`, `password`, `role`, `status`, `display_name`) VALUES (?, ?, ?, 'superadmin', 'approved', 'Super Admin') ON DUPLICATE KEY UPDATE `id`=`id`",
          [newId, defaultUser, defaultPass]
        );
        return res.json({
          success: true,
          user: {
            id: newId,
            username: defaultUser,
            role: "superadmin",
            status: "approved",
            displayName: "Super Admin"
          }
        });
      }
      if (!matchedUser2) {
        return res.status(401).json({
          success: false,
          error: `Akun '${rawInput}' tidak ditemukan di database. Pastikan Username atau Email Anda sudah terdaftar di tabel app_credentials.`
        });
      }
      const storedPass2 = String(matchedUser2.password || "").trim();
      if (storedPass2 !== inputPass) {
        return res.status(401).json({
          success: false,
          error: "Kata Sandi salah. Harap periksa kembali huruf besar, huruf kecil, dan angka kata sandi Anda."
        });
      }
      const statusLower2 = String(matchedUser2.status || "").trim().toLowerCase();
      if (statusLower2 === "pending" || statusLower2 === "menunggu") {
        return res.status(403).json({
          success: false,
          error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin."
        });
      } else if (statusLower2 === "rejected" || statusLower2 === "ditolak") {
        return res.status(403).json({
          success: false,
          error: "Akses Ditolak: Permohonan pendaftaran akun Anda ditolak oleh Superadmin."
        });
      }
      return res.json({
        success: true,
        needsCancelReset: statusLower2 === "minta_reset" || statusLower2 === "reset_requested",
        user: {
          id: matchedUser2.id,
          username: matchedUser2.username,
          role: matchedUser2.role || "superadmin",
          status: matchedUser2.status || "approved",
          displayName: matchedUser2.display_name || matchedUser2.displayName || matchedUser2.nama || matchedUser2.username,
          avatarUrl: matchedUser2.avatar_url || matchedUser2.avatarUrl || ""
        }
      });
    } catch (err) {
      handleMySQLError(err);
      console.error("MySQL Auth login error:", err);
    }
  }
  const list = memoryStore.get("app_credentials") || [];
  let matchedUser = list.find((u) => {
    const uName = String(u.username || "").trim().toLowerCase();
    const uId = String(u.id || "").trim().toLowerCase();
    return uName === emailLower || uName === usernameWithoutDomain || uName === emailWithDomain || uId === emailLower || uId === usernameWithoutDomain;
  });
  if (!matchedUser && (emailLower === defaultUser || emailLower === "superadmin") && inputPass === defaultPass) {
    matchedUser = {
      id: "superadmin",
      username: defaultUser,
      password: defaultPass,
      role: "superadmin",
      status: "approved",
      displayName: "Super Admin"
    };
    list.push(matchedUser);
    memoryStore.set("app_credentials", list);
  }
  if (!matchedUser) {
    return res.status(401).json({
      success: false,
      error: `Akun '${rawInput}' tidak ditemukan. Pastikan Username atau Email Anda sudah terdaftar.`
    });
  }
  const storedPass = String(matchedUser.password || "").trim();
  if (storedPass && storedPass !== inputPass) {
    return res.status(401).json({
      success: false,
      error: "Kata Sandi salah. Harap periksa kembali huruf besar dan kecil kata sandi Anda."
    });
  }
  const statusLower = String(matchedUser.status || "").trim().toLowerCase();
  if (statusLower === "pending" || statusLower === "menunggu") {
    return res.status(403).json({
      success: false,
      error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin."
    });
  } else if (statusLower === "rejected" || statusLower === "ditolak") {
    return res.status(403).json({
      success: false,
      error: "Akses Ditolak: Permohonan pendaftaran akun Anda ditolak oleh Superadmin."
    });
  }
  return res.json({
    success: true,
    needsCancelReset: statusLower === "minta_reset" || statusLower === "reset_requested",
    user: {
      id: matchedUser.id,
      username: matchedUser.username,
      role: matchedUser.role || "superadmin",
      status: matchedUser.status || "approved",
      displayName: matchedUser.display_name || matchedUser.displayName || matchedUser.nama || matchedUser.username,
      avatarUrl: matchedUser.avatar_url || matchedUser.avatarUrl || ""
    }
  });
});
app.post("/api/upload", async (req, res) => {
  try {
    const { fileName, fileBase64, category } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: "fileName and fileBase64 are required" });
    }
    const subFolder = (category || "dokumen").replace(/[^a-zA-Z0-9_-]/g, "_");
    const buffer = Buffer.from(fileBase64, "base64");
    const uploadBase = getUploadDir();
    const targetDir = import_path.default.join(uploadBase, subFolder);
    if (!import_fs.default.existsSync(targetDir)) {
      import_fs.default.mkdirSync(targetDir, { recursive: true });
    }
    const targetFilePath = import_path.default.join(targetDir, fileName);
    import_fs.default.writeFileSync(targetFilePath, buffer);
    const publicUrl = `/api/uploads/${subFolder}/${fileName}`;
    res.json({
      success: true,
      path: publicUrl,
      publicUrl
    });
  } catch (err) {
    console.error("Storage upload handler error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/uploads/:category/:fileName", (req, res) => {
  try {
    const { category, fileName } = req.params;
    const safeCategory = (category || "dokumen").replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeFileName = (fileName || "").replace(/[^a-zA-Z0-9_.-]/g, "_");
    const uploadBase = getUploadDir();
    const targetFilePath = import_path.default.join(uploadBase, safeCategory, safeFileName);
    if (import_fs.default.existsSync(targetFilePath)) {
      return res.sendFile(targetFilePath);
    }
    res.status(404).json({ error: "File not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
function deleteFileByUrlOrPath(fileUrlOrPath) {
  if (!fileUrlOrPath || typeof fileUrlOrPath !== "string") return;
  try {
    let cleanPath = fileUrlOrPath.trim();
    if (cleanPath.startsWith("/api/uploads/")) {
      cleanPath = cleanPath.replace("/api/uploads/", "");
    } else if (cleanPath.startsWith("/uploads/")) {
      cleanPath = cleanPath.replace("/uploads/", "");
    } else if (cleanPath.includes("/uploads/")) {
      const idx = cleanPath.indexOf("/uploads/");
      cleanPath = cleanPath.substring(idx + 9);
    }
    const uploadBase = getUploadDir();
    const fullPath = import_path.default.join(uploadBase, cleanPath);
    const resolvedUploadBase = import_path.default.resolve(uploadBase);
    const resolvedFullPath = import_path.default.resolve(fullPath);
    if (resolvedFullPath.startsWith(resolvedUploadBase) && import_fs.default.existsSync(resolvedFullPath)) {
      import_fs.default.unlinkSync(resolvedFullPath);
      console.log(">>> Berhasil auto-delete file dari storage:", resolvedFullPath);
    }
  } catch (err) {
    console.warn("Gagal auto-delete file dari storage:", err.message);
  }
}
function collectFileUrls(obj, urls = /* @__PURE__ */ new Set()) {
  if (!obj) return urls;
  if (typeof obj === "string") {
    let s = obj.trim();
    if (s.includes("/uploads/") || s.includes("/api/uploads/")) {
      urls.add(s);
    }
    if (s.startsWith("{") && s.endsWith("}") || s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        collectFileUrls(parsed, urls);
      } catch (e) {
      }
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      collectFileUrls(item, urls);
    }
  } else if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      collectFileUrls(obj[key], urls);
    }
  }
  return urls;
}
function extractAndCleanFilesFromRecord(record) {
  if (!record || typeof record !== "object") return;
  const urls = collectFileUrls(record);
  for (const url of urls) {
    deleteFileByUrlOrPath(url);
  }
}
function cleanupReplacedFiles(oldRecord, newRecord) {
  if (!oldRecord || !newRecord) return;
  const oldUrls = collectFileUrls(oldRecord);
  const newUrls = collectFileUrls(newRecord);
  for (const url of oldUrls) {
    if (!newUrls.has(url)) {
      deleteFileByUrlOrPath(url);
    }
  }
}
app.post("/api/delete-file", async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ success: false, error: "fileUrl is required" });
    }
    deleteFileByUrlOrPath(fileUrl);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
function packPendidikanFormal(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.map(packPendidikanFormal);
  const copy = { ...payload };
  const pfVal = String(copy.pendidikan_formal ?? copy.pendidikanFormal ?? "").trim();
  if (pfVal && pfVal.toLowerCase() !== "tanpa kelas" && pfVal.toLowerCase() !== "tidak terdaftar" && pfVal.toLowerCase() !== "tidak sekolah") {
    let existingNotes = (copy.catatan || "").replace(/\[PF:.*?\]\s*/g, "").trim();
    copy.catatan = `[PF:${pfVal}] ${existingNotes}`.trim();
    copy.pendidikan_formal = pfVal;
    copy.pendidikanFormal = pfVal;
  } else {
    if (copy.catatan && typeof copy.catatan === "string") {
      copy.catatan = copy.catatan.replace(/\[PF:.*?\]\s*/g, "").trim() || null;
    }
    copy.pendidikan_formal = null;
    copy.pendidikanFormal = null;
  }
  return copy;
}
function unpackPendidikanFormal(data) {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(unpackPendidikanFormal);
  if (typeof data === "object") {
    const copy = { ...data };
    if (copy.catatan && typeof copy.catatan === "string" && copy.catatan.includes("[PF:")) {
      const match = copy.catatan.match(/\[PF:(.*?)\]/);
      if (match && match[1]) {
        copy.pendidikan_formal = match[1];
        copy.pendidikanFormal = match[1];
        copy.catatan = copy.catatan.replace(/\[PF:.*?\]\s*/g, "").trim() || null;
      }
    } else {
      const val = copy.pendidikan_formal || copy.pendidikanFormal || null;
      copy.pendidikan_formal = val;
      copy.pendidikanFormal = val;
    }
    return copy;
  }
  return data;
}
function packLembaga(body) {
  if (!body) return body;
  if (Array.isArray(body)) return body.map(packLembaga);
  if (typeof body === "object") {
    const copy = { ...body };
    const ns = copy.nomor_statistik !== void 0 ? copy.nomor_statistik : copy.nomorStatistik;
    if (ns !== void 0) {
      copy.nomor_statistik = ns;
      copy.nomorStatistik = ns;
    }
    return copy;
  }
  return body;
}
function unpackLembaga(data) {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(unpackLembaga);
  if (typeof data === "object") {
    const copy = { ...data };
    const ns = copy.nomor_statistik !== void 0 ? copy.nomor_statistik : copy.nomorStatistik ?? null;
    copy.nomor_statistik = ns;
    copy.nomorStatistik = ns;
    return copy;
  }
  return data;
}
function sanitizePayload(payload) {
  if (!payload) return payload;
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item));
  }
  if (typeof payload === "object") {
    const cleaned = { ...payload };
    for (const key of Object.keys(cleaned)) {
      if (cleaned[key] === "") {
        cleaned[key] = null;
      } else if (typeof cleaned[key] === "object" && cleaned[key] !== null) {
        cleaned[key] = sanitizePayload(cleaned[key]);
      }
    }
    return cleaned;
  }
  return payload;
}
var DEFAULT_ROLE_NAMES = [
  "superadmin",
  "sekretaris_putra",
  "sekretaris_putri",
  "bendahara_putra",
  "bendahara_putri",
  "kepala_keamanan",
  "keamanan_putra",
  "keamanan_putri",
  "humasy_putra",
  "humasy_putri",
  "pendidikan_putra",
  "pendidikan_putri"
];
var DEFAULT_MODULES = [
  "sekretaris_putra",
  "sekretaris_putri",
  "bendahara_putra",
  "bendahara_putri",
  "keamanan_putra",
  "keamanan_putri",
  "humasy_putra",
  "humasy_putri",
  "pendidikan_putra",
  "pendidikan_putri"
];
var DEFAULT_ACTIONS = ["view", "write"];
var DEFAULT_PERMISSIONS = [];
DEFAULT_MODULES.forEach((m) => {
  DEFAULT_ACTIONS.forEach((a) => {
    DEFAULT_PERMISSIONS.push(`${m}.${a}`);
  });
});
async function ensurePermissionsTablesAndSeed(pool) {
  if (permissionsTablesSeeded) return;
  permissionsTablesSeeded = true;
  if (pool && getMySQLPool()) {
    try {
      await withTimeout(pool.query(`
        CREATE TABLE IF NOT EXISTS \`permissions\` (
          \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`guard_name\` VARCHAR(255) NOT NULL DEFAULT 'web',
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY \`permissions_name_guard\` (\`name\`, \`guard_name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `), 2e3);
      await withTimeout(pool.query(`
        CREATE TABLE IF NOT EXISTS \`roles\` (
          \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`guard_name\` VARCHAR(255) NOT NULL DEFAULT 'web',
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY \`roles_name_guard\` (\`name\`, \`guard_name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `), 2e3);
      await withTimeout(pool.query(`
        CREATE TABLE IF NOT EXISTS \`role_has_permissions\` (
          \`permission_id\` BIGINT NOT NULL,
          \`role_id\` BIGINT NOT NULL,
          PRIMARY KEY (\`permission_id\`, \`role_id\`),
          FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `), 2e3);
      for (const roleName of DEFAULT_ROLE_NAMES) {
        await withTimeout(pool.query(
          "INSERT INTO `roles` (`name`, `guard_name`) VALUES (?, 'web') ON DUPLICATE KEY UPDATE `name`=`name`",
          [roleName]
        ), 2e3);
      }
      for (const permName of DEFAULT_PERMISSIONS) {
        await withTimeout(pool.query(
          "INSERT INTO `permissions` (`name`, `guard_name`) VALUES (?, 'web') ON DUPLICATE KEY UPDATE `name`=`name`",
          [permName]
        ), 2e3);
      }
      const [rhpRows] = await withTimeout(pool.query("SELECT COUNT(*) as cnt FROM `role_has_permissions`"), 2e3);
      if (!rhpRows?.[0]?.cnt || rhpRows[0].cnt === 0) {
        const [rRows] = await withTimeout(pool.query("SELECT `id`, `name` FROM `roles`"), 2e3);
        const [pRows] = await withTimeout(pool.query("SELECT `id`, `name` FROM `permissions`"), 2e3);
        const roleMap = /* @__PURE__ */ new Map();
        (rRows || []).forEach((r) => roleMap.set(r.name, r.id));
        const permMap = /* @__PURE__ */ new Map();
        (pRows || []).forEach((p) => permMap.set(p.name, p.id));
        for (const rName of DEFAULT_ROLE_NAMES) {
          const rId = roleMap.get(rName);
          if (!rId) continue;
          for (const pName of DEFAULT_PERMISSIONS) {
            const pId = permMap.get(pName);
            if (!pId) continue;
            const parts = pName.split(".");
            const mod = parts[0];
            const act = parts[1];
            let isAllowed = false;
            if (rName === "superadmin") {
              isAllowed = true;
            } else if (rName === mod) {
              isAllowed = true;
            } else if (rName === "kepala_keamanan" && (mod === "keamanan_putra" || mod === "keamanan_putri")) {
              isAllowed = true;
            } else if (rName === "keamanan_putra" && mod === "keamanan_putra" && act === "view") {
              isAllowed = true;
            } else if (rName === "keamanan_putri" && mod === "keamanan_putri" && act === "view") {
              isAllowed = true;
            } else if (act === "view") {
              isAllowed = true;
            }
            if (isAllowed) {
              await withTimeout(pool.query(
                "INSERT IGNORE INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES (?, ?)",
                [rId, pId]
              ), 2e3).catch(() => {
              });
            }
          }
        }
      }
    } catch (err) {
      handleMySQLError(err);
      console.warn("Could not seed permissions tables in MySQL:", err.message);
    }
  }
  if (!memoryStore.has("roles") || (memoryStore.get("roles")?.length || 0) === 0) {
    const rolesList = DEFAULT_ROLE_NAMES.map((name, i) => ({ id: i + 1, name, guard_name: "web" }));
    memoryStore.set("roles", rolesList);
  }
  if (!memoryStore.has("permissions") || (memoryStore.get("permissions")?.length || 0) === 0) {
    const permsList = DEFAULT_PERMISSIONS.map((name, i) => ({ id: i + 1, name, guard_name: "web" }));
    memoryStore.set("permissions", permsList);
  }
  if (!memoryStore.has("role_has_permissions") || (memoryStore.get("role_has_permissions")?.length || 0) === 0) {
    const rhpList = [];
    const rolesList = memoryStore.get("roles") || [];
    const permsList = memoryStore.get("permissions") || [];
    rolesList.forEach((r) => {
      permsList.forEach((p) => {
        const parts = p.name.split(".");
        const mod = parts[0];
        const act = parts[1];
        let isAllowed = false;
        if (r.name === "superadmin") isAllowed = true;
        else if (r.name === mod) isAllowed = true;
        else if (r.name === "kepala_keamanan" && (mod === "keamanan_putra" || mod === "keamanan_putri")) isAllowed = true;
        else if (r.name === "keamanan_putra" && mod === "keamanan_putra" && act === "view") isAllowed = true;
        else if (r.name === "keamanan_putri" && mod === "keamanan_putri" && act === "view") isAllowed = true;
        else if (act === "view") isAllowed = true;
        if (isAllowed) {
          rhpList.push({ role_id: r.id, permission_id: p.id });
        }
      });
    });
    memoryStore.set("role_has_permissions", rhpList);
  }
}
async function ensureTableColumnsFast(pool, table, createTableSql, requiredCols) {
  try {
    await withTimeout(pool.query(createTableSql), 2e3);
    const [rows] = await withTimeout(pool.query(`SHOW COLUMNS FROM \`${table}\``), 2e3);
    if (Array.isArray(rows)) {
      const existingCols = new Set(rows.map((r) => r.Field));
      tableColumnsCache.set(table, existingCols);
      const missing = requiredCols.filter((col) => !existingCols.has(col));
      if (missing.length > 0) {
        const addClauses = missing.map((col) => `ADD COLUMN \`${col}\` LONGTEXT NULL`).join(", ");
        await withTimeout(pool.query(`ALTER TABLE \`${table}\` ${addClauses}`), 3e3);
        missing.forEach((col) => existingCols.add(col));
      }
    }
  } catch (e) {
    handleMySQLError(e);
    console.warn(`Could not fast-ensure table/columns for ${table}:`, e.message);
  }
}
async function ensureTableExists(table, pool) {
  if (ensuredTablesSet.has(table)) {
    return;
  }
  ensuredTablesSet.add(table);
  if (!getMySQLPool()) {
    return;
  }
  try {
    if (table === "roles" || table === "permissions" || table === "role_has_permissions") {
      await ensurePermissionsTablesAndSeed(pool);
      return;
    }
    if (table === "admin_chat") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`admin_chat\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`sender_username\` VARCHAR(100) NULL,
          \`sender_name\` VARCHAR(100) NULL,
          \`sender_role\` VARCHAR(50) NULL,
          \`recipient_role\` VARCHAR(50) NULL,
          \`message\` LONGTEXT NULL,
          \`sender\` VARCHAR(100) NULL,
          \`senderRole\` VARCHAR(50) NULL,
          \`senderAvatar\` TEXT NULL,
          \`text\` LONGTEXT NULL,
          \`timestamp\` VARCHAR(100) NULL,
          \`channel\` VARCHAR(50) DEFAULT 'semua',
          \`mentions\` LONGTEXT NULL,
          \`attachment\` LONGTEXT NULL,
          \`reply_to\` LONGTEXT NULL,
          \`replyTo\` LONGTEXT NULL,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const cols = ["sender_username", "sender_name", "sender_role", "sender_avatar", "recipient_role", "message", "text", "timestamp", "sender", "senderRole", "reply_to"];
      await ensureTableColumnsFast(pool, "admin_chat", createSql, cols);
    } else if (table === "lembaga") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`lembaga\` (
          \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
          \`nama\` VARCHAR(100) NOT NULL,
          \`kode\` VARCHAR(20) NOT NULL,
          \`deskripsi\` LONGTEXT NULL,
          \`gender\` VARCHAR(10) DEFAULT 'Putra',
          \`jenis\` VARCHAR(20) DEFAULT 'Internal',
          \`logo\` LONGTEXT NULL,
          \`nomor_statistik\` VARCHAR(50) NULL,
          \`npsn\` VARCHAR(50) NULL,
          \`ta_mulai_tanggal\` INT DEFAULT 1,
          \`ta_mulai_bulan\` INT DEFAULT 7,
          \`ta_selesai_tanggal\` INT DEFAULT 30,
          \`ta_selesai_bulan\` INT DEFAULT 6,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const cols = ["logo", "deskripsi", "kode", "gender", "jenis", "nomor_statistik", "nomorStatistik", "npsn", "ta_mulai_tanggal", "ta_mulai_bulan", "ta_selesai_tanggal", "ta_selesai_bulan"];
      await ensureTableColumnsFast(pool, "lembaga", createSql, cols);
    } else if (table === "kelas") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`kelas\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`lembaga_id\` VARCHAR(50) NOT NULL,
          \`nama\` VARCHAR(100) NOT NULL,
          \`wali_kelas\` LONGTEXT NULL,
          \`tingkatan\` VARCHAR(50) DEFAULT 'Lainnya',
          \`kapasitas\` INT DEFAULT 40,
          \`is_default\` TINYINT(1) DEFAULT 0,
          \`batas_usia_hari\` INT DEFAULT 1,
          \`batas_usia_bulan\` INT DEFAULT 7,
          \`batas_usia_umur_min\` INT DEFAULT 0,
          \`batas_usia_umur_max\` INT DEFAULT 99,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const cols = ["wali_kelas", "tingkatan", "kapasitas", "is_default", "isDefault", "batas_usia_hari", "batas_usia_bulan", "batas_usia_umur_min", "batas_usia_umur_max"];
      await ensureTableColumnsFast(pool, "kelas", createSql, cols);
    } else if (table === "tugas" || table === "tasks") {
      const createTugasSql = `
        CREATE TABLE IF NOT EXISTS \`tugas\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`user_id\` VARCHAR(100) NULL,
          \`username\` VARCHAR(100) NULL,
          \`text\` LONGTEXT NULL,
          \`judul\` VARCHAR(255) NULL,
          \`description\` LONGTEXT NULL,
          \`deskripsi\` LONGTEXT NULL,
          \`status\` VARCHAR(50) DEFAULT 'pending',
          \`deadline_timestamp\` BIGINT NULL,
          \`deadlineTimestamp\` BIGINT NULL,
          \`color\` VARCHAR(50) DEFAULT 'yellow',
          \`prioritas\` VARCHAR(20) DEFAULT 'Sedang',
          \`tenggat_waktu\` DATE NULL,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`createdAt\` BIGINT NULL,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const createTasksSql = `
        CREATE TABLE IF NOT EXISTS \`tasks\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`user_id\` VARCHAR(100) NULL,
          \`username\` VARCHAR(100) NULL,
          \`text\` LONGTEXT NULL,
          \`title\` VARCHAR(255) NULL,
          \`description\` LONGTEXT NULL,
          \`status\` VARCHAR(50) DEFAULT 'pending',
          \`deadline_timestamp\` BIGINT NULL,
          \`color\` VARCHAR(50) DEFAULT 'yellow',
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const tugasCols = ["text", "description", "deadline_timestamp", "deadlineTimestamp", "color", "createdAt", "user_id", "username", "judul", "deskripsi", "status", "prioritas", "tenggat_waktu"];
      await ensureTableColumnsFast(pool, "tugas", createTugasSql, tugasCols);
      await ensureTableColumnsFast(pool, "tasks", createTasksSql, tugasCols);
    } else if (table === "feedback") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`feedback\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`sender_username\` VARCHAR(100) NULL,
          \`sender_email\` VARCHAR(100) NULL,
          \`sender_role\` VARCHAR(50) NULL,
          \`message\` LONGTEXT NULL,
          \`content\` LONGTEXT NULL,
          \`is_starred\` TINYINT(1) DEFAULT 0,
          \`isStarred\` TINYINT(1) DEFAULT 0,
          \`status\` VARCHAR(100) DEFAULT 'Belum dikerjakan',
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const feedbackCols = ["sender_username", "sender_email", "sender_role", "message", "content", "is_starred", "isStarred", "status", "created_at", "createdAt"];
      await ensureTableColumnsFast(pool, "feedback", createSql, feedbackCols);
    } else if (table === "perizinan") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`perizinan\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`santri_id\` VARCHAR(100) NULL,
          \`nama_santri\` VARCHAR(255) NULL,
          \`alasan\` LONGTEXT NULL,
          \`status\` VARCHAR(100) DEFAULT 'Izin Aktif',
          \`tgl_keluar\` VARCHAR(50) NULL,
          \`tgl_kembali\` VARCHAR(50) NULL,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const cols = [
        "santri_id",
        "nama_santri",
        "alasan",
        "status",
        "tgl_keluar",
        "tgl_kembali",
        "namaSantri",
        "kelas",
        "kamar",
        "jenisIzin",
        "jenis_izin",
        "tanggalMulai",
        "tanggal_mulai",
        "tanggalSelesai",
        "tanggal_selesai",
        "keterangan",
        "gender",
        "isCabut",
        "is_cabut",
        "tanggalCabut",
        "tanggal_cabut",
        "alasanCabut",
        "alasan_cabut",
        "santriId",
        "nis",
        "tanggalKembali",
        "tanggal_kembali"
      ];
      await ensureTableColumnsFast(pool, "perizinan", createSql, cols);
    } else if (table === "keamanan") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`keamanan\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`santri_id\` VARCHAR(100) NULL,
          \`nama_santri\` VARCHAR(255) NULL,
          \`pelanggaran\` LONGTEXT NULL,
          \`poin\` INT DEFAULT 0,
          \`status\` VARCHAR(100) DEFAULT 'Belum Selesai',
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const cols = ["santri_id", "nama_santri", "pelanggaran", "poin", "status"];
      await ensureTableColumnsFast(pool, "keamanan", createSql, cols);
    } else if (table === "riwayat_aktivitas") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`riwayat_aktivitas\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`user_id\` INT NULL,
          \`nama_user\` VARCHAR(255) NULL,
          \`peran\` VARCHAR(100) NULL,
          \`aksi\` VARCHAR(255) NULL,
          \`deskripsi\` LONGTEXT NULL,
          \`modul\` VARCHAR(100) NULL,
          \`ip_address\` VARCHAR(100) NULL,
          \`user_agent\` LONGTEXT NULL,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const cols = ["user_id", "nama_user", "peran", "aksi", "deskripsi", "modul", "ip_address", "user_agent", "created_at"];
      await ensureTableColumnsFast(pool, "riwayat_aktivitas", createSql, cols);
    } else if (table === "app_credentials") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`app_credentials\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`username\` VARCHAR(255) NULL,
          \`password\` LONGTEXT NULL,
          \`role\` VARCHAR(100) NULL,
          \`status\` VARCHAR(100) DEFAULT 'approved',
          \`displayName\` LONGTEXT NULL,
          \`display_name\` LONGTEXT NULL,
          \`nama\` LONGTEXT NULL,
          \`avatarUrl\` LONGTEXT NULL,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const cols = ["username", "password", "role", "status", "displayName", "display_name", "nama", "avatarUrl", "avatar_url", "created_at"];
      await ensureTableColumnsFast(pool, "app_credentials", createSql, cols);
    } else if (table === "santri") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`santri\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`nama\` VARCHAR(255) NOT NULL,
          \`gender\` VARCHAR(10) DEFAULT 'Putra',
          \`kelas\` VARCHAR(100) NULL,
          \`kamar\` VARCHAR(100) NULL,
          \`nis\` VARCHAR(50) NULL,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const santriCols = [
        "nism",
        "semester",
        "kelas_mhd",
        "tahun_lulus",
        "induk_mhd",
        "induk_wustho",
        "induk_ulya",
        "nisn",
        "nik",
        "no_kk",
        "tempat_lahir",
        "tanggal_lahir",
        "anak_ke",
        "dari_bersaudara",
        "nama_ayah",
        "nik_ayah",
        "pekerjaan_ayah",
        "pendidikan_ayah",
        "nama_ibu",
        "nik_ibu",
        "pekerjaan_ibu",
        "pendidikan_ibu",
        "alamat",
        "rt",
        "rw",
        "desa",
        "kecamatan",
        "kabupaten",
        "provinsi",
        "jarak_rumah",
        "no_hp",
        "status_keanggotaan",
        "status_domisili",
        "status_emis",
        "status_verval",
        "tanggal_keluar",
        "catatan",
        "nomor_lemari",
        "pendidikan_terakhir",
        "pendidikan_formal",
        "pendidikan_internal",
        "kelas_id"
      ];
      await ensureTableColumnsFast(pool, "santri", createSql, santriCols);
    } else if (table === "pesantren_profile") {
      const createSql = `
        CREATE TABLE IF NOT EXISTS \`pesantren_profile\` (
          \`id\` VARCHAR(50) NOT NULL PRIMARY KEY DEFAULT 'main',
          \`nama_pesantren\` VARCHAR(100),
          \`nama_yayasan\` VARCHAR(100),
          \`nspp\` VARCHAR(50) DEFAULT '121235070001',
          \`nomor_notaris\` VARCHAR(150),
          \`alamat\` TEXT,
          \`desa\` VARCHAR(50),
          \`kecamatan\` VARCHAR(50),
          \`kabupaten\` VARCHAR(50),
          \`provinsi\` VARCHAR(50),
          \`kode_pos\` VARCHAR(10),
          \`telepon\` VARCHAR(20),
          \`email\` VARCHAR(100),
          \`website\` VARCHAR(100),
          \`nama_pengasuh\` VARCHAR(100),
          \`nama_wakil_pengasuh\` VARCHAR(100),
          \`nama_ketua_yayasan\` VARCHAR(100),
          \`nama_ketua_pondok\` VARCHAR(100),
          \`nama_sekretaris\` VARCHAR(100),
          \`nama_bendahara\` VARCHAR(100),
          \`nama_ketua_keamanan\` VARCHAR(100),
          \`nama_ketua_pendidikan\` VARCHAR(100),
          \`nama_ketua_humasy\` VARCHAR(100),
          \`nama_wakil_pengasuh_putra\` VARCHAR(100),
          \`nama_ketua_pondok_putra\` VARCHAR(100),
          \`nama_sekretaris_putra\` VARCHAR(100),
          \`nama_bendahara_putra\` VARCHAR(100),
          \`nama_ketua_keamanan_putra\` VARCHAR(100),
          \`nama_ketua_pendidikan_putra\` VARCHAR(100),
          \`nama_ketua_humasy_putra\` VARCHAR(100),
          \`nama_wakil_pengasuh_putri\` VARCHAR(100),
          \`nama_ketua_pondok_putri\` VARCHAR(100),
          \`nama_sekretaris_putri\` VARCHAR(100),
          \`nama_bendahara_putri\` VARCHAR(100),
          \`nama_ketua_keamanan_putri\` VARCHAR(100),
          \`nama_ketua_pendidikan_putri\` VARCHAR(100),
          \`nama_ketua_humasy_putri\` VARCHAR(100),
          \`kota_tanda_tangan\` VARCHAR(50),
          \`logo_style\` VARCHAR(50) DEFAULT 'classic',
          \`logo_url\` LONGTEXT,
          \`kop_tambahan_1\` VARCHAR(150),
          \`kop_tambahan_2\` VARCHAR(150),
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const profileCols = [
        "nama_pesantren",
        "nama_yayasan",
        "nspp",
        "nomor_notaris",
        "alamat",
        "desa",
        "kecamatan",
        "kabupaten",
        "provinsi",
        "kode_pos",
        "telepon",
        "email",
        "website",
        "nama_pengasuh",
        "nama_wakil_pengasuh",
        "nama_ketua_yayasan",
        "nama_ketua_pondok",
        "nama_sekretaris",
        "nama_bendahara",
        "nama_ketua_keamanan",
        "nama_ketua_pendidikan",
        "nama_ketua_humasy",
        "nama_wakil_pengasuh_putra",
        "nama_ketua_pondok_putra",
        "nama_sekretaris_putra",
        "nama_bendahara_putra",
        "nama_ketua_keamanan_putra",
        "nama_ketua_pendidikan_putra",
        "nama_ketua_humasy_putra",
        "nama_wakil_pengasuh_putri",
        "nama_ketua_pondok_putri",
        "nama_sekretaris_putri",
        "nama_bendahara_putri",
        "nama_ketua_keamanan_putri",
        "nama_ketua_pendidikan_putri",
        "nama_ketua_humasy_putri",
        "kota_tanda_tangan",
        "logo_style",
        "logo_url",
        "kop_tambahan_1",
        "kop_tambahan_2"
      ];
      await ensureTableColumnsFast(pool, "pesantren_profile", createSql, profileCols);
    }
  } catch (err) {
    handleMySQLError(err);
  }
}
async function getTableColumns(table, pool) {
  if (tableColumnsCache.has(table)) {
    return tableColumnsCache.get(table);
  }
  if (!getMySQLPool()) return null;
  try {
    const [rows] = await withTimeout(pool.query(`SHOW COLUMNS FROM \`${table}\``), 2e3);
    if (Array.isArray(rows)) {
      const colSet = new Set(rows.map((r) => r.Field));
      tableColumnsCache.set(table, colSet);
      return colSet;
    }
  } catch (err) {
    handleMySQLError(err);
    console.warn(`Could not get columns for ${table}:`, err.message);
  }
  return null;
}
async function tryMySQLQuery(sql, params = []) {
  const pool = getMySQLPool();
  if (!pool) return { success: false, error: "NO_MYSQL" };
  try {
    const [rows] = await withTimeout(pool.query(sql, params), 2500);
    return { success: true, rows };
  } catch (err) {
    handleMySQLError(err);
    return { success: false, error: err };
  }
}
app.get("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }
  const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10)) : 0;
  const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit, 10)) : 0;
  const cacheKey = limit > 0 ? `${table}:p${page}:l${limit}` : table;
  const cached = tableQueryCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader("ETag", cached.etag);
    res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=30");
    if (req.headers["if-none-match"] === cached.etag) {
      return res.status(304).end();
    }
    return res.json(cached.data);
  }
  const pool = getMySQLPool();
  if (pool && !ensuredTablesSet.has(table)) {
    await ensureTableExists(table, pool).catch(() => {
    });
  }
  let rawRows = [];
  let querySql = `SELECT * FROM \`${table}\``;
  if (table === "riwayat_aktivitas" && limit === 0) {
    querySql = `SELECT * FROM \`riwayat_aktivitas\` ORDER BY \`id\` DESC LIMIT 250`;
  } else if (table === "admin_chat" && limit === 0) {
    querySql = `SELECT * FROM \`admin_chat\` ORDER BY \`created_at\` ASC LIMIT 250`;
  }
  const mysqlRes = await tryMySQLQuery(querySql);
  if (mysqlRes.success && Array.isArray(mysqlRes.rows) && mysqlRes.rows.length > 0) {
    memoryStore.set(table, mysqlRes.rows);
    saveMemoryStoreToDisk();
    rawRows = mysqlRes.rows;
  } else {
    rawRows = memoryStore.get(table) || [];
  }
  let finalData = stripPassword(table, rawRows);
  if (table === "santri") {
    finalData = unpackPendidikanFormal(finalData);
  } else if (table === "lembaga") {
    finalData = unpackLembaga(finalData);
  }
  let responseBody;
  if (limit > 0) {
    const total = finalData.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pagedSlice = finalData.slice(offset, offset + limit);
    responseBody = {
      success: true,
      data: pagedSlice,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  } else {
    responseBody = { success: true, data: finalData };
  }
  const etag = `W/"${table}-${finalData.length}-${now.toString(36)}"`;
  tableQueryCache.set(cacheKey, {
    data: responseBody,
    timestamp: now,
    etag
  });
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=30");
  return res.json(responseBody);
});
app.post("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }
  let sanitizedBody = sanitizePayload(req.body);
  if (table === "santri") {
    sanitizedBody = packPendidikanFormal(sanitizedBody);
  } else if (table === "lembaga") {
    sanitizedBody = packLembaga(sanitizedBody);
  }
  const rowsToInsert = Array.isArray(sanitizedBody) ? sanitizedBody : [sanitizedBody];
  const insertedResults = [];
  const pool = getMySQLPool();
  let list = memoryStore.get(table) || [];
  if (pool) {
    await ensureTableExists(table, pool).catch(() => {
    });
    const existingColumns = await getTableColumns(table, pool);
    try {
      for (const row of rowsToInsert) {
        if (!row.id) {
          row.id = String(Date.now()) + Math.random().toString(36).substring(2, 7);
        }
        const existingRow = list.find((item) => item.id === row.id);
        if (existingRow) {
          cleanupReplacedFiles(existingRow, row);
        }
        let keys = Object.keys(row);
        if (existingColumns) {
          keys = keys.filter((k) => existingColumns.has(k));
        }
        if (keys.length === 0) continue;
        const columns = keys.map((k) => `\`${k}\``).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map((k) => typeof row[k] === "object" && row[k] !== null ? JSON.stringify(row[k]) : row[k]);
        const updateClause = keys.map((k) => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");
        const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
        await withTimeout(pool.query(sql, values), 2500);
        insertedResults.push(row);
      }
    } catch (err) {
      handleMySQLError(err);
      console.warn(`MySQL POST /api/db/${table} error:`, err.message);
    }
  }
  list = memoryStore.get(table) || [];
  for (const row of rowsToInsert) {
    if (!row.id) {
      row.id = String(Date.now()) + Math.random().toString(36).substring(2, 7);
    }
    const idx = list.findIndex((item) => item.id === row.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...row };
    } else {
      list.push(row);
    }
    if (insertedResults.length === 0) {
      insertedResults.push(row);
    }
  }
  memoryStore.set(table, list);
  saveMemoryStoreToDisk();
  let resultData = stripPassword(table, Array.isArray(sanitizedBody) ? insertedResults : insertedResults[0]);
  if (table === "santri") {
    resultData = unpackPendidikanFormal(resultData);
  } else if (table === "lembaga") {
    resultData = unpackLembaga(resultData);
  }
  invalidateTableCache(table);
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "insert",
    data: resultData
  });
  return res.json({ success: true, data: resultData });
});
app.put("/api/db/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }
  let sanitizedBody = sanitizePayload(req.body);
  if (table === "santri") {
    sanitizedBody = packPendidikanFormal(sanitizedBody);
  } else if (table === "lembaga") {
    sanitizedBody = packLembaga(sanitizedBody);
  } else if (table === "app_credentials") {
    const dName = sanitizedBody.displayName || sanitizedBody.display_name || sanitizedBody.nama;
    if (dName) {
      sanitizedBody.displayName = dName;
      sanitizedBody.display_name = dName;
      sanitizedBody.nama = dName;
    }
    const aUrl = sanitizedBody.avatarUrl || sanitizedBody.avatar_url;
    if (aUrl) {
      sanitizedBody.avatarUrl = aUrl;
      sanitizedBody.avatar_url = aUrl;
    }
  }
  const list = memoryStore.get(table) || [];
  const existingOldRecord = list.find((item) => item.id === id);
  if (existingOldRecord) {
    cleanupReplacedFiles(existingOldRecord, { id, ...sanitizedBody });
  }
  let updatedResult = { id, ...existingOldRecord || {}, ...sanitizedBody };
  const pool = getMySQLPool();
  if (pool) {
    try {
      await ensureTableExists(table, pool).catch(() => {
      });
      const existingColumns = await getTableColumns(table, pool);
      const updateData = { ...sanitizedBody };
      delete updateData.id;
      let keys = Object.keys(updateData);
      if (existingColumns) {
        keys = keys.filter((k) => existingColumns.has(k));
      }
      if (keys.length > 0) {
        const setClause = keys.map((k) => `\`${k}\` = ?`).join(", ");
        const values = keys.map((k) => typeof updateData[k] === "object" && updateData[k] !== null ? JSON.stringify(updateData[k]) : updateData[k]);
        values.push(id);
        const sql = `UPDATE \`${table}\` SET ${setClause} WHERE \`id\` = ?`;
        await withTimeout(pool.query(sql, values), 2500);
      }
    } catch (err) {
      handleMySQLError(err);
      console.warn(`MySQL PUT /api/db/${table}/${id} error:`, err.message);
    }
  }
  const idx = list.findIndex((item) => item.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...sanitizedBody, id };
  } else {
    list.push({ id, ...sanitizedBody });
  }
  memoryStore.set(table, list);
  saveMemoryStoreToDisk();
  let resultData = stripPassword(table, updatedResult);
  if (table === "santri") {
    resultData = unpackPendidikanFormal(resultData);
  } else if (table === "lembaga") {
    resultData = unpackLembaga(resultData);
  }
  invalidateTableCache(table);
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "update",
    id,
    data: resultData
  });
  return res.json({ success: true, data: resultData });
});
app.delete("/api/db/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }
  const pool = getMySQLPool();
  let existingRecordToDelete = null;
  if (pool) {
    try {
      if (table === "santri") {
        const [sRows] = await withTimeout(pool.query("SELECT * FROM `santri` WHERE `id` = ? LIMIT 1", [id]), 2e3);
        if (sRows?.[0]) existingRecordToDelete = sRows[0];
        const santriNama = existingRecordToDelete?.nama;
        await withTimeout(pool.query("DELETE FROM `rombel_assignment` WHERE `santri_id` = ?", [id]), 2e3).catch(() => {
        });
        if (santriNama) {
          await withTimeout(pool.query("DELETE FROM `perizinan` WHERE `santri_id` = ? OR `nama_santri` = ?", [id, santriNama]), 2e3).catch(() => {
          });
          await withTimeout(pool.query("DELETE FROM `keamanan` WHERE `santri_id` = ? OR `nama_santri` = ?", [id, santriNama]), 2e3).catch(() => {
          });
          await withTimeout(pool.query("DELETE FROM `bendahara` WHERE `nama_santri` = ?", [santriNama]), 2e3).catch(() => {
          });
        } else {
          await withTimeout(pool.query("DELETE FROM `perizinan` WHERE `santri_id` = ?", [id]), 2e3).catch(() => {
          });
          await withTimeout(pool.query("DELETE FROM `keamanan` WHERE `santri_id` = ?", [id]), 2e3).catch(() => {
          });
        }
      } else {
        const [rows] = await withTimeout(pool.query(`SELECT * FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`, [id]), 2e3);
        if (rows?.[0]) existingRecordToDelete = rows[0];
      }
    } catch (e) {
      handleMySQLError(e);
    }
  }
  if (!existingRecordToDelete) {
    const list2 = memoryStore.get(table) || [];
    existingRecordToDelete = list2.find((item) => item.id === id);
  }
  if (existingRecordToDelete) {
    extractAndCleanFilesFromRecord(existingRecordToDelete);
  }
  if (pool) {
    try {
      await withTimeout(pool.query(`DELETE FROM \`${table}\` WHERE \`id\` = ?`, [id]), 2500);
    } catch (err) {
      handleMySQLError(err);
      console.warn(`MySQL DELETE /api/db/${table}/${id} error:`, err.message);
    }
  }
  let list = memoryStore.get(table) || [];
  memoryStore.set(table, list.filter((item) => item.id !== id));
  saveMemoryStoreToDisk();
  invalidateTableCache(table);
  if (table === "santri") {
    invalidateTableCache("rombel_assignment");
    invalidateTableCache("perizinan");
    invalidateTableCache("keamanan");
    invalidateTableCache("bendahara");
  }
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "delete",
    id
  });
  return res.json({ success: true });
});
app.post("/api/sync-role-permissions", async (req, res) => {
  const { roleName, permissions } = req.body;
  const pool = getMySQLPool();
  await ensurePermissionsTablesAndSeed(pool);
  if (pool) {
    try {
      let [rRows] = await pool.query("SELECT `id` FROM `roles` WHERE `name` = ? LIMIT 1", [roleName]);
      if (!rRows || rRows.length === 0) {
        await pool.query("INSERT INTO `roles` (`name`, `guard_name`) VALUES (?, 'web')", [roleName]);
        [rRows] = await pool.query("SELECT `id` FROM `roles` WHERE `name` = ? LIMIT 1", [roleName]);
      }
      if (rRows && rRows.length > 0) {
        const roleId = rRows[0].id;
        if (Array.isArray(permissions)) {
          for (const permName of permissions) {
            await pool.query(
              "INSERT INTO `permissions` (`name`, `guard_name`) VALUES (?, 'web') ON DUPLICATE KEY UPDATE `name`=`name`",
              [permName]
            );
          }
        }
        const [pRows] = await pool.query("SELECT `id`, `name` FROM `permissions`");
        const enabledPermIds = (pRows || []).filter((p) => Array.isArray(permissions) && permissions.includes(p.name)).map((p) => p.id);
        await pool.query("DELETE FROM `role_has_permissions` WHERE `role_id` = ?", [roleId]);
        for (const pid of enabledPermIds) {
          await pool.query("INSERT IGNORE INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES (?, ?)", [roleId, pid]);
        }
      }
    } catch (err) {
      console.warn("Error sync role permissions MySQL:", err.message);
    }
  }
  try {
    const memRoles = memoryStore.get("roles") || [];
    let roleObj = memRoles.find((r) => r.name === roleName);
    if (!roleObj) {
      roleObj = { id: memRoles.length + 1, name: roleName, guard_name: "web" };
      memRoles.push(roleObj);
      memoryStore.set("roles", memRoles);
    }
    const memPerms = memoryStore.get("permissions") || [];
    if (Array.isArray(permissions)) {
      for (const pName of permissions) {
        if (!memPerms.some((p) => p.name === pName)) {
          memPerms.push({ id: memPerms.length + 1, name: pName, guard_name: "web" });
        }
      }
      memoryStore.set("permissions", memPerms);
    }
    const enabledPermIds = memPerms.filter((p) => Array.isArray(permissions) && permissions.includes(p.name)).map((p) => p.id);
    let rhpList = memoryStore.get("role_has_permissions") || [];
    rhpList = rhpList.filter((rp) => String(rp.role_id) !== String(roleObj.id));
    for (const pid of enabledPermIds) {
      rhpList.push({ role_id: roleObj.id, permission_id: pid });
    }
    memoryStore.set("role_has_permissions", rhpList);
  } catch (e) {
    console.warn("Error sync role permissions MemoryStore:", e);
  }
  invalidateTableCache("roles");
  invalidateTableCache("permissions");
  invalidateTableCache("role_has_permissions");
  broadcastWebSocketMessage({
    event: "db_change",
    table: "role_has_permissions",
    action: "update"
  });
  return res.json({ success: true });
});
app.post("/api/db-truncate-all", async (req, res) => {
  const tables = [
    "rombel_assignment",
    "keamanan",
    "bendahara",
    "perizinan",
    "document_generation_logs",
    "document_templates",
    "santri",
    "kamar",
    "kompleks",
    "kelompok_rombel",
    "kategori_rombel",
    "kelas",
    "lembaga",
    "surat",
    "periode",
    "katalog_pelanggaran",
    "feedback",
    "app_credentials",
    "pesantren_profile"
  ];
  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    } catch (e) {
      console.warn("Could not disable FK checks:", e);
    }
    try {
      for (const table of tables) {
        try {
          if (table === "app_credentials") {
            await pool.query("DELETE FROM `app_credentials` WHERE `id` != 'superadmin'");
          } else if (table === "periode") {
            await pool.query("DELETE FROM `periode` WHERE `id` != 'Semua'");
          } else if (table === "pesantren_profile") {
            await pool.query(
              "UPDATE `pesantren_profile` SET `nama_pesantren` = 'Pondok Pesantren Darussalam Al-Azhar', `nama_yayasan` = 'Yayasan Pendidikan Islam Darussalam' WHERE `id` = 'main'"
            );
          } else {
            await pool.query(`DELETE FROM \`${table}\``);
          }
        } catch (tableErr) {
          console.warn(`Error clearing table '${table}':`, tableErr.message);
        }
      }
    } finally {
      try {
        await pool.query("SET FOREIGN_KEY_CHECKS = 1");
      } catch (e) {
      }
    }
  }
  memoryStore.clear();
  invalidateTableCache();
  broadcastWebSocketMessage({
    event: "db_change",
    action: "truncate_all"
  });
  return res.json({ success: true, message: "Seluruh data telah berhasil dikosongkan." });
});
var getBackupStorageDir = () => {
  if (process.env.BACKUP_DIR && process.env.BACKUP_DIR.trim() !== "") {
    const customDir = process.env.BACKUP_DIR.trim();
    if (!import_fs.default.existsSync(customDir)) {
      try {
        import_fs.default.mkdirSync(customDir, { recursive: true });
      } catch (e) {
      }
    }
    return customDir;
  }
  const hostingerBackupPath = "/home/u648273511/domains/attaroqqy.com/storage/backups";
  try {
    if (!import_fs.default.existsSync(hostingerBackupPath)) {
      import_fs.default.mkdirSync(hostingerBackupPath, { recursive: true });
    }
    return hostingerBackupPath;
  } catch (e) {
    try {
      const upPath = import_path.default.resolve(process.cwd(), "..", "backups");
      if (!import_fs.default.existsSync(upPath)) {
        import_fs.default.mkdirSync(upPath, { recursive: true });
      }
      return upPath;
    } catch (err) {
      const fallbackLocal = import_path.default.join(process.cwd(), "storage_backups");
      if (!import_fs.default.existsSync(fallbackLocal)) {
        try {
          import_fs.default.mkdirSync(fallbackLocal, { recursive: true });
        } catch (err2) {
        }
      }
      return fallbackLocal;
    }
  }
};
function copyFolderRecursiveSync(source, target) {
  if (!import_fs.default.existsSync(source)) return;
  if (!import_fs.default.existsSync(target)) {
    import_fs.default.mkdirSync(target, { recursive: true });
  }
  const entries = import_fs.default.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const curSource = import_path.default.join(source, entry.name);
    const curTarget = import_path.default.join(target, entry.name);
    if (entry.isDirectory()) {
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      import_fs.default.copyFileSync(curSource, curTarget);
    }
  }
}
function getDirectorySizeBytes(dir) {
  if (!import_fs.default.existsSync(dir)) return 0;
  let total = 0;
  try {
    const entries = import_fs.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = import_path.default.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += getDirectorySizeBytes(fullPath);
      } else {
        const stat = import_fs.default.statSync(fullPath);
        total += stat.size;
      }
    }
  } catch (e) {
  }
  return total;
}
function countFilesInDir(dir) {
  if (!import_fs.default.existsSync(dir)) return 0;
  let count = 0;
  try {
    const entries = import_fs.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = import_path.default.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countFilesInDir(fullPath);
      } else {
        count += 1;
      }
    }
  } catch (e) {
  }
  return count;
}
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
function generateSqlDump(allData) {
  let sql = `-- ========================================================
`;
  sql += `-- AttarOkey Database Backup SQL Dump
`;
  sql += `-- Waktu Cadangan: ${(/* @__PURE__ */ new Date()).toISOString()}
`;
  sql += `-- ========================================================

`;
  sql += `SET FOREIGN_KEY_CHECKS = 0;

`;
  for (const [table, rows] of Object.entries(allData)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    sql += `-- --------------------------------------------------------
`;
    sql += `-- Tabel: \`${table}\` (${rows.length} data record)
`;
    sql += `-- --------------------------------------------------------
`;
    sql += `DROP TABLE IF EXISTS \`${table}\`;
`;
    const cols = Object.keys(rows[0]);
    sql += `CREATE TABLE IF NOT EXISTS \`${table}\` (
`;
    const colDefs = cols.map((c) => `  \`${c}\` LONGTEXT NULL`).join(",\n");
    sql += `${colDefs}
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      sql += `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES
`;
      const valLines = chunk.map((row) => {
        const vals = cols.map((c) => {
          const v = row[c];
          if (v === null || v === void 0) return "NULL";
          const str = typeof v === "object" ? JSON.stringify(v) : String(v);
          return `'${str.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
        });
        return `(${vals.join(", ")})`;
      });
      sql += valLines.join(",\n") + ";\n\n";
    }
  }
  sql += `SET FOREIGN_KEY_CHECKS = 1;
`;
  return sql;
}
app.get("/api/backup-system/list", async (req, res) => {
  try {
    const backupDir = getBackupStorageDir();
    if (!import_fs.default.existsSync(backupDir)) {
      return res.json({ success: true, backups: [], storageDir: backupDir });
    }
    const items = import_fs.default.readdirSync(backupDir, { withFileTypes: true });
    const backups = [];
    for (const item of items) {
      if (item.isDirectory() && item.name.startsWith("backup_")) {
        const itemPath = import_path.default.join(backupDir, item.name);
        const metaPath = import_path.default.join(itemPath, "meta.json");
        let meta = null;
        if (import_fs.default.existsSync(metaPath)) {
          try {
            meta = JSON.parse(import_fs.default.readFileSync(metaPath, "utf-8"));
          } catch (e) {
          }
        }
        const hasSql = import_fs.default.existsSync(import_path.default.join(itemPath, "database.sql"));
        const hasJson = import_fs.default.existsSync(import_path.default.join(itemPath, "data.json"));
        const uploadsPath = import_path.default.join(itemPath, "uploads");
        const photosCount = import_fs.default.existsSync(uploadsPath) ? countFilesInDir(uploadsPath) : 0;
        const sizeBytes = getDirectorySizeBytes(itemPath);
        if (!meta) {
          const stat = import_fs.default.statSync(itemPath);
          const timestamp = stat.mtimeMs;
          const formattedDate = new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }).format(new Date(timestamp));
          meta = {
            id: item.name,
            name: `Backup ${formattedDate}`,
            timestamp,
            createdAt: new Date(timestamp).toISOString(),
            formattedDate,
            totalSantri: 0,
            totalPhotos: photosCount,
            sizeBytes,
            formattedSize: formatFileSize(sizeBytes),
            storagePath: itemPath
          };
        }
        meta.hasSql = hasSql;
        meta.hasJson = hasJson;
        meta.totalPhotos = photosCount;
        meta.sizeBytes = sizeBytes;
        meta.formattedSize = formatFileSize(sizeBytes);
        meta.storagePath = itemPath;
        meta.downloadUrl = `/api/backup-system/download/${item.name}`;
        backups.push(meta);
      }
    }
    backups.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return res.json({ success: true, backups, storageDir: backupDir });
  } catch (err) {
    console.error("Error listing backups:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/backup-system/download/:id", (req, res) => {
  try {
    const { id } = req.params;
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const backupStorageDir = getBackupStorageDir();
    const targetBackupPath = import_path.default.join(backupStorageDir, safeId);
    if (!import_fs.default.existsSync(targetBackupPath)) {
      return res.status(404).json({ success: false, error: "Berkas cadangan tidak ditemukan di server." });
    }
    const zip = new import_adm_zip.default();
    zip.addLocalFolder(targetBackupPath);
    const zipBuffer = zip.toBuffer();
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeId}.zip"`,
      "Content-Length": String(zipBuffer.length)
    });
    return res.send(zipBuffer);
  } catch (err) {
    console.error("Error downloading backup zip:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/backup-system/create", async (req, res) => {
  try {
    const backupStorageDir = getBackupStorageDir();
    const timestamp = Date.now();
    const backupId = `backup_${timestamp}`;
    const targetBackupPath = import_path.default.join(backupStorageDir, backupId);
    import_fs.default.mkdirSync(targetBackupPath, { recursive: true });
    const pool = getMySQLPool();
    const allDbData = {};
    for (const table of Array.from(VALID_TABLES)) {
      let rows = [];
      if (pool) {
        const qRes = await tryMySQLQuery(`SELECT * FROM \`${table}\``);
        if (qRes.success && Array.isArray(qRes.rows)) {
          rows = qRes.rows;
        }
      }
      if (rows.length === 0) {
        rows = memoryStore.get(table) || [];
      }
      allDbData[table] = rows;
    }
    import_fs.default.writeFileSync(
      import_path.default.join(targetBackupPath, "data.json"),
      JSON.stringify(allDbData, null, 2),
      "utf-8"
    );
    const sqlDump = generateSqlDump(allDbData);
    import_fs.default.writeFileSync(
      import_path.default.join(targetBackupPath, "database.sql"),
      sqlDump,
      "utf-8"
    );
    const backupUploadsPath = import_path.default.join(targetBackupPath, "uploads");
    import_fs.default.mkdirSync(backupUploadsPath, { recursive: true });
    const sourceUploadDir = getUploadDir();
    if (import_fs.default.existsSync(sourceUploadDir)) {
      copyFolderRecursiveSync(sourceUploadDir, backupUploadsPath);
    }
    const distUploadsPath = import_path.default.join(process.cwd(), "dist", "uploads");
    if (import_fs.default.existsSync(distUploadsPath)) {
      copyFolderRecursiveSync(distUploadsPath, backupUploadsPath);
    }
    const publicUploadsPath = import_path.default.join(process.cwd(), "public", "uploads");
    if (import_fs.default.existsSync(publicUploadsPath)) {
      copyFolderRecursiveSync(publicUploadsPath, backupUploadsPath);
    }
    const totalSantri = Array.isArray(allDbData.santri) ? allDbData.santri.length : 0;
    const totalPhotos = countFilesInDir(backupUploadsPath);
    const sizeBytes = getDirectorySizeBytes(targetBackupPath);
    const now = new Date(timestamp);
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(now);
    const meta = {
      id: backupId,
      name: `Backup ${formattedDate}`,
      timestamp,
      createdAt: now.toISOString(),
      formattedDate,
      totalSantri,
      totalPhotos,
      tablesCount: Object.keys(allDbData).length,
      hasSql: true,
      hasJson: true,
      sizeBytes,
      formattedSize: formatFileSize(sizeBytes),
      storagePath: targetBackupPath,
      downloadUrl: `/api/backup-system/download/${backupId}`
    };
    import_fs.default.writeFileSync(
      import_path.default.join(targetBackupPath, "meta.json"),
      JSON.stringify(meta, null, 2),
      "utf-8"
    );
    console.log(`>>> Berhasil membuat backup aman di ${targetBackupPath} (${totalSantri} santri, ${totalPhotos} foto, ${meta.formattedSize})`);
    return res.json({
      success: true,
      message: "Cadangan data santri, tabel database.sql, dan foto berhasil dibuat di direktori aman.",
      backup: meta
    });
  } catch (err) {
    console.error("Error creating backup:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/backup-system/restore/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const backupStorageDir = getBackupStorageDir();
    const targetBackupPath = import_path.default.join(backupStorageDir, safeId);
    if (!import_fs.default.existsSync(targetBackupPath)) {
      return res.status(404).json({ success: false, error: "Berkas cadangan tidak ditemukan di direktori penyimpanan aman." });
    }
    const dataJsonPath = import_path.default.join(targetBackupPath, "data.json");
    if (!import_fs.default.existsSync(dataJsonPath)) {
      return res.status(400).json({ success: false, error: "Data database (data.json) tidak ditemukan di dalam cadangan." });
    }
    const rawData = import_fs.default.readFileSync(dataJsonPath, "utf-8");
    const restoredDbData = JSON.parse(rawData);
    const pool = getMySQLPool();
    for (const [table, rows] of Object.entries(restoredDbData)) {
      if (!VALID_TABLES.has(table)) continue;
      memoryStore.set(table, Array.isArray(rows) ? rows : []);
      if (pool && Array.isArray(rows)) {
        try {
          await ensureTableExists(table, pool).catch(() => {
          });
          await withTimeout(pool.query(`TRUNCATE TABLE \`${table}\``), 4e3).catch(async () => {
            await withTimeout(pool.query(`DELETE FROM \`${table}\``), 4e3).catch(() => {
            });
          });
          if (rows.length > 0) {
            const existingColumns = await getTableColumns(table, pool);
            const chunkSize = 100;
            for (let i = 0; i < rows.length; i += chunkSize) {
              const chunk = rows.slice(i, i + chunkSize);
              const firstRow = chunk[0];
              let keys = Object.keys(firstRow);
              if (existingColumns) {
                keys = keys.filter((k) => existingColumns.has(k));
              }
              if (keys.length === 0) continue;
              const cols = keys.map((k) => `\`${k}\``).join(", ");
              const rowPlaceholders = `(${keys.map(() => "?").join(", ")})`;
              const allPlaceholders = chunk.map(() => rowPlaceholders).join(", ");
              const values = [];
              for (const row of chunk) {
                for (const k of keys) {
                  const val = row[k];
                  values.push(typeof val === "object" && val !== null ? JSON.stringify(val) : val);
                }
              }
              const sql = `INSERT INTO \`${table}\` (${cols}) VALUES ${allPlaceholders}`;
              await withTimeout(pool.query(sql, values), 1e4).catch((e) => {
                console.warn(`Bulk insert error in ${table} (chunk ${i}):`, e.message);
              });
            }
          }
        } catch (dbErr) {
          console.warn(`Gagal menimpa tabel MySQL '${table}':`, dbErr.message);
        }
      }
    }
    saveMemoryStoreToDisk();
    invalidateTableCache();
    const backupUploadsPath = import_path.default.join(targetBackupPath, "uploads");
    let restoredPhotosCount = 0;
    if (import_fs.default.existsSync(backupUploadsPath)) {
      restoredPhotosCount = countFilesInDir(backupUploadsPath);
      const targetUploadDir = getUploadDir();
      if (!import_fs.default.existsSync(targetUploadDir)) {
        import_fs.default.mkdirSync(targetUploadDir, { recursive: true });
      }
      copyFolderRecursiveSync(backupUploadsPath, targetUploadDir);
      const distUploadsPath = import_path.default.join(process.cwd(), "dist", "uploads");
      if (!import_fs.default.existsSync(distUploadsPath)) {
        import_fs.default.mkdirSync(distUploadsPath, { recursive: true });
      }
      copyFolderRecursiveSync(backupUploadsPath, distUploadsPath);
    }
    broadcastWebSocketMessage({
      event: "db_change",
      action: "restore",
      timestamp: Date.now()
    });
    const totalSantri = Array.isArray(restoredDbData.santri) ? restoredDbData.santri.length : 0;
    console.log(`>>> Pemulihan sukses: ${totalSantri} data santri dan ${restoredPhotosCount} foto dikembalikan menimpa file aktif.`);
    return res.json({
      success: true,
      message: `Data santri (${totalSantri}) dan ${restoredPhotosCount} foto berhasil dikembalikan ke foldernya masing-masing dengan menimpa file lama.`,
      data: restoredDbData
    });
  } catch (err) {
    console.error("Error restoring backup:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.delete("/api/backup-system/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const backupStorageDir = getBackupStorageDir();
    const targetBackupPath = import_path.default.join(backupStorageDir, safeId);
    if (import_fs.default.existsSync(targetBackupPath)) {
      import_fs.default.rmSync(targetBackupPath, { recursive: true, force: true });
      console.log(`>>> Berhasil menghapus cadangan: ${targetBackupPath}`);
      return res.json({ success: true, message: "Cadangan berhasil dihapus." });
    }
    return res.status(404).json({ success: false, error: "Cadangan tidak ditemukan." });
  } catch (err) {
    console.error("Error deleting backup:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
var api_default = app;

// server.ts
var import_meta2 = {};
var __dirname2;
try {
  __dirname2 = import_path2.default.dirname((0, import_url2.fileURLToPath)(import_meta2.url));
} catch {
  __dirname2 = process.cwd();
}
import_dotenv2.default.config();
var PORT = 3e3;
async function startServer() {
  const httpServer = import_http.default.createServer(api_default);
  const wss = new import_ws2.WebSocketServer({ server: httpServer });
  setWssInstance(wss);
  const onlineUsers = /* @__PURE__ */ new Map();
  wss.on("connection", (ws) => {
    let connectedUserId = null;
    ws.send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        } else if (msg.type === "presence_join" && msg.user) {
          connectedUserId = msg.user.id || Math.random().toString(36).substring(2);
          onlineUsers.set(connectedUserId, { ...msg.user, id: connectedUserId, lastSeen: Date.now() });
          broadcastWebSocketMessage({ type: "online_users", users: Array.from(onlineUsers.values()) });
        } else {
          broadcastWebSocketMessage(msg);
        }
      } catch (err) {
        console.error("Error handling WebSocket message:", err);
      }
    });
    ws.on("close", () => {
      if (connectedUserId && onlineUsers.has(connectedUserId)) {
        onlineUsers.delete(connectedUserId);
        broadcastWebSocketMessage({ type: "online_users", users: Array.from(onlineUsers.values()) });
      }
    });
    ws.on("error", (err) => {
      console.warn("WebSocket client error:", err.message);
    });
  });
  const uploadDir = process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim() !== "" ? process.env.UPLOAD_DIR : import_path2.default.join(__dirname2, "public", "uploads");
  const distUploadsPath = import_path2.default.join(process.cwd(), "dist", "uploads");
  if (!import_fs2.default.existsSync(uploadDir)) {
    try {
      import_fs2.default.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
    }
  }
  if (!import_fs2.default.existsSync(distUploadsPath)) {
    try {
      import_fs2.default.mkdirSync(distUploadsPath, { recursive: true });
    } catch (e) {
    }
  }
  api_default.use("/uploads", import_express2.default.static(uploadDir));
  api_default.use("/api/uploads", import_express2.default.static(uploadDir));
  api_default.use("/uploads", import_express2.default.static(distUploadsPath));
  api_default.use("/api/uploads", import_express2.default.static(distUploadsPath));
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa"
    });
    api_default.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    api_default.use(import_express2.default.static(distPath));
    api_default.use("/attaroqqy", import_express2.default.static(distPath));
    api_default.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running with Realtime WebSockets on http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = api_default;
//# sourceMappingURL=server.cjs.map
