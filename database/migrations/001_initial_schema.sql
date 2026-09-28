-- ====================================================================
-- ECHO ROUTE SMART WASTE - INITIAL RELATIONAL SCHEMA (MIGRATION 001)
-- Dedicated SQLite database for Gram Panchayat Smart Waste Management
-- ====================================================================

-- 1. Users Table (Citizen, Driver, Admin)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('CITIZEN', 'DRIVER', 'ADMIN')),
  full_name TEXT NOT NULL,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Citizen Profiles
CREATE TABLE IF NOT EXISTS citizen_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ward_number TEXT NOT NULL,
  village_name TEXT NOT NULL DEFAULT 'Gram Panchayat',
  house_number TEXT,
  landmark TEXT,
  gps_lat REAL,
  gps_lng REAL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Driver Profiles
CREATE TABLE IF NOT EXISTS driver_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'Tipper',
  license_number TEXT NOT NULL,
  capacity_kg REAL NOT NULL DEFAULT 1000.0,
  is_on_duty INTEGER NOT NULL DEFAULT 1,
  current_lat REAL,
  current_lng REAL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Pickup Requests
CREATE TABLE IF NOT EXISTS pickup_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  citizen_id INTEGER NOT NULL REFERENCES citizen_profiles(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL CHECK(waste_type IN ('HOUSEHOLD', 'DRY_PLASTIC', 'WET_ORGANIC', 'E_WASTE', 'BULKY')),
  description TEXT,
  estimated_volume_bags INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'VERIFIED', 'ASSIGNED', 'IN_TRANSIT', 'COLLECTED', 'COMPLETED', 'CANCELLED')),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK(priority IN ('NORMAL', 'HIGH', 'URGENT')),
  ward_number TEXT NOT NULL,
  address TEXT NOT NULL,
  gps_lat REAL,
  gps_lng REAL,
  scheduled_date DATE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Pickup Photos
CREATE TABLE IF NOT EXISTS pickup_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_request_id INTEGER NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'CITIZEN_INITIAL' CHECK(photo_type IN ('CITIZEN_INITIAL', 'WASTE_PILE')),
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Completion Proofs
CREATE TABLE IF NOT EXISTS completion_proofs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_request_id INTEGER UNIQUE NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  proof_photo_url TEXT NOT NULL,
  collected_weight_kg REAL,
  driver_notes TEXT,
  verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Driver Assignments
CREATE TABLE IF NOT EXISTS driver_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_request_id INTEGER NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  sequence_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK(status IN ('ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'PICKED_UP', 'COMPLETED', 'FAILED')),
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- 8. Routes
CREATE TABLE IF NOT EXISTS routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id INTEGER NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK(status IN ('PLANNED', 'ACTIVE', 'COMPLETED')),
  total_stops INTEGER NOT NULL DEFAULT 0,
  total_distance_km REAL NOT NULL DEFAULT 0.0,
  optimized_waypoints_json TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  citizen_id INTEGER NOT NULL REFERENCES citizen_profiles(id) ON DELETE CASCADE,
  pickup_request_id INTEGER REFERENCES pickup_requests(id) ON DELETE SET NULL,
  complaint_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'IN_REVIEW', 'RESOLVED', 'REJECTED')),
  admin_notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO' CHECK(type IN ('INFO', 'SUCCESS', 'WARNING', 'ALERT')),
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance and Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_citizen_user ON citizen_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_user ON driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pickup_citizen ON pickup_requests(citizen_id);
CREATE INDEX IF NOT EXISTS idx_pickup_status ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_assignment_driver ON driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_assignment_pickup ON driver_assignments(pickup_request_id);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
