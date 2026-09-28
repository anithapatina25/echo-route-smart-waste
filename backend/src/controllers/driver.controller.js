/**
 * ECHO ROUTE SMART WASTE
 * Driver Controller
 * Handles all driver cockpit, route, workflow, and proof endpoints
 */
const DriverModel = require('../models/driver.model');
const UploadService = require('../services/upload.service');
const db = require('../../../database/client');
const { ApiError } = require('../middleware/error.middleware');

const DriverController = {
  // Legacy status endpoint (backwards compatibility)
  getStatus: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const stats = DriverModel.getDashboardStats(profile.id);
      const assignments = DriverModel.getDriverPickups(profile.id, 'all');
      const notifications = db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [req.user.id]
      );

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
          profile,
          metrics: stats,
          assignments,
          notifications
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 1. Driver Dashboard with 4 Dynamic SQLite Metrics
  getDashboard: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const metrics = DriverModel.getDashboardStats(profile.id);
      const recentAssignments = DriverModel.getDriverPickups(profile.id, 'all').slice(0, 5);
      const notifications = db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [req.user.id]
      );

      res.status(200).json({
        success: true,
        data: {
          metrics,
          recentAssignments,
          profile,
          notifications
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Filtered Assigned Pickups (Strictly scoped to authenticated driver)
  getPickups: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const filter = req.query.filter || 'all';
      const pickups = DriverModel.getDriverPickups(profile.id, filter);

      res.status(200).json({
        success: true,
        data: pickups,
        count: pickups.length
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Single Pickup Details with Strict RBAC Isolation
  getPickupById: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const pickupId = req.params.id;
      const pickup = DriverModel.getPickupDetails(profile.id, pickupId);

      if (!pickup) {
        // Check if request exists in system to provide correct 403 Forbidden vs 404
        const exists = db.get(
          'SELECT id, request_code FROM pickup_requests WHERE id = ? OR request_code = ?',
          [pickupId, pickupId]
        );

        if (exists) {
          throw ApiError.forbidden(
            `Access Denied: You do not have permission to view pickup request #${pickupId}. It is not assigned to your driver fleet profile.`
          );
        } else {
          throw ApiError.notFound(`Pickup request #${pickupId} not found.`);
        }
      }

      res.status(200).json({
        success: true,
        data: pickup
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Accept Assignment
  acceptAssignment: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const updated = DriverModel.acceptAssignment(profile.id, req.params.id, req.user.fullName);

      res.status(200).json({
        success: true,
        message: 'Assignment accepted successfully. Citizen and Admin notified.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. Update Status (START / ON_THE_WAY, ARRIVED, PICKED_UP)
  updateStatus: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const { action } = req.body;
      if (!action) {
        throw ApiError.badRequest("Action is required. Valid actions: 'START', 'ARRIVED', 'PICKED_UP'.");
      }

      const updated = DriverModel.updateWorkflowStep(profile.id, req.params.id, action, req.user.fullName);

      res.status(200).json({
        success: true,
        message: `Pickup status transitioned via action '${action}'.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Upload Completion Proof Photo
  uploadProof: (req, res, next) => {
    try {
      const { photo_data, filename } = req.body;
      if (!photo_data) {
        throw ApiError.badRequest('No completion proof photo data provided.');
      }

      const proofUrl = UploadService.saveCompletionProof(photo_data, filename || 'proof_photo.jpg');

      res.status(200).json({
        success: true,
        message: 'Completion proof photo uploaded successfully.',
        proof_photo_url: proofUrl
      });
    } catch (err) {
      next(err);
    }
  },

  // 7. Complete Pickup (Mandatory Proof Validation)
  completePickup: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      let { proof_photo_url, photo_data, driver_notes, collected_weight_kg } = req.body;

      // If raw base64 photo is sent in payload, save it first
      if (!proof_photo_url && photo_data) {
        proof_photo_url = UploadService.saveCompletionProof(photo_data, 'proof_photo.jpg');
      }

      if (!proof_photo_url) {
        throw ApiError.badRequest(
          'Completion Proof Required: Driver must upload a photographic proof of collection before closing the pickup.'
        );
      }

      const completed = DriverModel.completePickup(
        profile.id,
        req.params.id,
        {
          proofPhotoUrl: proof_photo_url,
          driverNotes: driver_notes,
          collectedWeightKg: collected_weight_kg
        },
        req.user.fullName
      );

      res.status(200).json({
        success: true,
        message: 'Pickup request successfully marked as completed with photographic proof.',
        data: completed
      });
    } catch (err) {
      next(err);
    }
  },

  // 8. Today's Route Sequenced Stops
  getTodaysRoute: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const stops = DriverModel.getTodaysRoute(profile.id);

      res.status(200).json({
        success: true,
        data: stops,
        count: stops.length,
        prototypeNotice: 'Prototype Route: Sequence generated based on ward cluster. Real-time GPS navigation stream will be connected in Stage 6.'
      });
    } catch (err) {
      next(err);
    }
  },

  // 9. Completed Pickups List
  getCompletedPickups: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const completed = DriverModel.getCompletedPickups(profile.id);

      res.status(200).json({
        success: true,
        data: completed,
        count: completed.length
      });
    } catch (err) {
      next(err);
    }
  },

  // 10. Driver Profile
  getProfile: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const stats = DriverModel.getDashboardStats(profile.id);

      res.status(200).json({
        success: true,
        data: {
          ...profile,
          totalCompleted: stats.completedPickups,
          activeAssignments: stats.activePickups + stats.pendingPickups
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 11. Duty Status Toggle
  toggleDuty: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const updated = DriverModel.toggleDuty(profile.id);

      res.status(200).json({
        success: true,
        message: `Driver duty status toggled to ${updated.is_on_duty === 1 ? 'ON DUTY' : 'OFF DUTY'}.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = DriverController;
