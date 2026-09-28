/**
 * ECHO ROUTE SMART WASTE
 * Tracking & Route Planning Controller
 */
const TrackingModel = require('../models/tracking.model');
const DriverModel = require('../models/driver.model');
const { ApiError } = require('../middleware/error.middleware');

const TrackingController = {
  // 1. Admin Live Tracking Telemetry
  getAdminTracking: (req, res, next) => {
    try {
      const data = TrackingModel.getAdminTrackingData();
      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Admin Routes List
  getAdminRoutes: (req, res, next) => {
    try {
      const routes = TrackingModel.getAdminRoutes();
      res.status(200).json({
        success: true,
        data: routes,
        count: routes.length
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Admin Recalculate Route for a Driver
  recalculateRoute: (req, res, next) => {
    try {
      const driverId = parseInt(req.params.driverId, 10);
      if (isNaN(driverId)) throw ApiError.badRequest('Invalid driver ID parameter.');

      const result = TrackingModel.recalculateDriverRoute(driverId);
      res.status(200).json({
        success: true,
        message: 'Route sequenced and optimized successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Driver Updates Own Location (POST /api/driver/location)
  postDriverLocation: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const { latitude, longitude, speed_kmh, heading_deg, active_pickup_id } = req.body;

      if (latitude === undefined || longitude === undefined) {
        throw ApiError.badRequest('Both latitude and longitude are required.');
      }

      const result = TrackingModel.updateDriverLocation(profile.id, {
        latitude,
        longitude,
        speedKmh: speed_kmh,
        headingDeg: heading_deg,
        activePickupId: active_pickup_id
      });

      res.status(200).json({
        success: true,
        message: 'Driver location coordinates updated.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. Driver Gets Own Location
  getDriverLocation: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const data = TrackingModel.getDriverLocation(profile.id);
      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Driver Route Map Telemetry (Scoped to authenticated driver)
  getDriverRouteMap: (req, res, next) => {
    try {
      const profile = DriverModel.findByUserId(req.user.id);
      if (!profile) throw ApiError.notFound('Driver profile not found.');

      const data = TrackingModel.getDriverRouteMap(profile.id);
      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  // 7. Citizen Pickup Tracking Map
  getCitizenTrackMap: (req, res, next) => {
    try {
      const pickupId = req.params.id;
      const data = TrackingModel.getCitizenTrackingMap(pickupId, req.user?.id);
      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = TrackingController;
