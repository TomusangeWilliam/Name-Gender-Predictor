const Database = require('better-sqlite3');
const fs = require('fs/promises');
const path = require('path');

const db = new Database('database.db');

// Initialize schema
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

async function migrate() {
  const categories = ['female', 'male', 'unisex'];
  const filenames = {
    female: 'female-names.json',
    male: 'male-names.json',
    unisex: 'unisex-names.json'
  };

  console.log('Starting migration...');

  // Migrate names
  const insertName = db.prepare('INSERT OR IGNORE INTO names (name, category) VALUES (?, ?)');
  
  for (const category of categories) {
    const filePath = path.join(__dirname, filenames[category]);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const names = JSON.parse(data);
      if (Array.isArray(names)) {
        console.log(`Migrating ${names.length} names for category: ${category}`);
        const insertMany = db.transaction((items) => {
          for (const name of items) insertName.run(String(name), category);
        });
        insertMany(names);
      }
    } catch (err) {
      console.warn(`Could not migrate category ${category}: ${err.message}`);
    }
  }

  // Migrate audit log
  const auditLogPath = path.join(__dirname, 'audit-log.json');
  try {
    const auditData = await fs.readFile(auditLogPath, 'utf8');
    const logs = JSON.parse(auditData);
    if (Array.isArray(logs)) {
      console.log(`Migrating ${logs.length} audit log entries`);
      const insertLog = db.prepare('INSERT INTO audit_log (timestamp, category, added, deleted) VALUES (?, ?, ?, ?)');
      const insertManyLogs = db.transaction((items) => {
        for (const log of items) {
          insertLog.run(log.t || Date.now(), log.c || 'unknown', log.a || 0, log.d || 0);
        }
      });
      insertManyLogs(logs);
    }
  } catch (err) {
    console.warn(`Could not migrate audit log: ${err.message}`);
  }

  console.log('Migration complete!');
  db.close();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
