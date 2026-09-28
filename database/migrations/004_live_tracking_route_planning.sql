-- ====================================================================
-- ECHO ROUTE SMART WASTE - MIGRATION 004: LIVE TRACKING & ROUTE PLANNING
-- Adds driver location history table and extends routes with depot data
-- ====================================================================

-- 1. Create driver location history table for telemetry & tracking
CREATE TABLE IF NOT EXISTS driver_location_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id INTEGER NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  speed_kmh REAL DEFAULT 0.0,
  heading_deg REAL DEFAULT 0.0,
  active_pickup_id INTEGER REFERENCES pickup_requests(id) ON DELETE SET NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loc_driver ON driver_location_history(driver_id);
CREATE INDEX IF NOT EXISTS idx_loc_recorded ON driver_location_history(recorded_at);

-- 2. Add depot parameters to routes table
ALTER TABLE routes ADD COLUMN depot_name TEXT DEFAULT 'Gram Panchayat Central Sanitation Depot';
ALTER TABLE routes ADD COLUMN depot_lat REAL DEFAULT 28.5320;
ALTER TABLE routes ADD COLUMN depot_lng REAL DEFAULT 77.3880;
ALTER TABLE routes ADD COLUMN estimated_duration_mins INTEGER DEFAULT 45;

-- 3. Seed initial telemetry record for Driver 1 (Simulated Prototype GPS)
INSERT INTO driver_location_history (driver_id, latitude, longitude, speed_kmh, heading_deg, recorded_at)
VALUES (1, 28.5340, 77.3895, 22.5, 45.0, CURRENT_TIMESTAMP);
