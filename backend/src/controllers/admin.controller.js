/**
 * ECHO ROUTE SMART WASTE
 * Admin & Panchayat Operations Controller
 */
const PickupModel = require('../models/pickup.model');
const AdminModel = require('../models/admin.model');
const { ApiError } = require('../middleware/error.middleware');

const AdminController = {
  // Legacy status endpoint
  getStatus: (req, res, next) => {
    try {
      const overview = PickupModel.getSystemOverview();
      const drivers = AdminModel.getDrivers();
      const recentPickups = PickupModel.getAllPickups('all').slice(0, 10);

      res.status(200).json({
        success: true,
        stage: 'Stage 4: Complete Admin / Panchayat Portal Active',
        message: 'Gram Panchayat Command Center is fully operational.',
        data: {
          user: req.user,
          overview,
          drivers,
          recentPickups
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 1. Dashboard Metrics (8 Dynamic Metrics)
  getDashboard: (req, res, next) => {
    try {
      const metrics = PickupModel.getSystemOverview();
      const recentPickups = PickupModel.getAllPickups('all').slice(0, 6);
      const drivers = AdminModel.getDrivers().slice(0, 6);
      const recentComplaints = AdminModel.getComplaints().slice(0, 5);

      res.status(200).json({
        success: true,
        data: {
          metrics,
          recentPickups,
          drivers,
          recentComplaints
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Pickup Requests List
  getPickups: (req, res, next) => {
    try {
      const filter = (req.query.filter || 'all').toLowerCase();
      const pickups = PickupModel.getAllPickups(filter);

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

  // 3. Pickup Details by ID
  getPickupById: (req, res, next) => {
    try {
      const pickup = PickupModel.getPickupDetails(req.params.id);
      if (!pickup) {
        throw ApiError.notFound(`Pickup request #${req.params.id} not found.`);
      }

      res.status(200).json({
        success: true,
        data: pickup
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Verify Pickup Request (PENDING -> VERIFIED)
  verifyPickup: (req, res, next) => {
    try {
      const existing = PickupModel.getPickupDetails(req.params.id);
      if (!existing) {
        throw ApiError.notFound(`Pickup request #${req.params.id} not found.`);
      }

      const verified = PickupModel.verifyPickup(existing.id, req.user.id);
      res.status(200).json({
        success: true,
        message: `Pickup request ${verified.request_code} has been verified.`,
        data: verified
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. Assign Driver to Pickup Request
  assignDriver: (req, res, next) => {
    try {
      const { driver_id } = req.body;
      if (!driver_id) {
        throw ApiError.badRequest('Driver ID is required to assign vehicle.');
      }

      const existing = PickupModel.getPickupDetails(req.params.id);
      if (!existing) {
        throw ApiError.notFound(`Pickup request #${req.params.id} not found.`);
      }

      const updated = PickupModel.assignDriver(existing.id, parseInt(driver_id, 10), req.user.id);
      res.status(200).json({
        success: true,
        message: `Driver assigned to ${updated.request_code} successfully.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Drivers Roster
  getDrivers: (req, res, next) => {
    try {
      const drivers = AdminModel.getDrivers();
      res.status(200).json({
        success: true,
        count: drivers.length,
        data: drivers
      });
    } catch (err) {
      next(err);
    }
  },

  // Enroll / Register New Driver
  createDriver: async (req, res, next) => {
    try {
      const {
        email,
        password,
        fullName,
        full_name,
        phone,
        vehicleNumber,
        vehicle_number,
        vehicleType,
        vehicle_type,
        licenseNumber,
        license_number,
        capacityKg,
        capacity_kg,
        isOnDuty,
        is_on_duty
      } = req.body;

      const effectiveFullName = full_name || fullName;
      const effectiveVehicleNumber = vehicle_number || vehicleNumber;
      const effectiveLicenseNumber = license_number || licenseNumber;
      const effectiveVehicleType = vehicle_type || vehicleType || 'Tata Ace Tipper';
      const effectiveCapacity = capacity_kg || capacityKg || 1000.0;
      const effectiveOnDuty = is_on_duty !== undefined ? is_on_duty : (isOnDuty !== undefined ? isOnDuty : 1);

      if (!email || !password || !effectiveFullName || !effectiveVehicleNumber || !effectiveLicenseNumber) {
        throw ApiError.badRequest('Email, password, full name, vehicle number, and license number are required.');
      }

      if (password.length < 6) {
        throw ApiError.badRequest('Password must be at least 6 characters long.');
      }

      const newDriver = await AdminModel.createDriver({
        email,
        password,
        full_name: effectiveFullName,
        phone,
        vehicle_number: effectiveVehicleNumber,
        vehicle_type: effectiveVehicleType,
        license_number: effectiveLicenseNumber,
        capacity_kg: effectiveCapacity,
        is_on_duty: effectiveOnDuty
      });

      res.status(201).json({
        success: true,
        message: `Driver ${newDriver.driver_name} enrolled successfully with vehicle ${newDriver.vehicle_number}.`,
        data: newDriver
      });
    } catch (err) {
      next(err);
    }
  },

  // 7. Toggle Driver Duty Status
  toggleDriverDuty: (req, res, next) => {
    try {
      const updated = AdminModel.toggleDriverDuty(parseInt(req.params.id, 10));
      res.status(200).json({
        success: true,
        message: `Driver duty status updated to ${updated.is_on_duty ? 'ON DUTY' : 'OFF DUTY'}.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  // 8. Citizen Directory (Read-Only)
  getCitizens: (req, res, next) => {
    try {
      const citizens = AdminModel.getCitizens();
      res.status(200).json({
        success: true,
        count: citizens.length,
        data: citizens
      });
    } catch (err) {
      next(err);
    }
  },

  // 9. Complaints Management
  getComplaints: (req, res, next) => {
    try {
      const complaints = AdminModel.getComplaints();
      res.status(200).json({
        success: true,
        count: complaints.length,
        data: complaints
      });
    } catch (err) {
      next(err);
    }
  },

  updateComplaint: (req, res, next) => {
    try {
      const { status, admin_notes } = req.body;
      const validStatuses = ['SUBMITTED', 'IN_REVIEW', 'RESOLVED', 'REJECTED'];

      if (!status || !validStatuses.includes(status)) {
        throw ApiError.badRequest(
          `Invalid grievance status: '${status}'. Valid: ${validStatuses.join(', ')}.`
        );
      }

      const updated = AdminModel.resolveComplaint(
        parseInt(req.params.id, 10),
        status,
        admin_notes || '',
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: `Grievance #${req.params.id} updated to ${status}.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AdminController;
