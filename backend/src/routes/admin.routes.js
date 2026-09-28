/**
 * ECHO ROUTE SMART WASTE
 * Admin Routes (Protected: ADMIN role only)
 */
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const TrackingController = require('../controllers/tracking.controller');
const NotificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All admin routes strictly require authenticated ADMIN role
router.use(requireAuth);
router.use(requireRole('ADMIN'));

// Legacy status check
router.get('/status', AdminController.getStatus);

// Dashboard overview & 8 dynamic metrics
router.get('/dashboard', AdminController.getDashboard);

// Recent System Activity Feed (Stage 7)
router.get('/activity', NotificationController.getAdminActivity);

// Pickup Requests Management
router.get('/pickups', AdminController.getPickups);
router.get('/pickups/:id', AdminController.getPickupById);
router.patch('/pickups/:id/verify', AdminController.verifyPickup);
router.post('/pickups/:id/assign', AdminController.assignDriver);

// Drivers Management
router.get('/drivers', AdminController.getDrivers);
router.post('/drivers', AdminController.createDriver);
router.patch('/drivers/:id/duty', AdminController.toggleDriverDuty);

// Citizens Directory (Read-Only)
router.get('/citizens', AdminController.getCitizens);

// Complaints Management
router.get('/complaints', AdminController.getComplaints);
router.patch('/complaints/:id', AdminController.updateComplaint);

// Live Tracking & Route Planning (Stage 6)
router.get('/tracking', TrackingController.getAdminTracking);
router.get('/routes', TrackingController.getAdminRoutes);
router.post('/routes/:driverId/recalculate', TrackingController.recalculateRoute);

module.exports = router;
