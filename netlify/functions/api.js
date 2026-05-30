const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');

const ALLOWED = new Map([
  ['female', 'female-names.json'],
  ['male', 'male-names.json'],
  ['unisex', 'unisex-names.json'],
]);

const functionRoot = path.resolve(__dirname);
const dataRoot = path.join(functionRoot, 'data');
const auditLogFile = 'audit-log.json';

function getFilePaths(filename) {
  return {
    source: path.join(dataRoot, filename),
    temp: path.join(os.tmpdir(), filename),
  };
}

async function pathForRead(filename) {
  const { source, temp } = getFilePaths(filename);
  try {
    await fsPromises.access(temp);
    return temp;
  } catch (err) {
    return source;
  }
}

async function readJson(filename, fallback = null) {
  const filePath = await pathForRead(filename);
  try {
    const text = await fsPromises.readFile(filePath, 'utf8');
    return JSON.parse(text || 'null');
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    return fallback;
  }
}

async function writeJson(filename, data) {
  const { temp } = getFilePaths(filename);
  await fsPromises.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeKey(name) {
  return String(name || '').trim().replace(/^['"]|['"]$/g, '').toLocaleLowerCase();
}

function toProperCaseName(name) {
  const text = String(name || '').trim();
  if (!text) return '';
  return text
    .split(/([ \-'])/g)
    .map((part) => {
      if (!part) return part;
      if (/^[ \-']$/.test(part)) return part;
      const first = part.charAt(0);
      const rest = part.slice(1);
      return first.toUpperCase() + rest.toLowerCase();
    })
    .join('');
}

function parseNames(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== 'string') return [];
  const text = raw.trim();
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (_) {}
  }
  return text
    .split(/[\r\n,;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function computeDedupe(arr) {
  const seen = new Map();
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

function makeJsonResponse(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function parseRequestBody(event) {
  if (!event.body) return null;
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  try {
    return JSON.parse(raw);
  } catch (_err) {
    return raw;
  }
}

function resolveCategory(category) {
  const normalized = String(category || '').toLowerCase();
  const filename = ALLOWED.get(normalized);
  if (!filename) {
    const err = new Error(
      `Unknown category. Use one of: ${Array.from(ALLOWED.keys()).join(', ')}`,
    );
    err.statusCode = 400;
    throw err;
  }
  return { category: normalized, filename };
}

async function readNameData(category) {
  const { filename } = resolveCategory(category);
  const data = await readJson(filename, []);
  return Array.isArray(data) ? data.map(String) : [];
}

async function writeNameData(category, names) {
  const { filename } = resolveCategory(category);
  await writeJson(filename, names);
}

async function appendAuditLog(entry) {
  const log = (await readJson(auditLogFile, [])) || [];
  log.push(entry);
  await writeJson(auditLogFile, log);
}

function getEventPath(event) {
  let pathValue = event.path || '';
  // Netlify redirect sends original path as query var when rewriting
  if (event.queryStringParameters && event.queryStringParameters.path) {
    const queryPath = event.queryStringParameters.path;
    return queryPath.startsWith('/') ? queryPath : `/${queryPath}`;
  }
  return pathValue;
}

async function getLastUpdate(filename) {
  const { source, temp } = getFilePaths(filename);
  try {
    const stat = await fsPromises.stat(temp);
    return stat.mtime.toISOString();
  } catch (_) {
    try {
      const stat = await fsPromises.stat(source);
      return stat.mtime.toISOString();
    } catch (_) {
      return null;
    }
  }
}

exports.handler = async function (event) {
  try {
    const method = (event.httpMethod || 'GET').toUpperCase();
    const rawPath = getEventPath(event);
    const route = rawPath.replace(/^\/api/, '');
    const segments = route.split('/').filter(Boolean);
    const query = event.queryStringParameters || {};
    const body = parseRequestBody(event);

    if (segments.length === 1 && segments[0].endsWith('.json') && method === 'GET') {
      const filename = segments[0];
      if (filename === auditLogFile) {
        const log = await readJson(filename, []);
        return makeJsonResponse(log);
      }
      if (ALLOWED.has(filename.replace('-names.json', ''))) {
        const kind = filename.replace('-names.json', '');
        const names = await readNameData(kind);
        return makeJsonResponse(names);
      }
    }

    if (segments.length === 1 && segments[0] === 'stats' && method === 'GET') {
      const categories = Array.from(ALLOWED.keys());
      const byCategory = {};
      for (const category of categories) {
        const names = await readNameData(category);
        byCategory[category] = {
          file: ALLOWED.get(category),
          total: names.length,
          unique: new Set(names.map(normalizeKey)).size,
          duplicates: names.length - new Set(names.map(normalizeKey)).size,
          lastUpdate: await getLastUpdate(ALLOWED.get(category)),
        };
      }
      return makeJsonResponse({ ok: true, byCategory });
    }

    if (segments.length === 1 && segments[0] === 'analytics' && method === 'GET') {
      const categories = Array.from(ALLOWED.keys());
      const data = {
        female: { total: 0, letters: {}, longest: [] },
        male: { total: 0, letters: {}, longest: [] },
        unisex: { total: 0, letters: {}, longest: [] },
        overall: { total: 0, avgLength: 0, lengthDist: {} },
      };
      let totalLength = 0;
      for (const category of categories) {
        const names = await readNameData(category);
        data[category].total = names.length;
        data.overall.total += names.length;
        const letters = {};
        const sortedByLen = [...new Set(names)].sort((a, b) => b.length - a.length);
        data[category].longest = sortedByLen.slice(0, 5);
        for (const name of names) {
          totalLength += name.length;
          const first = name.charAt(0).toUpperCase();
          if (first >= 'A' && first <= 'Z') {
            letters[first] = (letters[first] || 0) + 1;
          }
          const len = String(name).length;
          data.overall.lengthDist[len] = (data.overall.lengthDist[len] || 0) + 1;
        }
        data[category].letters = letters;
      }
      data.overall.avgLength = data.overall.total > 0 ? totalLength / data.overall.total : 0;

      const history = await readJson(auditLogFile, []);
      const auditSummary = {
        female: { added: 0, deleted: 0 },
        male: { added: 0, deleted: 0 },
        unisex: { added: 0, deleted: 0 },
      };
      if (Array.isArray(history)) {
        history.forEach((entry) => {
          if (entry.category && auditSummary[entry.category]) {
            auditSummary[entry.category].added += Number(entry.added || 0);
            auditSummary[entry.category].deleted += Number(entry.deleted || 0);
          }
        });
      }

      return makeJsonResponse({ ok: true, analytics: data, audit: auditSummary, history });
    }

    if (segments.length === 1 && segments[0] === 'clean-unisex' && method === 'POST') {
      const unisex = await readNameData('unisex');
      const unisexSet = new Set(unisex.map(normalizeKey));
      const results = {};
      for (const category of ['female', 'male']) {
        const existing = await readNameData(category);
        const cleaned = existing.filter((name) => !unisexSet.has(normalizeKey(name)));
        results[category] = {
          before: existing.length,
          after: cleaned.length,
          removed: existing.length - cleaned.length,
        };
        if (cleaned.length !== existing.length) {
          await writeNameData(category, cleaned);
          await appendAuditLog({ timestamp: Date.now(), category, added: 0, deleted: results[category].removed });
        }
      }
      return makeJsonResponse({ ok: true, removedFemale: results.female.removed, removedMale: results.male.removed, totalRemoved: results.female.removed + results.male.removed });
    }

    if (segments.length >= 2 && segments[0] === 'names') {
      const category = segments[1];
      if (segments.length === 3 && segments[2] === 'stats' && method === 'GET') {
        const names = await readNameData(category);
        const normalized = names.map(normalizeKey);
        const dupeCount = names.length - new Set(normalized).size;
        const duplicates = [];
        if (dupeCount > 0) {
          const seen = new Map();
          for (const name of names) {
            const key = normalizeKey(name);
            if (seen.has(key)) duplicates.push(name);
            else seen.set(key, name);
          }
        }
        return makeJsonResponse({ ok: true, category, total: names.length, unique: new Set(normalized).size, duplicates: duplicates.length, duplicatesPreview: duplicates.slice(0, 8) });
      }

      if (segments.length === 3 && segments[2] === 'deduplicate' && method === 'POST') {
        const names = await readNameData(category);
        const { unique, duplicates } = computeDedupe(names);
        if (unique.length !== names.length) {
          await writeNameData(category, unique);
          await appendAuditLog({ timestamp: Date.now(), category, added: 0, deleted: duplicates.length });
        }
        return makeJsonResponse({ ok: true, category, removed: duplicates.length, total: unique.length, message: 'Removed duplicate names.' });
      }

      if (segments.length === 2 && method === 'POST') {
        const incoming = parseNames(body?.names);
        const cleaned = incoming
          .map((n) => n.trim().replace(/^['"]|['"]$/g, ''))
          .map(toProperCaseName)
          .filter(Boolean);

        const existing = await readNameData(category);
        const existingKeys = new Set(existing.map(normalizeKey));
        let addedCount = 0;
        const appended = [];

        for (const name of cleaned) {
          const key = normalizeKey(name);
          if (!existingKeys.has(key)) {
            addedCount += 1;
            existingKeys.add(key);
            appended.push(name);
          }
        }

        const newNames = [...existing, ...appended];
        if (addedCount > 0) {
          await writeNameData(category, newNames);
          await appendAuditLog({ timestamp: Date.now(), category, added: addedCount, deleted: 0 });
        }

        return makeJsonResponse({ ok: true, category, added: addedCount, total: newNames.length, addedNamesPreview: appended.slice(0, 20) });
      }
    }

    if (segments.length >= 2 && segments[0] === 'explorer') {
      if (segments[1] === 'search' && method === 'GET') {
        const category = query.category;
        const q = String(query.q || '').toLowerCase();
        const length = parseInt(query.length, 10) || 0;
        const page = Math.max(1, parseInt(query.page, 10) || 1);
        const limit = Math.max(1, parseInt(query.limit, 10) || 50);

        const names = await readNameData(category);
        const filtered = names.filter((name) => {
          const matchesQuery = !q || name.toLowerCase().includes(q);
          const matchesLength = length === 0 || name.length === length;
          return matchesQuery && matchesLength;
        });
        const totalMatches = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalMatches / limit));
        const paged = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);
        return makeJsonResponse({ ok: true, data: paged, totalMatches, page, limit, totalPages });
      }

      if (segments.length === 3 && method === 'PUT') {
        const category = segments[1];
        const oldName = decodeURIComponent(segments[2]);
        const newNameRaw = body?.newName;
        if (!newNameRaw) throw new Error('Missing newName payload');
        const newName = toProperCaseName(String(newNameRaw).trim());
        if (!newName) throw new Error('Invalid newName');

        const names = await readNameData(category);
        const oldKey = normalizeKey(oldName);
        const newKey = normalizeKey(newName);
        const existingKeys = new Set(names.map(normalizeKey));
        if (newKey !== oldKey && existingKeys.has(newKey)) {
          return makeJsonResponse({ ok: false, error: 'New name already exists in dataset' }, 409);
        }
        const updated = names.map((name) => normalizeKey(name) === oldKey ? newName : name);
        const changed = updated.some((name, idx) => name !== names[idx]);
        if (!changed) {
          return makeJsonResponse({ ok: false, error: 'Old name not found in dataset' }, 404);
        }
        await writeNameData(category, updated);
        await appendAuditLog({ timestamp: Date.now(), category, added: 1, deleted: 1 });
        return makeJsonResponse({ ok: true, updatedName: newName });
      }

      if (segments.length === 3 && segments[2] === 'delete' && method === 'POST') {
        const category = segments[1];
        const namesToDelete = Array.isArray(body?.names) ? body.names.map(String) : [];
        if (!namesToDelete.length) {
          return makeJsonResponse({ ok: false, error: 'Expected names array' }, 400);
        }
        const names = await readNameData(category);
        const keysToDelete = new Set(namesToDelete.map(normalizeKey));
        const kept = names.filter((name) => !keysToDelete.has(normalizeKey(name)));
        const deletedCount = names.length - kept.length;
        if (deletedCount > 0) {
          await writeNameData(category, kept);
          await appendAuditLog({ timestamp: Date.now(), category, added: 0, deleted: deletedCount });
        }
        return makeJsonResponse({ ok: true, deleted: deletedCount });
      }
    }

    if (segments.length >= 2 && segments[0] === 'git') {
      return makeJsonResponse({ ok: false, error: 'Git operations are not supported in Netlify Functions.' }, 501);
    }

    return makeJsonResponse({ ok: false, error: 'Route not found' }, 404);
  } catch (err) {
    const status = err && err.statusCode ? err.statusCode : 500;
    return makeJsonResponse({ ok: false, error: err.message || String(err) }, status);
  }
};
