-- ====================================================================
-- ECHO ROUTE SMART WASTE - MIGRATION 002: CITIZEN PORTAL ENHANCEMENTS
-- Adds preferred pickup time slot and human-readable tracking request codes
-- ====================================================================

-- 1. Add preferred_time column to pickup_requests (e.g. Morning, Afternoon, Evening)
ALTER TABLE pickup_requests ADD COLUMN preferred_time TEXT DEFAULT 'Morning (08:00 - 11:00 AM)';

-- 2. Add request_code column to pickup_requests (e.g. REQ-2026-XXXX)
ALTER TABLE pickup_requests ADD COLUMN request_code TEXT;

-- 3. Create index on request_code for fast lookup
CREATE INDEX IF NOT EXISTS idx_pickup_request_code ON pickup_requests(request_code);

-- 4. Backfill existing demo pickup with formatted request code
UPDATE pickup_requests 
SET request_code = 'REQ-2026-0001', preferred_time = 'Morning (08:00 - 11:00 AM)' 
WHERE id = 1 AND request_code IS NULL;
