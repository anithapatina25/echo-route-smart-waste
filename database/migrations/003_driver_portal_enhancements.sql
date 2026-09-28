-- ====================================================================
-- ECHO ROUTE SMART WASTE - MIGRATION 003: DRIVER PORTAL ENHANCEMENTS
-- Adds lifecycle timestamps, ACCEPTED status check, and driver notes
-- ====================================================================

-- 1. Create temporary table with upgraded check constraint & timestamp columns
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS driver_assignments_v3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_request_id INTEGER NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  sequence_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK(status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'PICKED_UP', 'COMPLETED', 'FAILED')),
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  started_at DATETIME,
  arrived_at DATETIME,
  picked_up_at DATETIME,
  completed_at DATETIME,
  driver_notes TEXT
);

-- 2. Migrate all existing assignment data safely
INSERT INTO driver_assignments_v3 (
  id, pickup_request_id, driver_id, assigned_by, sequence_order, status, assigned_at, completed_at
)
SELECT 
  id, pickup_request_id, driver_id, assigned_by, sequence_order, status, assigned_at, completed_at 
FROM driver_assignments;

-- 3. Replace old table
DROP TABLE driver_assignments;
ALTER TABLE driver_assignments_v3 RENAME TO driver_assignments;

-- 4. Re-establish performance and query indexes
CREATE INDEX IF NOT EXISTS idx_assignment_driver ON driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_assignment_pickup ON driver_assignments(pickup_request_id);

PRAGMA foreign_keys = ON;
