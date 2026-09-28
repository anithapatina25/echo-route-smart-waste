/**
 * ECHO ROUTE SMART WASTE
 * Citizen Operations Controller
 */
const CitizenModel = require('../models/citizen.model');
const UploadService = require('../services/upload.service');
const { WASTE_TYPE_MAP } = require('../config/constants');
const { ApiError } = require('../middleware/error.middleware');

const CitizenController = {
  // Legacy status endpoint (kept for backward compatibility)
  getStatus: (req, res, next) => {
    try {
      const profile = CitizenModel.findByUserId(req.user.id);
      const pickups = profile ? CitizenModel.getMyPickups(profile.id) : [];
      const notifications = CitizenModel.getNotifications(req.user.id);

      res.status(200).json({
        success: true,
        stage: 'Stage 3: Complete Citizen Portal Active',
        message: 'Citizen portal is operational with real database operations.',
        data: {
          user: req.user,
          profile,
          recentPickups: pickups,
          notifications
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 1. Dashboard metrics & overview
  getDashboard: (req, res, next) => {
    try {
      const profile = CitizenModel.findByUserId(req.user.id);
      if (!profile) {
        throw ApiError.notFound('Citizen profile not found for this account.');
      }

      const stats = CitizenModel.getDashboardStats(profile.id);
      const recentPickups = CitizenModel.getMyPickups(profile.id).slice(0, 5);
      const notifications = CitizenModel.getNotifications(req.user.id).slice(0, 5);

      res.status(200).json({
        success: true,
        data: {
          profile,
          stats,
          recentPickups,
          notifications
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Get Citizen's Pickups (with filter support)
  getPickups: (req, res, next) => {
    try {
      const profile = CitizenModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Citizen profile not found.');

      const filter = (req.query.filter || 'all').toLowerCase();
      const pickups = CitizenModel.getMyPickups(profile.id, filter);

      res.status(200).json({
        success: true,
        count: pickups.length,
        filter,
        data: pickups
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Get Specific Pickup by ID (Strict RBAC Ownership Check)
  getPickupById: (req, res, next) => {
    try {
      const profile = CitizenModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Citizen profile not found.');

      const pickup = CitizenModel.getPickupById(req.params.id);
      if (!pickup) {
        throw ApiError.notFound(`Pickup request #${req.params.id} not found.`);
      }

      // Security: verify request belongs to this authenticated citizen
      if (pickup.citizen_id !== profile.id) {
        throw ApiError.forbidden(
          `Access Denied: You do not have permission to view another citizen's pickup request #${req.params.id}.`
        );
      }

      res.status(200).json({
        success: true,
        data: pickup
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Create Pickup Request
  createPickup: (req, res, next) => {
    try {
      const profile = CitizenModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Citizen profile not found.');

      const {
        waste_type,
        estimated_volume_bags,
        scheduled_date,
        preferred_time,
        address,
        landmark,
        ward_number,
        gps_lat,
        gps_lng,
        description,
        photo_data
      } = req.body;

      // Validation
      if (!waste_type) {
        throw ApiError.badRequest('Waste Type is required.');
      }
      const mappedWasteType = WASTE_TYPE_MAP[waste_type];
      if (!mappedWasteType) {
        throw ApiError.badRequest(
          `Invalid Waste Type: '${waste_type}'. Valid options: Household Waste, Plastic Waste, E-Waste, Bulky Waste, Other.`
        );
      }

      const volume = parseInt(estimated_volume_bags, 10);
      if (isNaN(volume) || volume < 1) {
        throw ApiError.badRequest('Quantity must be a valid positive number of bags (minimum 1).');
      }

      if (!scheduled_date) {
        throw ApiError.badRequest('Pickup Date is required.');
      }

      if (!preferred_time) {
        throw ApiError.badRequest('Preferred Time Slot is required.');
      }

      if (!address || !address.trim()) {
        throw ApiError.badRequest('Address is required.');
      }

      // Save photo if base64 provided
      let photoUrl = null;
      if (photo_data) {
        photoUrl = UploadService.saveBase64Photo(photo_data, 'waste.jpg');
      }

      const newPickup = CitizenModel.createPickup(profile.id, {
        waste_type: mappedWasteType,
        estimated_volume_bags: volume,
        scheduled_date,
        preferred_time,
        address: address.trim(),
        ward_number: ward_number || profile.ward_number || 'Ward 4',
        gps_lat: gps_lat || profile.gps_lat || 28.5355,
        gps_lng: gps_lng || profile.gps_lng || 77.3910,
        description: description ? description.trim() : '',
        photo_url: photoUrl
      });

      res.status(201).json({
        success: true,
        message: 'Pickup request registered successfully.',
        data: newPickup
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. Standalone Photo Upload
  uploadPhoto: (req, res, next) => {
    try {
      const { photo_data, filename } = req.body;
      if (!photo_data) {
        throw ApiError.badRequest('No photo data provided.');
      }

      const photoUrl = UploadService.saveBase64Photo(photo_data, filename || 'waste.jpg');
      res.status(200).json({
        success: true,
        message: 'Photo uploaded successfully.',
        photo_url: photoUrl
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Track Pickup (Active or Specific)
  getTrackPickup: (req, res, next) => {
    try {
      const profile = CitizenModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Citizen profile not found.');

      let pickup = null;
      if (req.params.id) {
        pickup = CitizenModel.getPickupById(req.params.id);
        if (!pickup) {
          throw ApiError.notFound(`Pickup request #${req.params.id} not found.`);
        }
        if (pickup.citizen_id !== profile.id) {
          throw ApiError.forbidden('Access denied to another citizen\'s pickup request.');
        }
      } else {
        const stats = CitizenModel.getDashboardStats(profile.id);
        pickup = stats.activePickup;
      }

      res.status(200).json({
        success: true,
        data: pickup,
        gpsNotice: 'Live GPS tracking will be available during the driver tracking stage.'
      });
    } catch (err) {
      next(err);
    }
  },

  // 7. Grievance / Complaints
  getComplaints: (req, res, next) => {
    try {
      const profile = CitizenModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Citizen profile not found.');

      const complaints = CitizenModel.getComplaints(profile.id);
      res.status(200).json({
        success: true,
        data: complaints
      });
    } catch (err) {
      next(err);
    }
  },

  createComplaint: (req, res, next) => {
    try {
      const profile = CitizenModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Citizen profile not found.');

      const { subject, description, complaint_type, pickup_request_id } = req.body;

      if (!subject || !subject.trim()) {
        throw ApiError.badRequest('Complaint subject is required.');
      }
      if (!description || !description.trim()) {
        throw ApiError.badRequest('Detailed complaint description is required.');
      }

      // If associated with a pickup request, verify it belongs to this citizen
      if (pickup_request_id) {
        const pickup = CitizenModel.getPickupById(pickup_request_id);
        if (!pickup || pickup.citizen_id !== profile.id) {
          throw ApiError.forbidden('Cannot associate complaint with another citizen\'s pickup request.');
        }
      }

      const complaint = CitizenModel.createComplaint(profile.id, {
        subject: subject.trim(),
        description: description.trim(),
        complaint_type: complaint_type || 'General Service Grievance',
        pickup_request_id: pickup_request_id || null
      });

      res.status(201).json({
        success: true,
        message: 'Grievance submitted successfully.',
        data: complaint
      });
    } catch (err) {
      next(err);
    }
  },

  // 8. Profile View & Edit
  getProfile: (req, res, next) => {
    try {
      const profile = CitizenModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Citizen profile not found.');

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
          profile
        }
      });
    } catch (err) {
      next(err);
    }
  },

  updateProfile: (req, res, next) => {
    try {
      const { phone, house_number, landmark, village_name, ward_number } = req.body;
      const updated = CitizenModel.updateProfile(req.user.id, {
        phone,
        house_number,
        landmark,
        village_name,
        ward_number
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  // 9. Notifications
  getNotifications: (req, res, next) => {
    try {
      const notifications = CitizenModel.getNotifications(req.user.id);
      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (err) {
      next(err);
    }
  },

  markNotificationRead: (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const updated = CitizenModel.markNotificationRead(req.user.id, notificationId);
      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = CitizenController;
