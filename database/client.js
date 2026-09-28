/**
 * ECHO ROUTE SMART WASTE
 * Dedicated Relational Database Connection Client
 * Utilizes Node 24 native ACID SQLite engine
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment configuration from backend/.env if not already loaded
const envPath = path.join(PROJECT_ROOT, 'backend', '.env');
if (fs.existsSync(envPath)) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envPath);
    } else {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim();
          process.env[key] = val;
        }
      });
    }
  } catch (e) {
    console.warn('[ECHO ROUTE DB] Could not load .env file:', e.message);
  }
}

// Resolve DB Path consistently from project root
const rawDbPath = process.env.DB_PATH || 'database/echo_route_smart_waste.db';
// Normalize if it started with ../database or ./database
const cleanRelPath = rawDbPath.replace(/^(\.\.[\/\\]|\.[\/\\])+/, '');
const dbPath = path.isAbsolute(rawDbPath) 
  ? rawDbPath 
  : path.resolve(PROJECT_ROOT, cleanRelPath.startsWith('database') ? cleanRelPath : path.join('database', cleanRelPath));

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);
    // Enforce relational foreign key constraints and WAL mode
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  }
  return dbInstance;
}

const db = {
  getRawDb: () => getDatabase(),
  getDbPath: () => dbPath,

  query: (sql, params = []) => {
    const stmt = getDatabase().prepare(sql);
    return stmt.all(...params);
  },

  get: (sql, params = []) => {
    const stmt = getDatabase().prepare(sql);
    return stmt.get(...params);
  },

  run: (sql, params = []) => {
    const stmt = getDatabase().prepare(sql);
    return stmt.run(...params);
  },

  exec: (sql) => {
    return getDatabase().exec(sql);
  }
};

module.exports = db;
