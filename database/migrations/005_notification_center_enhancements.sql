-- ====================================================================
-- ECHO ROUTE SMART WASTE - MIGRATION 005: NOTIFICATIONS CENTER & ACTIVITY
-- Adds related pickup foreign key, semantic notification types, and indexes
-- ====================================================================

-- 1. Add related pickup reference and semantic type to notifications table
ALTER TABLE notifications ADD COLUMN related_pickup_id INTEGER REFERENCES pickup_requests(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN notification_type TEXT DEFAULT 'GENERAL';
ALTER TABLE notifications ADD COLUMN action_url TEXT;

-- 2. Add performance indexes for rapid unread queries and sorting
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_pickup ON notifications(related_pickup_id);

-- 3. Backfill semantic notification types from existing notification titles
UPDATE notifications
SET notification_type = CASE
  WHEN title LIKE '%Registered%' OR title LIKE '%Submitted%' THEN 'PICKUP_SUBMITTED'
  WHEN title LIKE '%Verified%' THEN 'PICKUP_VERIFIED'
  WHEN title LIKE '%New Stop Assigned%' THEN 'NEW_ASSIGNMENT'
  WHEN title LIKE '%Driver Assigned%' THEN 'DRIVER_ASSIGNED'
  WHEN title LIKE '%Accepted%' THEN 'DRIVER_ACCEPTED'
  WHEN title LIKE '%On The Way%' OR title LIKE '%In Transit%' THEN 'DRIVER_EN_ROUTE'
  WHEN title LIKE '%Arrived%' THEN 'DRIVER_ARRIVED'
  WHEN title LIKE '%Picked Up%' THEN 'PICKUP_COLLECTED'
  WHEN title LIKE '%Completed%' THEN 'PICKUP_COMPLETED'
  WHEN title LIKE '%Grievance%' OR title LIKE '%Complaint%' THEN 'COMPLAINT_UPDATE'
  WHEN title LIKE '%New Citizen Pickup%' THEN 'NEW_PICKUP_REQUEST'
  ELSE 'GENERAL'
END
WHERE notification_type = 'GENERAL' OR notification_type IS NULL;
