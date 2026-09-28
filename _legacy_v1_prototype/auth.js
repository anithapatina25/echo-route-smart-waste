// auth.js - Session token management and role-based authorization
const crypto = require('node:crypto');
const { getUserByEmail, getUserById, hashPassword, getCitizenProfile, getDriverProfile } = require('./db.js');

// In-memory token cache: token -> { userId, role, name, email, expiresAt }
const sessionsCache = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const { db } = require('./db.js');

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const sessionData = {
    token,
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    expiresAt
  };

  // Cache in memory
  sessionsCache.set(token, sessionData);

  // Persist in SQLite
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sessions (token, user_id, role, name, email, phone, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(token, user.id, user.role, user.name, user.email, user.phone || '', expiresAt);
  } catch (err) {
    console.error('Failed to persist session to database:', err);
  }

  return sessionData;
}

function getSession(token) {
  if (!token) return null;

  // 1. Check in-memory cache first
  const cached = sessionsCache.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      destroySession(token);
      return null;
    }
    return cached;
  }

  // 2. Fallback to SQLite DB (enables persistence across server restarts)
  try {
    const row = db.prepare(`
      SELECT token, user_id as userId, role, name, email, phone, expires_at as expiresAt
      FROM sessions
      WHERE token = ?
    `).get(token);

    if (!row) return null;

    if (Date.now() > row.expiresAt) {
      destroySession(token);
      return null;
    }

    // Populate cache
    sessionsCache.set(token, row);
    return row;
  } catch (err) {
    console.error('Error querying session from database:', err);
    return null;
  }
}

function destroySession(token) {
  if (token) {
    sessionsCache.delete(token);
    try {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    } catch (e) {}
  }
}

function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  // Also check query param or cookie
  if (req.url) {
    const parsed = new URL(req.url, 'http://localhost');
    const tokenQuery = parsed.searchParams.get('token');
    if (tokenQuery) return tokenQuery;
  }
  if (req.headers['cookie']) {
    const match = req.headers['cookie'].match(/echo_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

function authenticate(req) {
  const token = extractToken(req);
  return getSession(token);
}

module.exports = {
  createSession,
  getSession,
  destroySession,
  authenticate,
  extractToken
};
