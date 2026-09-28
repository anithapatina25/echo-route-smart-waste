/**
 * ECHO ROUTE SMART WASTE
 * Migration Runner
 */
const fs = require('node:fs');
const path = require('node:path');
const db = require('./client');

function runMigrations() {
  console.log(`[ECHO ROUTE DB] Running migrations on: ${db.getDbPath()}`);
  
  // Migration tracker table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.resolve(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const existing = db.get('SELECT id FROM _schema_migrations WHERE filename = ?', [file]);
    if (existing) {
      console.log(`  - [SKIPPED] ${file} (Already executed)`);
      continue;
    }

    console.log(`  + [APPLYING] ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    db.run('INSERT INTO _schema_migrations (filename) VALUES (?)', [file]);
    console.log(`  ✓ [APPLIED] ${file}`);
  }

  console.log('[ECHO ROUTE DB] All migrations completed successfully.');
}

if (require.main === module) {
  try {
    runMigrations();
  } catch (err) {
    console.error('[ECHO ROUTE DB] Migration failed:', err);
    process.exit(1);
  }
}

module.exports = { runMigrations };
