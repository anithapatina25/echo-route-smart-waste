// db.js - SQLite database initialization and management using Node 24 native node:sqlite
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DB_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const dbPath = path.join(DB_DIR, 'echoroute.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for optimal performance and relational integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Simple helper for password hashing
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('citizen', 'driver', 'admin')),
      name TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS citizen_profiles (
      user_id INTEGER PRIMARY KEY,
      village_ward TEXT NOT NULL,
      address TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS driver_profiles (
      user_id INTEGER PRIMARY KEY,
      vehicle_number TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      license_number TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      current_lat REAL DEFAULT 28.5355,
      current_lng REAL DEFAULT 77.3910,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pickup_requests (
      id TEXT PRIMARY KEY,
      citizen_id INTEGER NOT NULL,
      waste_type TEXT NOT NULL,
      quantity TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      scheduled_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Requested',
      assigned_driver_id INTEGER,
      citizen_photo_url TEXT,
      completion_proof_url TEXT,
      completion_notes TEXT,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(citizen_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(assigned_driver_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      citizen_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      photo_url TEXT,
      location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY(citizen_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      route_date TEXT NOT NULL,
      sequence_json TEXT NOT NULL,
      total_distance_km REAL DEFAULT 0,
      status TEXT DEFAULT 'Assigned',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(driver_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      expires_at INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Run lightweight migrations if columns don't exist yet
  try {
    db.exec(`ALTER TABLE pickup_requests ADD COLUMN accepted_at DATETIME;`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;`);
  } catch (e) {
    // Column already exists
  }

  seedDataIfEmpty();
}

function seedDataIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  console.log('Seeding initial Gram Panchayat demo data...');

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, name, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertCitizen = db.prepare(`
    INSERT INTO citizen_profiles (user_id, village_ward, address)
    VALUES (?, ?, ?)
  `);

  const insertDriver = db.prepare(`
    INSERT INTO driver_profiles (user_id, vehicle_number, vehicle_type, license_number, is_active, current_lat, current_lng)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultHash = hashPassword('admin123');
  const driverHash = hashPassword('driver123');
  const citizenHash = hashPassword('citizen123');

  // 1. Admin
  insertUser.run('admin@echoroute.gov.in', defaultHash, 'admin', 'Officer Anil Sharma (PDO)', '+91 98765 43210');

  // 2. Drivers
  const d1 = insertUser.run('driver1@echoroute.gov.in', driverHash, 'driver', 'Suresh Kumar', '+91 94123 45678');
  insertDriver.run(Number(d1.lastInsertRowid), 'DL-04-E-1024', 'Tata Ace Tipper (1.5 Ton)', 'DL-2018-098231', 1, 28.5355, 77.3910);

  const d2 = insertUser.run('driver2@echoroute.gov.in', driverHash, 'driver', 'Rajesh Yadav', '+91 94123 87654');
  insertDriver.run(Number(d2.lastInsertRowid), 'DL-04-E-2055', 'Mahindra Bolero Pickup (1.8 Ton)', 'DL-2019-112344', 1, 28.5420, 77.3850);

  const d3 = insertUser.run('driver3@echoroute.gov.in', driverHash, 'driver', 'Manoj Verma', '+91 94123 99887');
  insertDriver.run(Number(d3.lastInsertRowid), 'DL-04-E-3112', 'E-Rickshaw Loader (500 Kg)', 'DL-2021-008761', 1, 28.5310, 77.3980);

  // 3. Citizens
  const c1 = insertUser.run('citizen@echoroute.gov.in', citizenHash, 'citizen', 'Ramesh Patel', '+91 98111 22334');
  insertCitizen.run(Number(c1.lastInsertRowid), 'Ward 4 - Mandir Mohalla', 'House 14, Near Shiv Mandir, Shanti Nagar');

  const c2 = insertUser.run('sunita@echoroute.gov.in', citizenHash, 'citizen', 'Sunita Devi', '+91 98222 33445');
  insertCitizen.run(Number(c2.lastInsertRowid), 'Ward 2 - Primary School Road', 'House 28, Opp. Gram Panchayat Bhawan, Shanti Nagar');

  const c3 = insertUser.run('vikram@echoroute.gov.in', citizenHash, 'citizen', 'Vikram Singh', '+91 98333 44556');
  insertCitizen.run(Number(c3.lastInsertRowid), 'Ward 6 - Kisan Basti', 'Farmhouse 03, Canal Road, Shanti Nagar');

  // Seed sample placeholder images (SVG data URIs for instant zero-dependency display)
  const sampleWasteSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23e2e8f0"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23475569">Citizen Waste Photo</text><text x="50%25" y="60%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2364748b">Segregated Plastic &amp; Dry Waste</text></svg>';
  const sampleProofSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23dcfce7"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23166534">Driver Completion Proof</text><text x="50%25" y="60%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2315803d">Collected &amp; Vehicle Loaded - Clean Site</text></svg>';

  // 4. Seed Pickups
  const insertPickup = db.prepare(`
    INSERT INTO pickup_requests (
      id, citizen_id, waste_type, quantity, address, latitude, longitude,
      scheduled_date, preferred_time, description, status, assigned_driver_id,
      citizen_photo_url, completion_proof_url, completion_notes, completed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = new Date().toISOString().split('T')[0];

  // Request 1: Verified, awaiting driver assignment
  insertPickup.run(
    'ER-2026-0001',
    Number(c1.lastInsertRowid),
    'Plastic Waste',
    '3 Bags (~25kg)',
    'House 14, Near Shiv Mandir, Ward 4',
    28.5372,
    77.3895,
    todayStr,
    'Morning (08:00 - 11:00 AM)',
    'Collected segregated PET bottles and packaging material from store.',
    'Verified',
    null,
    sampleWasteSvg,
    null,
    null,
    null,
    new Date(Date.now() - 3600000 * 5).toISOString(),
    new Date(Date.now() - 3600000 * 3).toISOString()
  );

  // Request 2: Driver Assigned (Suresh Kumar)
  insertPickup.run(
    'ER-2026-0002',
    Number(c2.lastInsertRowid),
    'Household Waste',
    '2 Bags (~15kg)',
    'House 28, Opp. Gram Panchayat Bhawan, Ward 2',
    28.5398,
    77.3942,
    todayStr,
    'Morning (08:00 - 11:00 AM)',
    'Standard domestic dry waste and compostable bags.',
    'Driver Assigned',
    Number(d1.lastInsertRowid),
    sampleWasteSvg,
    null,
    null,
    null,
    new Date(Date.now() - 3600000 * 4).toISOString(),
    new Date(Date.now() - 3600000 * 2).toISOString()
  );

  // Request 3: Driver On The Way (Rajesh Yadav)
  insertPickup.run(
    'ER-2026-0003',
    Number(c3.lastInsertRowid),
    'Bulky Waste',
    'Cartload (~60kg)',
    'Farmhouse 03, Canal Road, Ward 6',
    28.5450,
    77.3820,
    todayStr,
    'Afternoon (01:00 - 04:00 PM)',
    'Pruned orchard branches and timber scrap.',
    'Driver On The Way',
    Number(d2.lastInsertRowid),
    sampleWasteSvg,
    null,
    null,
    null,
    new Date(Date.now() - 3600000 * 3).toISOString(),
    new Date(Date.now() - 3600000 * 1).toISOString()
  );

  // Request 4: Completed with Proof
  insertPickup.run(
    'ER-2026-0004',
    Number(c1.lastInsertRowid),
    'E-Waste',
    '1 Box (~10kg)',
    'House 14, Near Shiv Mandir, Ward 4',
    28.5372,
    77.3895,
    todayStr,
    'Morning (08:00 - 11:00 AM)',
    'Disused TV CRT monitor, broken inverter battery, computer parts.',
    'Completed',
    Number(d1.lastInsertRowid),
    sampleWasteSvg,
    sampleProofSvg,
    'Safely collected and loaded into Tata Ace recycling partition. Citizen present and acknowledged.',
    new Date(Date.now() - 3600000 * 2).toISOString(),
    new Date(Date.now() - 3600000 * 8).toISOString(),
    new Date(Date.now() - 3600000 * 2).toISOString()
  );

  // 5. Seed Complaints
  const insertComplaint = db.prepare(`
    INSERT INTO complaints (id, citizen_id, type, description, photo_url, location, status, admin_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertComplaint.run(
    'CMP-2026-0001',
    Number(c1.lastInsertRowid),
    'Overflowing Waste',
    'Community bin near Mandir Chowk is overflowing following weekly Haat bazaar.',
    sampleWasteSvg,
    'Ward 4, Mandir Chowk Market',
    'Under Review',
    'Inspected by sanitary inspector. Assigned extra morning collection run.',
    new Date(Date.now() - 3600000 * 12).toISOString()
  );

  insertComplaint.run(
    'CMP-2026-0002',
    Number(c2.lastInsertRowid),
    'Illegal Dumping',
    'Unregulated dumping of construction debris along primary school drainage ditch.',
    null,
    'Ward 2, Behind Primary School',
    'Pending',
    null,
    new Date(Date.now() - 3600000 * 6).toISOString()
  );

  // 6. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertNotif.run(Number(c1.lastInsertRowid), 'Pickup Completed', 'Your E-Waste pickup request ER-2026-0004 has been successfully completed.', 'success', '#mypickups');
  insertNotif.run(Number(d1.lastInsertRowid), 'New Assignment', 'You have been assigned pickup ER-2026-0002 at Ward 2.', 'info', '#assignments');
  insertNotif.run(1, 'New Citizen Request', 'Ramesh Patel submitted request ER-2026-0001 for Plastic Waste.', 'info', '#requests');

  console.log('Database seeded successfully.');
}

// Helper query wrappers
function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
}

function getUserById(id) {
  return db.prepare('SELECT id, email, role, name, phone, created_at FROM users WHERE id = ?').get(id);
}

function getCitizenProfile(userId) {
  return db.prepare('SELECT * FROM citizen_profiles WHERE user_id = ?').get(userId);
}

function getDriverProfile(userId) {
  return db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(userId);
}

module.exports = {
  db,
  initSchema,
  hashPassword,
  getUserByEmail,
  getUserById,
  getCitizenProfile,
  getDriverProfile,
  UPLOADS_DIR
};
