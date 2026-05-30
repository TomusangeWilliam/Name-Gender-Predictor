const fs = require("fs/promises");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");
const http = require("http");
const { exec, spawn } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const Database = require("better-sqlite3");

/**
 * Helper to run git commands with stdin support and better error handling.
 */
function runGitCommand(args, input = null) {
  return new Promise((resolve, reject) => {
    const REPO_DIR = __dirname; // add this once at top of file
    const process = spawn("git", args, { cwd: REPO_DIR });
    let stdout = "";
    let stderr = "";

    if (input !== null) {
      process.stdin.write(input);
      process.stdin.end();
    }

    process.stdout.on("data", (data) => (stdout += data.toString()));
    process.stderr.on("data", (data) => (stderr += data.toString()));

    process.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const err = new Error(`Git command failed with code ${code}`);
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}

const app = express();
let server = http.createServer(app);
let io = new Server(server);

// --- DATABASE INITIALIZATION ---
const db = new Database("database.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS names (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    category TEXT,
    added INTEGER,
    deleted INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_names_category ON names(category);
  CREATE INDEX IF NOT EXISTS idx_names_name ON names(name);
`);

// Pre-compiled statements for performance
const queries = {
  getNamesByCategory: db.prepare("SELECT name FROM names WHERE category = ? ORDER BY id ASC"),
  countNamesByCategory: db.prepare("SELECT COUNT(*) as count FROM names WHERE category = ?"),
  insertName: db.prepare("INSERT OR IGNORE INTO names (name, category) VALUES (?, ?)"),
  deleteNamesByCategory: db.prepare("DELETE FROM names WHERE category = ? AND name = ?"),
  updateName: db.prepare("UPDATE names SET name = ? WHERE category = ? AND name = ?"),
  searchNames: db.prepare(`
    SELECT name FROM names 
    WHERE category = ? 
    AND (name LIKE ?) 
    AND (length(name) = ? OR ? = 0)
    ORDER BY name ASC 
    LIMIT ? OFFSET ?
  `),
  countSearchResults: db.prepare(`
    SELECT COUNT(*) as count FROM names 
    WHERE category = ? 
    AND (name LIKE ?) 
    AND (length(name) = ? OR ? = 0)
  `),
  getAuditLogs: db.prepare("SELECT timestamp as t, category as c, added as a, deleted as d FROM audit_log ORDER BY timestamp DESC LIMIT 1000"),
  insertAuditLog: db.prepare("INSERT INTO audit_log (timestamp, category, added, deleted) VALUES (?, ?, ?, ?)"),
  getAnalyticsByCategory: db.prepare("SELECT name FROM names WHERE category = ?"),
};

app.use(express.json({ limit: "2mb" }));

function emitDataChange(category = "all", reason = "update") {
  io.emit("data-changed", { category, reason, timestamp: Date.now() });
}

const activePresences = new Map();
const PRESENCE_COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
let guestCounter = 1;

function setupSocket(ioInstance) {
  ioInstance.on("connection", (socket) => {
    const authName = socket.handshake.auth && socket.handshake.auth.username;
    const name = authName ? authName : `Guest ${guestCounter++}`;
    
    // Hash the name to consistently pick one of our predefined presence colors
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
       hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIdx = Math.abs(hash) % PRESENCE_COLORS.length;
    const color = PRESENCE_COLORS[colorIdx];
    
    socket.emit('presence-sync', Array.from(activePresences.values()));

    socket.on('presence-update', (data) => {
      if (!data || !data.cellId) {
        activePresences.delete(socket.id);
      } else {
        activePresences.set(socket.id, {
          id: socket.id,
          name,
          color,
          cellId: data.cellId
        });
      }
      ioInstance.emit('presence-sync', Array.from(activePresences.values()));
    });

    socket.on("disconnect", () => {
      activePresences.delete(socket.id);
      ioInstance.emit('presence-sync', Array.from(activePresences.values()));
    });
  });
}

setupSocket(io);

app.get("/", (_req, res) => {
  res.redirect("/admin/");
});

app.use(
  "/admin",
  express.static(path.join(__dirname, "admin"), {
    extensions: ["html"],
  }),
);

app.get("/female-names.json", (req, res) => res.sendFile(path.join(__dirname, "female-names.json")));
app.get("/male-names.json", (req, res) => res.sendFile(path.join(__dirname, "male-names.json")));
app.get("/unisex-names.json", (req, res) => res.sendFile(path.join(__dirname, "unisex-names.json")));

const ALLOWED = new Map([
  ["female", "female-names.json"],
  ["male", "male-names.json"],
  ["unisex", "unisex-names.json"],
]);

const auditLogPath = path.join(__dirname, "audit-log.json");

function updateAuditLog(category, added, deleted) {
  try {
    queries.insertAuditLog.run(Date.now(), category, added, deleted);
  } catch (err) {
    console.error("Failed to update audit log in DB:", err);
  }
}

function parseNames(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string") return [];
  const text = raw.trim();
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fall back to splitter below
    }
  }
  return text
    .split(/[\r\n,;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeKey(name) {
  return name.trim().replace(/^["']|["']$/g, "").toLocaleLowerCase();
}

function toProperCaseName(name) {
  const text = String(name || "").trim();
  if (!text) return "";
  return text
    .split(/([ \-'])/g)
    .map((part) => {
      if (!part) return part;
      if (/^[ \-']$/.test(part)) return part;
      const first = part.charAt(0);
      const rest = part.slice(1);
      return first.toUpperCase() + rest.toLowerCase();
    })
    .join("");
}

function resolveCategory(categoryRaw) {
  const category = String(categoryRaw || "").toLowerCase();
  const filename = ALLOWED.get(category);
  if (!filename) {
    const err = new Error(
      `Unknown category. Use one of: ${Array.from(ALLOWED.keys()).join(", ")}`,
    );
    err.statusCode = 400;
    throw err;
  }
  return { category, filename, filePath: path.join(__dirname, filename) };
}

async function readJsonArray(filePath) {
  // We determine the category from the filePath for backward compatibility in some routes, 
  // though we should ideally use category directly.
  const filename = path.basename(filePath);
  let category = "female";
  if (filename.includes("male") && !filename.includes("female")) category = "male";
  if (filename.includes("unisex")) category = "unisex";

  const rows = queries.getNamesByCategory.all(category);
  return rows.map(r => r.name);
}

async function writeJsonArrayAtomic(filePath, arr) {
  const filename = path.basename(filePath);
  let category = "female";
  if (filename.includes("male") && !filename.includes("female")) category = "male";
  if (filename.includes("unisex")) category = "unisex";

  // This is a full sync, so we might want to be careful. 
  // For simplicity, we'll clear and re-insert if this is a "replace all" operation.
  const sync = db.transaction((names) => {
    db.prepare("DELETE FROM names WHERE category = ?").run(category);
    for (const name of names) {
      queries.insertName.run(name, category);
    }
  });
  sync(arr);
}

// FIX 5: computeDedupe now prefers the properly-cased variant when a duplicate
// is encountered, rather than blindly keeping the first-seen entry.
function computeDedupe(arr) {
  const seen = new Map(); // normalizedKey -> index in unique[]
  const unique = [];
  const duplicates = [];

  for (const raw of arr) {
    const s = String(raw);
    const key = normalizeKey(s);
    if (!key) continue;

    if (seen.has(key)) {
      const idx = seen.get(key);
      const stored = unique[idx];
      const sIsProper = toProperCaseName(s) === s;
      const storedIsProper = toProperCaseName(stored) === stored;

      // Prefer the properly-cased version; replace stored entry if this one
      // is proper-cased and the stored one is not.
      if (sIsProper && !storedIsProper) {
        duplicates.push(stored);
        unique[idx] = s;
      } else {
        duplicates.push(s);
      }
    } else {
      seen.set(key, unique.length);
      unique.push(s);
    }
  }

  return { unique, duplicates };
}

app.get("/api/names/:category/stats", async (req, res) => {
  try {
    const { category } = resolveCategory(req.params.category);
    const count = queries.countNamesByCategory.get(category).count;
    return res.json({
      ok: true,
      category,
      total: count,
      unique: count,
      duplicates: 0,
      duplicatesPreview: [],
    });
  } catch (err) {
    const status = err && err.statusCode ? err.statusCode : 500;
    return res.status(status).json({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
});

app.get("/api/stats", async (_req, res) => {
  try {
    const entries = Array.from(ALLOWED.entries());
    const byCategory = {};
    for (const [category, filename] of entries) {
      const fullPath = path.join(__dirname, filename);
      const count = queries.countNamesByCategory.get(category).count;
      const stats = await fs.stat(fullPath).catch(() => null);
      
      byCategory[category] = {
        file: filename,
        total: count,
        unique: count, // In SQLite, we enforce uniqueness via schema
        duplicates: 0,
        lastUpdate: stats ? stats.mtime : null,
      };
    }
    return res.json({ ok: true, byCategory });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
});

app.post("/api/names/:category/deduplicate", async (req, res) => {
  try {
    const { category } = resolveCategory(req.params.category);
    // SQLite enforces uniqueness, so no duplicates can exist.
    const count = queries.countNamesByCategory.get(category).count;
    return res.json({
      ok: true,
      category,
      removed: 0,
      total: count,
      message: "No duplicates possible in database.",
    });
  } catch (err) {
    const status = err && err.statusCode ? err.statusCode : 500;
    return res.status(status).json({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
});

app.post("/api/names/:category", async (req, res) => {
  try {
    const { category } = resolveCategory(req.params.category);
    const incoming = parseNames(req.body?.names);
    const cleaned = incoming
      .map((n) => n.trim().replace(/^["']|["']$/g, ""))
      .map((n) => toProperCaseName(n))
      .filter(Boolean);

    let addedCount = 0;
    const insertMany = db.transaction((names) => {
      for (const name of names) {
        const info = queries.insertName.run(name, category);
        if (info.changes > 0) addedCount++;
      }
    });

    insertMany(cleaned);

    if (addedCount > 0) {
      updateAuditLog(category, addedCount, 0);
      emitDataChange(category, "add");
    }

    const total = queries.countNamesByCategory.get(category).count;

    return res.json({
      ok: true,
      category,
      added: addedCount,
      total: total,
      addedNamesPreview: cleaned.slice(0, 20),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
});

// FIX 3: emit data-change events after writing female and male files.
app.post("/api/clean-unisex", async (req, res) => {
  try {
    const unisex = await readJsonArray(path.join(__dirname, "unisex-names.json"));
    const unisexSet = new Set(unisex.map(normalizeKey));

    const femalePath = path.join(__dirname, "female-names.json");
    const female = await readJsonArray(femalePath);
    const initialFemaleCount = female.length;
    const femaleCleaned = female.filter((name) => !unisexSet.has(normalizeKey(name)));

    const malePath = path.join(__dirname, "male-names.json");
    const male = await readJsonArray(malePath);
    const initialMaleCount = male.length;
    const maleCleaned = male.filter((name) => !unisexSet.has(normalizeKey(name)));

    const removedFemale = initialFemaleCount - femaleCleaned.length;
    const removedMale = initialMaleCount - maleCleaned.length;

    if (removedFemale > 0) {
      await writeJsonArrayAtomic(femalePath, femaleCleaned);
      await updateAuditLog("female", 0, removedFemale);
      emitDataChange("female", "clean-unisex"); // FIX 3
    }
    if (removedMale > 0) {
      await writeJsonArrayAtomic(malePath, maleCleaned);
      await updateAuditLog("male", 0, removedMale);
      emitDataChange("male", "clean-unisex"); // FIX 3
    }

    return res.json({
      ok: true,
      removedFemale,
      removedMale,
      totalRemoved: removedFemale + removedMale,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
});

app.get("/api/analytics", async (_req, res) => {
  try {
    const categories = ["female", "male", "unisex"];
    const data = {
      female: { total: 0, letters: {}, longest: [] },
      male: { total: 0, letters: {}, longest: [] },
      unisex: { total: 0, letters: {}, longest: [] },
      overall: { total: 0, avgLength: 0, lengthDist: {} },
    };
    let totalLength = 0;

    for (const category of categories) {
      const rows = queries.getAnalyticsByCategory.all(category);
      const names = rows.map(r => r.name);
      data[category].total = names.length;
      data.overall.total += names.length;

      const letters = {};
      const sortedByLen = [...names].sort((a, b) => b.length - a.length);
      data[category].longest = Array.from(new Set(sortedByLen)).slice(0, 5);

      for (const name of names) {
        totalLength += name.length;
        const first = name.charAt(0).toUpperCase();
        if (first >= "A" && first <= "Z") {
          letters[first] = (letters[first] || 0) + 1;
        }
        const len = name.length;
        data.overall.lengthDist[len] = (data.overall.lengthDist[len] || 0) + 1;
      }
      data[category].letters = letters;
    }

    data.overall.avgLength =
      data.overall.total > 0 ? totalLength / data.overall.total : 0;
    
    const auditHistory = queries.getAuditLogs.all();
    let auditSummary = {
      female: { added: 0, deleted: 0 },
      male: { added: 0, deleted: 0 },
      unisex: { added: 0, deleted: 0 },
    };

    auditHistory.forEach(entry => {
      if (auditSummary[entry.c]) {
        auditSummary[entry.c].added += entry.a;
        auditSummary[entry.c].deleted += entry.d;
      }
    });

    return res.json({ 
      ok: true, 
      analytics: data, 
      audit: auditSummary, 
      history: auditHistory 
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});

app.get("/api/explorer/search", async (req, res) => {
  try {
    const { category } = resolveCategory(req.query.category);
    const q = (req.query.q || "").toLowerCase();
    const length = parseInt(req.query.length, 10) || 0;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const searchTerm = q ? `%${q}%` : "%";
    
    const rows = queries.searchNames.all(category, searchTerm, length, length, limit, offset);
    const results = rows.map(r => r.name);
    const totalMatches = queries.countSearchResults.get(category, searchTerm, length, length).count;

    return res.json({
      ok: true,
      data: results,
      totalMatches,
      page,
      limit,
      totalPages: Math.ceil(totalMatches / limit),
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// FIX 2: rename only the first matching entry, reject if result would collide,
// and never silently drop entries via computeDedupe.
app.put("/api/explorer/:category/:oldName", async (req, res) => {
  try {
    const { category } = resolveCategory(req.params.category);
    const oldName = req.params.oldName;
    const newName = req.body.newName;
    if (!newName) throw new Error("Missing newName payload");
    const cleanedNewName = toProperCaseName(newName.trim());
    if (!cleanedNewName) throw new Error("Invalid newName");

    // Check if new name already exists
    const existing = queries.insertName.run(cleanedNewName, category);
    if (existing.changes === 0 && normalizeKey(cleanedNewName) !== normalizeKey(oldName)) {
      return res.status(409).json({
        ok: false,
        error: "New name already exists in dataset",
      });
    }

    const info = queries.updateName.run(cleanedNewName, category, oldName);
    if (info.changes === 0) {
       return res.status(404).json({ ok: false, error: "Old name not found in dataset" });
    }

    emitDataChange(category, "update");
    return res.json({ ok: true, updatedName: cleanedNewName });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/explorer/:category/delete", async (req, res) => {
  try {
    const { category } = resolveCategory(req.params.category);
    const targetNames = req.body.names;
    if (!Array.isArray(targetNames)) throw new Error("Expected names array");
    
    let deletedCount = 0;
    const deleteMany = db.transaction((names) => {
      for (const name of names) {
        const info = queries.deleteNamesByCategory.run(category, name);
        if (info.changes > 0) deletedCount++;
      }
    });

    deleteMany(targetNames);

    if (deletedCount > 0) {
      updateAuditLog(category, 0, deletedCount);
      emitDataChange(category, "delete");
    }
    return res.json({ ok: true, deleted: deletedCount });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/git/status", async (req, res) => {
  try {
    const { stdout: statusOut } = await execPromise("git status -s");
    const { stdout: branchOut } = await execPromise(
      "git branch --show-current"
    ).catch(() => ({ stdout: "unknown" }));
    const files = statusOut
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const parts = line.trim().match(/^([A-Z? ]{1,2})\s+(.*)$/);
        if (parts) return { status: parts[1].trim(), file: parts[2] };
        return { status: "M", file: line.trim() };
      });
    return res.json({ ok: true, branch: branchOut.trim(), files });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/git/diff-summary", async (req, res) => {
  try {
    const { stdout } = await execPromise("git diff --numstat");
    const diffs = stdout
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const [added, deleted, file] = line.split(/\s+/);
        return {
          file,
          added: parseInt(added, 10) || 0,
          deleted: parseInt(deleted, 10) || 0,
        };
      });
    return res.json({ ok: true, diffs });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});


// $(...), and other shell metacharacters in the message body.
app.post("/api/git/commit", async (req, res) => {
  try {
    const msg = req.body.message || "Update datasets";

    // 1. Add all changes
    await runGitCommand(["add", "."]);

    // 2. Commit directly using spawn arguments (no shell, no temp files)
    const { stdout, stderr } = await runGitCommand(["commit", "-m", msg]);

    return res.json({ ok: true, stdout, stderr });
  } catch (err) {
    // Check if it's just 'nothing to commit'
    const out = (err.stdout || "") + (err.stderr || "");
    if (out.includes("nothing to commit") || out.includes("nothing added to commit")) {
      return res.json({
        ok: true,
        message: "Nothing to commit",
        stdout: err.stdout,
      });
    }
    return res.status(500).json({
      ok: false,
      error: err.message,
      stderr: err.stderr,
      stdout: err.stdout
    });
  }
});

app.post("/api/git/push", async (req, res) => {
  try {
    // Attempt to push current branch
    const { stdout: branchOut } = await runGitCommand(["branch", "--show-current"]);
    const branch = branchOut.trim() || "main";
    const { stdout, stderr } = await runGitCommand(["push", "--set-upstream", "origin", branch]);
    return res.json({ ok: true, stdout, stderr });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
      stderr: err.stderr,
      stdout: err.stdout
    });
  }
});

// FIX 4: create a fresh http.Server and re-attach socket.io on each port
// attempt. Re-calling .listen() on an already-errored Server throws on
// Node ≥ 18 instead of retrying cleanly.
async function listenWithFallback(startPort, attempts) {
  let port = startPort;
  for (let i = 0; i < attempts; i += 1) {
    const result = await new Promise((resolve, reject) => {
      const candidate = http.createServer(app);
      const candidateIo = new Server(candidate);

      // Apply the main presence logic onto the candidate io instance
      setupSocket(candidateIo);

      candidate.listen(port, () => resolve({ candidate, candidateIo, port }));
      candidate.on("error", (err) => {
        candidate.close();
        reject(err);
      });
    }).catch((err) => {
      if (err && err.code === "EADDRINUSE") return null;
      throw err;
    });

    if (result) {
      // Promote the successful candidate to the module-level references so
      // that emitDataChange() and all existing route handlers use it.
      server = result.candidate;
      io = result.candidateIo;
      console.log(
        `Name admin running on http://localhost:${result.port}/admin/`
      );
      return;
    }
    port += 1;
  }
  throw new Error(
    `Could not find a free port starting at ${startPort}. Try setting PORT env var.`
  );
}

const startPort = Number(process.env.PORT || 3030);
listenWithFallback(startPort, 25).catch((err) => {
  console.error(err && err.message ? err.message : err);
  process.exitCode = 1;
});