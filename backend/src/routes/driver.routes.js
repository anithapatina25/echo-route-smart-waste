/**
 * ECHO ROUTE SMART WASTE
 * Driver Routes (Protected: DRIVER role only)
 */
const express = require('express');
const router = express.Router();
const DriverController = require('../controllers/driver.controller');
const TrackingController = require('../controllers/tracking.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All driver endpoints require authenticated DRIVER role
router.use(requireAuth);
router.use(requireRole('DRIVER'));

// 1. Status & Dashboard
router.get('/status', DriverController.getStatus);
router.get('/dashboard', DriverController.getDashboard);

// 2. Pickups & Workflow
router.get('/pickups', DriverController.getPickups);
router.get('/pickups/:id', DriverController.getPickupById);
router.post('/pickups/:id/accept', DriverController.acceptAssignment);
router.patch('/pickups/:id/status', DriverController.updateStatus);

// 3. Photographic Completion Proof & Complete
router.post('/upload-proof', DriverController.uploadProof);
router.post('/pickups/:id/complete', DriverController.completePickup);

// 4. Today's Route & Completed
router.get('/route', DriverController.getTodaysRoute);
router.get('/completed', DriverController.getCompletedPickups);

// 5. Driver Profile & Duty Toggle
router.get('/profile', DriverController.getProfile);
router.patch('/duty', DriverController.toggleDuty);

// 6. Live Tracking & Location Updates (Stage 6)
router.post('/location', TrackingController.postDriverLocation);
router.get('/location', TrackingController.getDriverLocation);
router.get('/route/map', TrackingController.getDriverRouteMap);

module.exports = router;
