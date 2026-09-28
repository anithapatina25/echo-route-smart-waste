/**
 * ECHO ROUTE SMART WASTE
 * Citizen Routes (Protected: CITIZEN role only)
 */
const express = require('express');
const router = express.Router();
const CitizenController = require('../controllers/citizen.controller');
const TrackingController = require('../controllers/tracking.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All citizen routes require authenticated CITIZEN role
router.use(requireAuth);
router.use(requireRole('CITIZEN'));

// Legacy status check
router.get('/status', CitizenController.getStatus);

// Dashboard & Stats
router.get('/dashboard', CitizenController.getDashboard);

// Pickup Requests
router.get('/pickups', CitizenController.getPickups);
router.get('/pickups/:id', CitizenController.getPickupById);
router.post('/pickups', CitizenController.createPickup);

// Standalone Photo Upload
router.post('/upload-photo', CitizenController.uploadPhoto);

// Real-time Track Pickup
router.get('/track', CitizenController.getTrackPickup);
router.get('/track/:id', CitizenController.getTrackPickup);
router.get('/track/:id/map', TrackingController.getCitizenTrackMap);

// Complaints & Grievances
router.get('/complaints', CitizenController.getComplaints);
router.post('/complaints', CitizenController.createComplaint);

// Profile
router.get('/profile', CitizenController.getProfile);
router.put('/profile', CitizenController.updateProfile);

// In-app Notifications
router.get('/notifications', CitizenController.getNotifications);
router.patch('/notifications/:id/read', CitizenController.markNotificationRead);

module.exports = router;
