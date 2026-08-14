import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { fileURLToPath } from "url";

let __dirname: string;
try {
  // @ts-ignore
  __dirname = path.dirname(fileURLToPath(import.meta.url));
} catch {
  __dirname = process.cwd();
}

// Persistent root directory helper across Hostinger redeploys (hbuilds root containing config, versions, uploads)
const getPersistentRootDir = (): string => {
  let currDir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const hasConfig = fs.existsSync(path.join(currDir, 'config'));
    const hasVersions = fs.existsSync(path.join(currDir, 'versions'));
    const hasHbuilds = currDir.endsWith('hbuilds') || currDir.includes('hbuilds');
    if (hasConfig || hasVersions || hasHbuilds) {
      return currDir;
    }
    const parentDir = path.dirname(currDir);
    if (parentDir === currDir) break;
    currDir = parentDir;
  }
  try {
    const up3 = path.resolve(process.cwd(), "../../../");
    if (fs.existsSync(path.join(up3, 'config')) || fs.existsSync(path.join(up3, 'versions')) || up3.includes('hbuilds')) {
      return up3;
    }
    const up4 = path.resolve(process.cwd(), "../../../../");
    if (up4.includes('hbuilds')) {
      return up4;
    }
  } catch (e) {}
  return process.cwd();
};

// Load .env from persistent root or cwd
const findAndLoadEnv = () => {
  const root = getPersistentRootDir();
  const envPathRoot = path.join(root, '.env');
  if (fs.existsSync(envPathRoot)) {
    dotenv.config({ path: envPathRoot });
  }

  let currDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const envPath = path.join(currDir, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
    const parentDir = path.dirname(currDir);
    if (parentDir === currDir) break;
    currDir = parentDir;
  }
  dotenv.config(); // fallback default
};
findAndLoadEnv();

const app = express();

// WebSocket Instance Management for Realtime Broadcasting
let wssInstance: WebSocketServer | null = null;

export function setWssInstance(wss: WebSocketServer) {
  wssInstance = wss;
}

export function broadcastWebSocketMessage(payload: any) {
  if (!wssInstance) return;
  const msgStr = JSON.stringify(payload);
  wssInstance.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msgStr);
    }
  });
}

// Subpath URL Normalization Middleware
app.use((req, res, next) => {
  if (req.url.includes("/api/")) {
    const apiIndex = req.url.indexOf("/api/");
    req.url = req.url.substring(apiIndex);
  }
  next();
});

// Enable JSON parsing with a 10MB limit for compressed base64 photos
app.use(express.json({ limit: "10mb" }));

// Upload Directory Helper (UPLOAD_DIR env variable with fallback to Hostinger storage/uploads or public/uploads)
const getUploadDir = (): string => {
  if (process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim() !== '') {
    return process.env.UPLOAD_DIR;
  }
  const hostingerPath = '/home/u648273511/domains/attaroqqy.com/storage/uploads';
  try {
    if (!fs.existsSync(hostingerPath)) {
      fs.mkdirSync(hostingerPath, { recursive: true });
    }
    return hostingerPath;
  } catch (e) {
    try {
      return path.join(__dirname, 'public', 'uploads');
    } catch (err) {
      return path.join(process.cwd(), 'public', 'uploads');
    }
  }
};
console.log(">>> UPLOAD_DIR terdeteksi sebagai:", getUploadDir());

// Serve static uploads using UPLOAD_DIR or fallback
const uploadDirStatic = getUploadDir();
if (!fs.existsSync(uploadDirStatic)) {
  try {
    fs.mkdirSync(uploadDirStatic, { recursive: true });
  } catch (e) {}
}
app.use("/uploads", express.static(uploadDirStatic));
app.use("/api/uploads", express.static(uploadDirStatic));
app.use("/uploads", express.static(path.join(process.cwd(), "dist", "uploads")));
app.use("/api/uploads", express.static(path.join(process.cwd(), "dist", "uploads")));

// -------------------------------------------------------------
// 1. MySQL Pool & Memory Store (Fallback) Initialization
// -------------------------------------------------------------
let mysqlPool: mysql.Pool | null = null;
const memoryStore = new Map<string, any[]>();

export function getMySQLPool(): mysql.Pool | null {
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || "localhost";
  const user = process.env.MYSQL_USER || process.env.DB_USER;
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || "";
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE;
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);

  if (!user || !database) {
    return null;
  }

  if (!mysqlPool) {
    try {
      mysqlPool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: true
      });
    } catch (err: any) {
      console.error("Gagal membuat koneksi MySQL Pool:", err.message);
      return null;
    }
  }
  return mysqlPool;
}

export interface LogActivityOptions {
  userId?: number | string | null;
  namaUser: string;
  peran?: string;
  aksi: string;
  deskripsi: string;
  modul?: string;
  req?: express.Request;
  ipAddress?: string;
  userAgent?: string;
}

export async function catatAktivitas(options: LogActivityOptions): Promise<boolean> {
  const {
    userId = null,
    namaUser,
    peran = "Pengurus",
    aksi,
    deskripsi,
    modul = "Umum",
    req,
    ipAddress: customIp,
    userAgent: customUA
  } = options;

  let ipAddress = customIp;
  let userAgent = customUA;

  if (req) {
    const cfIp = req.headers["cf-connecting-ip"];
    const forwarded = req.headers["x-forwarded-for"];
    ipAddress = ipAddress || (
      typeof cfIp === "string" 
        ? cfIp 
        : Array.isArray(forwarded) 
          ? forwarded[0] 
          : (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || "127.0.0.1")
    );
    userAgent = userAgent || req.headers["user-agent"] || "Unknown";
  }

  ipAddress = ipAddress || "127.0.0.1";
  userAgent = userAgent || "Unknown";

  const pool = getMySQLPool();
  if (pool) {
    try {
      const sql = `
        INSERT INTO \`riwayat_aktivitas\`
        (\`user_id\`, \`nama_user\`, \`peran\`, \`aksi\`, \`deskripsi\`, \`modul\`, \`ip_address\`, \`user_agent\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await pool.query(sql, [
        userId ? Number(userId) || null : null,
        namaUser,
        peran,
        aksi,
        deskripsi,
        modul,
        ipAddress,
        userAgent
      ]);
      return true;
    } catch (err: any) {
      console.error("Gagal mencatat riwayat_aktivitas ke MySQL:", err.message);
      return false;
    }
  }

  try {
    const list = memoryStore.get("riwayat_aktivitas") || [];
    list.push({
      id: Date.now(),
      user_id: userId,
      nama_user: namaUser,
      peran,
      aksi,
      deskripsi,
      modul,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    });
    memoryStore.set("riwayat_aktivitas", list);
    return true;
  } catch (err: any) {
    return false;
  }
}

// Whitelist of valid table names to prevent SQL injection
const VALID_TABLES = new Set([
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

// -------------------------------------------------------------
// 2. Status & Utilities Endpoints
// -------------------------------------------------------------
app.get("/api/db-status", async (req, res) => {
  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.query("SELECT 1");
      return res.json({
        connected: true,
        type: "mysql",
        host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
        database: process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE,
        reason: "connected"
      });
    } catch (err: any) {
      console.warn("MySQL ping failed:", err.message);
    }
  }

  res.json({
    connected: true,
    type: "memory",
    reason: "memory_store_active"
  });
});

// Download SQL Schema for Hostinger MySQL
app.get("/api/download-sql-mysql", (req, res) => {
  const filePath = path.join(process.cwd(), "hostinger_mysql_setup.sql");
  res.download(filePath, "hostinger_mysql_setup.sql", (err) => {
    if (err) {
      res.status(500).send("Gagal mengunduh skema SQL MySQL Hostinger");
    }
  });
});

// Storage Stats
app.get("/api/storage-stats", async (req, res) => {
  const pool = getMySQLPool();
  if (pool) {
    try {
      const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.DB_DATABASE;
      const [rows]: any = await pool.query(
        "SELECT SUM(data_length + index_length) AS db_size FROM information_schema.TABLES WHERE table_schema = ?",
        [dbName]
      );
      const dbSize = rows?.[0]?.db_size ? Number(rows[0].db_size) : 1250000;
      return res.json({
        success: true,
        databaseSize: dbSize,
        bucketSize: 2400000,
        isFallback: false
      });
    } catch (err: any) {}
  }

  res.json({
    success: true,
    databaseSize: 1250000,
    bucketSize: 2400000,
    isFallback: true
  });
});

// Helper to strip password from app_credentials output for security
function stripPassword(table: string, data: any): any {
  if (table !== "app_credentials" || !data) return data;
  if (Array.isArray(data)) {
    return data.map(item => {
      const { password, ...rest } = item;
      return rest;
    });
  }
  const { password, ...rest } = data;
  return rest;
}

// -------------------------------------------------------------
// 3. Authentication Endpoint
// -------------------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const emailLower = (username || "").trim().toLowerCase();
  const defaultUser = 'superadmin@attaroqqy.com';
  const defaultPass = '1234';

  const pool = getMySQLPool();
  if (pool) {
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM `app_credentials` WHERE LOWER(`username`) = ? LIMIT 1",
        [emailLower]
      );

      let matchedUser = rows?.[0];

      if (!matchedUser && emailLower === defaultUser && password === defaultPass) {
        const newId = 'superadmin';
        await pool.query(
          "INSERT INTO `app_credentials` (`id`, `username`, `password`, `role`, `status`) VALUES (?, ?, ?, 'superadmin', 'approved') ON DUPLICATE KEY UPDATE `id`=`id`",
          [newId, defaultUser, defaultPass]
        );
        return res.json({
          success: true,
          user: {
            id: newId,
            username: defaultUser,
            role: 'superadmin',
            status: 'approved'
          }
        });
      }

      if (!matchedUser) {
        return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah atau akun Anda tidak terdaftar." });
      }

      if (matchedUser.password !== password) {
        return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah." });
      }

      if (matchedUser.status === 'pending') {
        return res.status(403).json({ success: false, error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin." });
      } else if (matchedUser.status === 'rejected') {
        return res.status(403).json({ success: false, error: "Akses Ditolak: Pendaftaran akun Anda ditolak oleh Superadmin." });
      }

      return res.json({
        success: true,
        needsCancelReset: matchedUser.status === 'minta_reset',
        user: {
          id: matchedUser.id,
          username: matchedUser.username,
          role: matchedUser.role,
          status: matchedUser.status,
          displayName: matchedUser.display_name || matchedUser.displayName,
          avatarUrl: matchedUser.avatar_url || matchedUser.avatarUrl
        }
      });
    } catch (err: any) {
      console.error("MySQL Auth login error:", err);
    }
  }

  // Memory store fallback authentication
  const list = memoryStore.get("app_credentials") || [];
  let matchedUser = list.find((u: any) => (u.username || "").toLowerCase() === emailLower);

  if (!matchedUser && emailLower === defaultUser && password === defaultPass) {
    matchedUser = {
      id: "superadmin",
      username: defaultUser,
      password: defaultPass,
      role: "superadmin",
      status: "approved"
    };
    list.push(matchedUser);
    memoryStore.set("app_credentials", list);
  }

  if (!matchedUser) {
    return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah atau akun Anda tidak terdaftar." });
  }

  if (matchedUser.password !== password) {
    return res.status(401).json({ success: false, error: "Email atau Kata Sandi salah." });
  }

  if (matchedUser.status === 'pending') {
    return res.status(403).json({ success: false, error: "Sesi Tertunda: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Superadmin." });
  } else if (matchedUser.status === 'rejected') {
    return res.status(403).json({ success: false, error: "Akses Ditolak: Pendaftaran akun Anda ditolak oleh Superadmin." });
  }

  return res.json({
    success: true,
    needsCancelReset: matchedUser.status === 'minta_reset',
    user: {
      id: matchedUser.id,
      username: matchedUser.username,
      role: matchedUser.role,
      status: matchedUser.status,
      displayName: matchedUser.display_name || matchedUser.displayName,
      avatarUrl: matchedUser.avatar_url || matchedUser.avatarUrl
    }
  });
});

// -------------------------------------------------------------
// 4. Storage Upload Endpoint (Files & Photos)
// -------------------------------------------------------------
app.post("/api/upload", async (req, res) => {
  try {
    const { fileName, fileBase64, category } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: "fileName and fileBase64 are required" });
    }

    const subFolder = (category || 'dokumen').replace(/[^a-zA-Z0-9_-]/g, '_');
    const buffer = Buffer.from(fileBase64, "base64");

    const uploadBase = getUploadDir();
    const targetDir = path.join(uploadBase, subFolder);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, fileName);
    fs.writeFileSync(targetFilePath, buffer);

    const publicUrl = `/api/uploads/${subFolder}/${fileName}`;

    res.json({
      success: true,
      path: publicUrl,
      publicUrl: publicUrl
    });
  } catch (err: any) {
    console.error("Storage upload handler error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve uploaded files securely via /api/uploads
app.get("/api/uploads/:category/:fileName", (req, res) => {
  try {
    const { category, fileName } = req.params;
    const safeCategory = (category || 'dokumen').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = (fileName || '').replace(/[^a-zA-Z0-9_.-]/g, '_');

    const uploadBase = getUploadDir();
    const targetFilePath = path.join(uploadBase, safeCategory, safeFileName);

    if (fs.existsSync(targetFilePath)) {
      return res.sendFile(targetFilePath);
    }

    res.status(404).json({ error: "File not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// File Storage Cleanup Helpers & Explicit Delete Endpoint
function deleteFileByUrlOrPath(fileUrlOrPath: string) {
  if (!fileUrlOrPath || typeof fileUrlOrPath !== 'string') return;
  try {
    let cleanPath = fileUrlOrPath.trim();
    if (cleanPath.startsWith('/api/uploads/')) {
      cleanPath = cleanPath.replace('/api/uploads/', '');
    } else if (cleanPath.startsWith('/uploads/')) {
      cleanPath = cleanPath.replace('/uploads/', '');
    } else if (cleanPath.includes('/uploads/')) {
      const idx = cleanPath.indexOf('/uploads/');
      cleanPath = cleanPath.substring(idx + 9);
    }

    const uploadBase = getUploadDir();
    const fullPath = path.join(uploadBase, cleanPath);
    
    const resolvedUploadBase = path.resolve(uploadBase);
    const resolvedFullPath = path.resolve(fullPath);
    if (resolvedFullPath.startsWith(resolvedUploadBase) && fs.existsSync(resolvedFullPath)) {
      fs.unlinkSync(resolvedFullPath);
      console.log(">>> Berhasil auto-delete file dari storage:", resolvedFullPath);
    }
  } catch (err: any) {
    console.warn("Gagal auto-delete file dari storage:", err.message);
  }
}

function collectFileUrls(obj: any, urls = new Set<string>()): Set<string> {
  if (!obj) return urls;
  if (typeof obj === 'string') {
    let s = obj.trim();
    if (s.includes('/uploads/') || s.includes('/api/uploads/')) {
      urls.add(s);
    }
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      try {
        const parsed = JSON.parse(s);
        collectFileUrls(parsed, urls);
      } catch (e) {}
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      collectFileUrls(item, urls);
    }
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      collectFileUrls(obj[key], urls);
    }
  }
  return urls;
}

function extractAndCleanFilesFromRecord(record: any) {
  if (!record || typeof record !== 'object') return;
  const urls = collectFileUrls(record);
  for (const url of urls) {
    deleteFileByUrlOrPath(url);
  }
}

function cleanupReplacedFiles(oldRecord: any, newRecord: any) {
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. Generic DB Table Operations & Realtime Broadcasting
// -------------------------------------------------------------
function packPendidikanFormal(payload: any): any {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.map(packPendidikanFormal);
  const copy = { ...payload };
  const pfVal = String(copy.pendidikan_formal ?? copy.pendidikanFormal ?? "").trim();

  if (pfVal && pfVal.toLowerCase() !== 'tanpa kelas' && pfVal.toLowerCase() !== 'tidak terdaftar' && pfVal.toLowerCase() !== 'tidak sekolah') {
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

function unpackPendidikanFormal(data: any): any {
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

function sanitizePayload(payload: any): any {
  if (!payload) return payload;
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item));
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

const DEFAULT_ROLE_NAMES = [
  'superadmin',
  'sekretaris_putra',
  'sekretaris_putri',
  'bendahara_putra',
  'bendahara_putri',
  'kepala_keamanan',
  'keamanan_putra',
  'keamanan_putri',
  'humasy_putra',
  'humasy_putri',
  'pendidikan_putra',
  'pendidikan_putri'
];

const DEFAULT_MODULES = [
  'sekretaris_putra', 'sekretaris_putri',
  'bendahara_putra', 'bendahara_putri',
  'keamanan_putra', 'keamanan_putri',
  'humasy_putra', 'humasy_putri',
  'pendidikan_putra', 'pendidikan_putri'
];

const DEFAULT_ACTIONS = ['view', 'write'];

const DEFAULT_PERMISSIONS: string[] = [];
DEFAULT_MODULES.forEach(m => {
  DEFAULT_ACTIONS.forEach(a => {
    DEFAULT_PERMISSIONS.push(`${m}.${a}`);
  });
});

async function ensurePermissionsTablesAndSeed(pool: mysql.Pool | null) {
  if (pool) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`permissions\` (
          \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`guard_name\` VARCHAR(255) NOT NULL DEFAULT 'web',
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY \`permissions_name_guard\` (\`name\`, \`guard_name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`roles\` (
          \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`guard_name\` VARCHAR(255) NOT NULL DEFAULT 'web',
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY \`roles_name_guard\` (\`name\`, \`guard_name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`role_has_permissions\` (
          \`permission_id\` BIGINT NOT NULL,
          \`role_id\` BIGINT NOT NULL,
          PRIMARY KEY (\`permission_id\`, \`role_id\`),
          FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      for (const roleName of DEFAULT_ROLE_NAMES) {
        await pool.query(
          "INSERT INTO `roles` (`name`, `guard_name`) VALUES (?, 'web') ON DUPLICATE KEY UPDATE `name`=`name`",
          [roleName]
        );
      }

      for (const permName of DEFAULT_PERMISSIONS) {
        await pool.query(
          "INSERT INTO `permissions` (`name`, `guard_name`) VALUES (?, 'web') ON DUPLICATE KEY UPDATE `name`=`name`",
          [permName]
        );
      }

      const [rhpRows]: any = await pool.query("SELECT COUNT(*) as cnt FROM `role_has_permissions`");
      if (!rhpRows?.[0]?.cnt || rhpRows[0].cnt === 0) {
        const [rRows]: any = await pool.query("SELECT `id`, `name` FROM `roles`");
        const [pRows]: any = await pool.query("SELECT `id`, `name` FROM `permissions`");

        const roleMap = new Map<string, number>();
        (rRows || []).forEach((r: any) => roleMap.set(r.name, r.id));

        const permMap = new Map<string, number>();
        (pRows || []).forEach((p: any) => permMap.set(p.name, p.id));

        for (const rName of DEFAULT_ROLE_NAMES) {
          const rId = roleMap.get(rName);
          if (!rId) continue;

          for (const pName of DEFAULT_PERMISSIONS) {
            const pId = permMap.get(pName);
            if (!pId) continue;

            const parts = pName.split('.');
            const mod = parts[0];
            const act = parts[1];

            let isAllowed = false;
            if (rName === 'superadmin') {
              isAllowed = true;
            } else if (rName === mod) {
              isAllowed = true;
            } else if (rName === 'kepala_keamanan' && (mod === 'keamanan_putra' || mod === 'keamanan_putri')) {
              isAllowed = true;
            } else if (rName === 'keamanan_putra' && mod === 'keamanan_putra' && act === 'view') {
              isAllowed = true;
            } else if (rName === 'keamanan_putri' && mod === 'keamanan_putri' && act === 'view') {
              isAllowed = true;
            } else if (act === 'view') {
              isAllowed = true;
            }

            if (isAllowed) {
              await pool.query(
                "INSERT IGNORE INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES (?, ?)",
                [rId, pId]
              ).catch(() => {});
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("Could not seed permissions tables in MySQL:", err.message);
    }
  }

  if (!memoryStore.has('roles') || (memoryStore.get('roles')?.length || 0) === 0) {
    const rolesList = DEFAULT_ROLE_NAMES.map((name, i) => ({ id: i + 1, name, guard_name: 'web' }));
    memoryStore.set('roles', rolesList);
  }

  if (!memoryStore.has('permissions') || (memoryStore.get('permissions')?.length || 0) === 0) {
    const permsList = DEFAULT_PERMISSIONS.map((name, i) => ({ id: i + 1, name, guard_name: 'web' }));
    memoryStore.set('permissions', permsList);
  }

  if (!memoryStore.has('role_has_permissions') || (memoryStore.get('role_has_permissions')?.length || 0) === 0) {
    const rhpList: { role_id: number; permission_id: number }[] = [];
    const rolesList = memoryStore.get('roles') || [];
    const permsList = memoryStore.get('permissions') || [];

    rolesList.forEach((r: any) => {
      permsList.forEach((p: any) => {
        const parts = p.name.split('.');
        const mod = parts[0];
        const act = parts[1];
        let isAllowed = false;
        if (r.name === 'superadmin') isAllowed = true;
        else if (r.name === mod) isAllowed = true;
        else if (r.name === 'kepala_keamanan' && (mod === 'keamanan_putra' || mod === 'keamanan_putri')) isAllowed = true;
        else if (r.name === 'keamanan_putra' && mod === 'keamanan_putra' && act === 'view') isAllowed = true;
        else if (r.name === 'keamanan_putri' && mod === 'keamanan_putri' && act === 'view') isAllowed = true;
        else if (act === 'view') isAllowed = true;

        if (isAllowed) {
          rhpList.push({ role_id: r.id, permission_id: p.id });
        }
      });
    });
    memoryStore.set('role_has_permissions', rhpList);
  }
}

async function ensureTableExists(table: string, pool: mysql.Pool) {
  if (table === 'roles' || table === 'permissions' || table === 'role_has_permissions') {
    await ensurePermissionsTablesAndSeed(pool);
    return;
  }
  if (table === 'admin_chat') {
    try {
      await pool.query(`
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
      `);

      const columnsToEnsure = ['sender_username', 'sender_name', 'sender_role', 'sender_avatar', 'recipient_role', 'message', 'text', 'timestamp', 'sender', 'senderRole', 'reply_to'];
      for (const col of columnsToEnsure) {
        try {
          await pool.query(`ALTER TABLE \`admin_chat\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
        } catch (e) {
          // Column already exists or table structure error, ignore
        }
      }
    } catch (e) {
      console.warn("Could not auto-create admin_chat table:", e);
    }
  } else if (table === 'lembaga') {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`lembaga\` (
          \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
          \`nama\` VARCHAR(100) NOT NULL,
          \`kode\` VARCHAR(20) NOT NULL,
          \`deskripsi\` LONGTEXT NULL,
          \`gender\` VARCHAR(10) DEFAULT 'Putra',
          \`jenis\` VARCHAR(20) DEFAULT 'Internal',
          \`logo\` LONGTEXT NULL,
          \`ta_mulai_tanggal\` INT DEFAULT 1,
          \`ta_mulai_bulan\` INT DEFAULT 7,
          \`ta_selesai_tanggal\` INT DEFAULT 30,
          \`ta_selesai_bulan\` INT DEFAULT 6,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      const cols = ['logo', 'deskripsi', 'kode', 'gender', 'jenis', 'ta_mulai_tanggal', 'ta_mulai_bulan', 'ta_selesai_tanggal', 'ta_selesai_bulan'];
      for (const col of cols) {
        try {
          await pool.query(`ALTER TABLE \`lembaga\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
        } catch (e) {}
      }
    } catch (e) {
      console.warn("Could not auto-create lembaga table:", e);
    }
  } else if (table === 'tugas' || table === 'tasks') {
    try {
      await pool.query(`
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
      `);
      await pool.query(`
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
      `);

      const tugasCols = ['text', 'description', 'deadline_timestamp', 'deadlineTimestamp', 'color', 'createdAt', 'user_id', 'username', 'judul', 'deskripsi', 'status', 'prioritas', 'tenggat_waktu'];
      for (const col of tugasCols) {
        try {
          await pool.query(`ALTER TABLE \`tugas\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
        } catch (e) {}
        try {
          await pool.query(`ALTER TABLE \`tasks\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
        } catch (e) {}
      }
    } catch (e) {
      console.warn("Could not auto-create tasks/tugas table:", e);
    }
  } else if (table === 'feedback') {
    try {
      await pool.query(`
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
      `);

      const feedbackCols = ['sender_username', 'sender_email', 'sender_role', 'message', 'content', 'is_starred', 'isStarred', 'status', 'created_at', 'createdAt'];
      for (const col of feedbackCols) {
        try {
          if (col === 'status') {
            await pool.query(`ALTER TABLE \`feedback\` ADD COLUMN \`status\` VARCHAR(100) DEFAULT 'Belum dikerjakan'`);
          } else if (col === 'is_starred' || col === 'isStarred') {
            await pool.query(`ALTER TABLE \`feedback\` ADD COLUMN \`${col}\` TINYINT(1) DEFAULT 0`);
          } else {
            await pool.query(`ALTER TABLE \`feedback\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn("Could not auto-create feedback table:", e);
    }
  } else if (table === 'perizinan') {
    try {
      await pool.query(`
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
      `);
      const cols = ['santri_id', 'nama_santri', 'alasan', 'status', 'tgl_keluar', 'tgl_kembali'];
      for (const col of cols) {
        try {
          await pool.query(`ALTER TABLE \`perizinan\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
        } catch (e) {}
      }
    } catch (e) {}
  } else if (table === 'keamanan') {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`keamanan\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`santri_id\` VARCHAR(100) NULL,
          \`nama_santri\` VARCHAR(255) NULL,
          \`pelanggaran\` LONGTEXT NULL,
          \`poin\` INT DEFAULT 0,
          \`status\` VARCHAR(100) DEFAULT 'Belum Selesai',
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      const cols = ['santri_id', 'nama_santri', 'pelanggaran', 'poin', 'status'];
      for (const col of cols) {
        try {
          await pool.query(`ALTER TABLE \`keamanan\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
        } catch (e) {}
      }
    } catch (e) {}
  } else if (table === 'riwayat_aktivitas') {
    try {
      await pool.query(`
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
      `);
      const cols = ['user_id', 'nama_user', 'peran', 'aksi', 'deskripsi', 'modul', 'ip_address', 'user_agent', 'created_at'];
      for (const col of cols) {
        try {
          if (col === 'created_at') {
            await pool.query(`ALTER TABLE \`riwayat_aktivitas\` ADD COLUMN \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP`);
          } else {
            await pool.query(`ALTER TABLE \`riwayat_aktivitas\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
          }
        } catch (e) {}
      }
    } catch (e) {}
  } else if (table === 'app_credentials') {
    try {
      await pool.query(`
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
      `);
      const cols = ['username', 'password', 'role', 'status', 'displayName', 'display_name', 'nama', 'avatarUrl', 'avatar_url', 'created_at'];
      for (const col of cols) {
        try {
          await pool.query(`ALTER TABLE \`app_credentials\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
        } catch (e) {}
      }
    } catch (e) {}
  } else if (table === 'santri') {
    try {
      const santriCols = [
        'induk_mhd', 'induk_wustho', 'induk_ulya',
        'nisn', 'nik', 'no_kk', 'tempat_lahir', 'tanggal_lahir',
        'anak_ke', 'dari_bersaudara', 'nama_ayah', 'nik_ayah',
        'pekerjaan_ayah', 'pendidikan_ayah', 'nama_ibu', 'nik_ibu',
        'pekerjaan_ibu', 'pendidikan_ibu', 'alamat', 'rt', 'rw',
        'desa', 'kecamatan', 'kabupaten', 'provinsi', 'jarak_rumah',
        'no_hp', 'status_keanggotaan', 'status_domisili', 'status_emis',
        'status_verval', 'tanggal_keluar', 'catatan', 'nomor_lemari',
        'pendidikan_terakhir', 'pendidikan_formal', 'pendidikan_internal', 'kelas_id'
      ];
      for (const col of santriCols) {
        try {
          await pool.query(`ALTER TABLE \`santri\` ADD COLUMN \`${col}\` LONGTEXT NULL`);
        } catch (e) {}
      }
    } catch (e) {}
  }
}

async function getTableColumns(table: string, pool: mysql.Pool): Promise<Set<string> | null> {
  try {
    const [rows]: any = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
    if (Array.isArray(rows)) {
      return new Set(rows.map((r: any) => r.Field));
    }
  } catch (err) {
    console.warn(`Could not get columns for ${table}:`, err);
  }
  return null;
}

async function tryMySQLQuery(sql: string, params: any[] = []): Promise<{ success: boolean; rows?: any; error?: any }> {
  const pool = getMySQLPool();
  if (!pool) return { success: false, error: "NO_MYSQL" };

  try {
    const [rows]: any = await pool.query(sql, params);
    return { success: true, rows };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

// GET /api/db/:table
app.get("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }

  const pool = getMySQLPool();
  if (pool) {
    await ensureTableExists(table, pool);
  }

  const mysqlRes = await tryMySQLQuery(`SELECT * FROM \`${table}\``);
  if (mysqlRes.success) {
    let finalData = stripPassword(table, mysqlRes.rows || []);
    if (table === "santri") {
      finalData = unpackPendidikanFormal(finalData);
    }
    return res.json({ success: true, data: finalData });
  }

  // Fallback memory store
  let data = memoryStore.get(table) || [];
  let finalData = stripPassword(table, data);
  if (table === "santri") {
    finalData = unpackPendidikanFormal(finalData);
  }
  res.json({ success: true, data: finalData });
});

// POST /api/db/:table
app.post("/api/db/:table", async (req, res) => {
  const { table } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }

  let sanitizedBody = sanitizePayload(req.body);
  if (table === "kelas") {
    delete sanitizedBody.tingkatan;
    delete sanitizedBody.kapasitas;
    delete sanitizedBody.tingkatan_kelas;
    delete sanitizedBody.kapasitas_kelas;
  } else if (table === "santri") {
    sanitizedBody = packPendidikanFormal(sanitizedBody);
  }

  const rowsToInsert = Array.isArray(sanitizedBody) ? sanitizedBody : [sanitizedBody];
  const insertedResults: any[] = [];

  const pool = getMySQLPool();
  if (pool) {
    await ensureTableExists(table, pool);
    const existingColumns = await getTableColumns(table, pool);
    try {
      for (const row of rowsToInsert) {
        if (!row.id) {
          row.id = String(Date.now()) + Math.random().toString(36).substring(2, 7);
        }
        let existingRow: any = null;
        try {
          const [eRows]: any = await pool.query(`SELECT * FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`, [row.id]);
          if (eRows?.[0]) existingRow = eRows[0];
        } catch (e) {}
        if (!existingRow) {
          const list = memoryStore.get(table) || [];
          existingRow = list.find((item: any) => item.id === row.id);
        }
        if (existingRow) {
          cleanupReplacedFiles(existingRow, row);
        }

        let keys = Object.keys(row);
        if (existingColumns) {
          keys = keys.filter(k => existingColumns.has(k));
        }
        if (keys.length === 0) continue;

        const columns = keys.map(k => `\`${k}\``).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map(k => (typeof row[k] === "object" && row[k] !== null ? JSON.stringify(row[k]) : row[k]));
        const updateClause = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");

        const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
        await pool.query(sql, values);
        insertedResults.push(row);
      }
    } catch (err: any) {
      console.warn(`MySQL POST /api/db/${table} error:`, err.message);
    }
  }

  // Memory store mirror
  let list = memoryStore.get(table) || [];
  for (const row of rowsToInsert) {
    if (!row.id) {
      row.id = String(Date.now()) + Math.random().toString(36).substring(2, 7);
    }
    const idx = list.findIndex((item: any) => item.id === row.id);
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

  let resultData = stripPassword(table, Array.isArray(sanitizedBody) ? insertedResults : insertedResults[0]);
  if (table === "santri") {
    resultData = unpackPendidikanFormal(resultData);
  }

  // Realtime WebSocket broadcast
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "insert",
    data: resultData
  });

  return res.json({ success: true, data: resultData });
});

// PUT /api/db/:table/:id
app.put("/api/db/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }

  let sanitizedBody = sanitizePayload(req.body);
  if (table === "kelas") {
    delete sanitizedBody.tingkatan;
    delete sanitizedBody.kapasitas;
    delete sanitizedBody.tingkatan_kelas;
    delete sanitizedBody.kapasitas_kelas;
  } else if (table === "santri") {
    sanitizedBody = packPendidikanFormal(sanitizedBody);
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

  let updatedResult: any = { id, ...sanitizedBody };

  const pool = getMySQLPool();
  let existingOldRecord: any = null;
  if (pool) {
    try {
      await ensureTableExists(table, pool);
      const [rows]: any = await pool.query(`SELECT * FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`, [id]);
      if (rows?.[0]) existingOldRecord = rows[0];
    } catch (e) {}
  }
  if (!existingOldRecord) {
    const list = memoryStore.get(table) || [];
    existingOldRecord = list.find((item: any) => item.id === id);
  }
  if (existingOldRecord) {
    cleanupReplacedFiles(existingOldRecord, { id, ...sanitizedBody });
  }

  if (pool) {
    try {
      const existingColumns = await getTableColumns(table, pool);
      const updateData = { ...sanitizedBody };
      delete updateData.id;
      let keys = Object.keys(updateData);
      if (existingColumns) {
        keys = keys.filter(k => existingColumns.has(k));
      }

      if (keys.length > 0) {
        const setClause = keys.map(k => `\`${k}\` = ?`).join(", ");
        const values = keys.map(k => (typeof updateData[k] === "object" && updateData[k] !== null ? JSON.stringify(updateData[k]) : updateData[k]));
        values.push(id);

        const sql = `UPDATE \`${table}\` SET ${setClause} WHERE \`id\` = ?`;
        await pool.query(sql, values);
      }

      const [rows]: any = await pool.query(`SELECT * FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`, [id]);
      if (rows?.[0]) updatedResult = rows[0];
    } catch (err: any) {
      console.warn(`MySQL PUT /api/db/${table}/${id} error:`, err.message);
    }
  }

  // Memory store mirror
  let list = memoryStore.get(table) || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...sanitizedBody, id };
  } else {
    list.push({ id, ...sanitizedBody });
  }
  memoryStore.set(table, list);

  let resultData = stripPassword(table, updatedResult);
  if (table === "santri") {
    resultData = unpackPendidikanFormal(resultData);
  }

  // Realtime WebSocket broadcast
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "update",
    id,
    data: resultData
  });

  return res.json({ success: true, data: resultData });
});

// DELETE /api/db/:table/:id
app.delete("/api/db/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!VALID_TABLES.has(table)) {
    return res.status(400).json({ success: false, error: `Tabel '${table}' tidak valid` });
  }

  const pool = getMySQLPool();
  let existingRecordToDelete: any = null;
  if (pool) {
    try {
      if (table === "santri") {
        const [sRows]: any = await pool.query("SELECT * FROM `santri` WHERE `id` = ? LIMIT 1", [id]);
        if (sRows?.[0]) existingRecordToDelete = sRows[0];
        const santriNama = existingRecordToDelete?.nama;

        await pool.query("DELETE FROM `rombel_assignment` WHERE `santri_id` = ?", [id]);
        if (santriNama) {
          await pool.query("DELETE FROM `perizinan` WHERE `santri_id` = ? OR `nama_santri` = ?", [id, santriNama]);
          await pool.query("DELETE FROM `keamanan` WHERE `santri_id` = ? OR `nama_santri` = ?", [id, santriNama]);
          await pool.query("DELETE FROM `bendahara` WHERE `nama_santri` = ?", [santriNama]);
        } else {
          await pool.query("DELETE FROM `perizinan` WHERE `santri_id` = ?", [id]);
          await pool.query("DELETE FROM `keamanan` WHERE `santri_id` = ?", [id]);
        }
      } else {
        const [rows]: any = await pool.query(`SELECT * FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`, [id]);
        if (rows?.[0]) existingRecordToDelete = rows[0];
      }
    } catch (e) {}
  }
  if (!existingRecordToDelete) {
    const list = memoryStore.get(table) || [];
    existingRecordToDelete = list.find((item: any) => item.id === id);
  }
  if (existingRecordToDelete) {
    extractAndCleanFilesFromRecord(existingRecordToDelete);
  }

  if (pool) {
    try {
      await pool.query(`DELETE FROM \`${table}\` WHERE \`id\` = ?`, [id]);
    } catch (err: any) {
      console.warn(`MySQL DELETE /api/db/${table}/${id} error:`, err.message);
    }
  }

  // Memory store mirror
  let list = memoryStore.get(table) || [];
  memoryStore.set(table, list.filter((item: any) => item.id !== id));

  // Realtime WebSocket broadcast
  broadcastWebSocketMessage({
    event: "db_change",
    table,
    action: "delete",
    id
  });

  return res.json({ success: true });
});

// Role Permissions Sync
app.post("/api/sync-role-permissions", async (req, res) => {
  const { roleName, permissions } = req.body;

  const pool = getMySQLPool();
  await ensurePermissionsTablesAndSeed(pool);

  if (pool) {
    try {
      let [rRows]: any = await pool.query("SELECT `id` FROM `roles` WHERE `name` = ? LIMIT 1", [roleName]);
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

        const [pRows]: any = await pool.query("SELECT `id`, `name` FROM `permissions`");
        const enabledPermIds = (pRows || [])
          .filter((p: any) => Array.isArray(permissions) && permissions.includes(p.name))
          .map((p: any) => p.id);

        await pool.query("DELETE FROM `role_has_permissions` WHERE `role_id` = ?", [roleId]);

        for (const pid of enabledPermIds) {
          await pool.query("INSERT IGNORE INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES (?, ?)", [roleId, pid]);
        }
      }
    } catch (err: any) {
      console.warn("Error sync role permissions MySQL:", err.message);
    }
  }

  try {
    const memRoles = memoryStore.get('roles') || [];
    let roleObj = memRoles.find((r: any) => r.name === roleName);
    if (!roleObj) {
      roleObj = { id: memRoles.length + 1, name: roleName, guard_name: 'web' };
      memRoles.push(roleObj);
      memoryStore.set('roles', memRoles);
    }

    const memPerms = memoryStore.get('permissions') || [];
    if (Array.isArray(permissions)) {
      for (const pName of permissions) {
        if (!memPerms.some((p: any) => p.name === pName)) {
          memPerms.push({ id: memPerms.length + 1, name: pName, guard_name: 'web' });
        }
      }
      memoryStore.set('permissions', memPerms);
    }

    const enabledPermIds = memPerms
      .filter((p: any) => Array.isArray(permissions) && permissions.includes(p.name))
      .map((p: any) => p.id);

    let rhpList = memoryStore.get('role_has_permissions') || [];
    rhpList = rhpList.filter((rp: any) => String(rp.role_id) !== String(roleObj.id));
    for (const pid of enabledPermIds) {
      rhpList.push({ role_id: roleObj.id, permission_id: pid });
    }
    memoryStore.set('role_has_permissions', rhpList);
  } catch (e) {
    console.warn("Error sync role permissions MemoryStore:", e);
  }

  broadcastWebSocketMessage({
    event: "db_change",
    table: "role_has_permissions",
    action: "update"
  });

  return res.json({ success: true });
});

// Truncate all tables for administrative reset
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
        } catch (tableErr: any) {
          console.warn(`Error clearing table '${table}':`, tableErr.message);
        }
      }
    } finally {
      try {
        await pool.query("SET FOREIGN_KEY_CHECKS = 1");
      } catch (e) {}
    }
  }

  memoryStore.clear();

  broadcastWebSocketMessage({
    event: "db_change",
    action: "truncate_all"
  });

  return res.json({ success: true, message: "Seluruh data telah berhasil dikosongkan." });
});

export default app;
