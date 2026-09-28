/**
 * ECHO ROUTE SMART WASTE
 * Pickup Requests & Administrative Operations Model
 */
const db = require('../../../database/client');
const { calculateTimelineStage, WASTE_TYPE_LABELS, TIMELINE_STAGES } = require('../config/constants');
const NotificationModel = require('./notification.model');

const PickupModel = {
  // 1. Eight Dynamic Database Metrics
  getSystemOverview: () => {
    const totalCitizens = db.get('SELECT COUNT(*) as count FROM citizen_profiles').count;
    const registeredDrivers = db.get('SELECT COUNT(*) as count FROM driver_profiles').count;
    const totalPickups = db.get('SELECT COUNT(*) as count FROM pickup_requests').count;
    const pendingRequests = db.get("SELECT COUNT(*) as count FROM pickup_requests WHERE status = 'PENDING'").count;
    const verifiedRequests = db.get("SELECT COUNT(*) as count FROM pickup_requests WHERE status = 'VERIFIED'").count;
    const activePickups = db.get("SELECT COUNT(*) as count FROM pickup_requests WHERE status IN ('ASSIGNED', 'IN_TRANSIT', 'COLLECTED')").count;
    const completedPickups = db.get("SELECT COUNT(*) as count FROM pickup_requests WHERE status = 'COMPLETED'").count;
    const openComplaints = db.get("SELECT COUNT(*) as count FROM complaints WHERE status IN ('SUBMITTED', 'IN_REVIEW')").count;

    return {
      totalCitizens,
      registeredDrivers,
      totalPickups,
      pendingRequests,
      verifiedRequests,
      activePickups,
      completedPickups,
      openComplaints
    };
  },

  // 2. Filterable List of All Requests for Admin
  getAllPickups: (filter = 'all') => {
    let filterSql = '';
    const params = [];

    if (filter === 'pending' || filter === 'requested') {
      filterSql = " WHERE pr.status = 'PENDING'";
    } else if (filter === 'verified') {
      filterSql = " WHERE pr.status = 'VERIFIED'";
    } else if (filter === 'assigned') {
      filterSql = " WHERE pr.status = 'ASSIGNED'";
    } else if (filter === 'active') {
      filterSql = " WHERE pr.status IN ('IN_TRANSIT', 'COLLECTED')";
    } else if (filter === 'completed') {
      filterSql = " WHERE pr.status = 'COMPLETED'";
    }

    const rows = db.query(
      `SELECT pr.*, 
              cp.village_name, cp.house_number, cp.landmark,
              cu.full_name as citizen_name, cu.email as citizen_email, cu.phone as citizen_phone,
              da.id as assignment_id, da.status as assignment_status, da.assigned_at,
              dp.id as assigned_driver_id, dp.vehicle_number, dp.vehicle_type, dp.capacity_kg,
              du.full_name as driver_name, du.phone as driver_phone,
              (SELECT photo_url FROM pickup_photos pp WHERE pp.pickup_request_id = pr.id LIMIT 1) as photo_url,
              (SELECT COUNT(*) FROM pickup_photos pp WHERE pp.pickup_request_id = pr.id) as photo_count
       FROM pickup_requests pr
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       LEFT JOIN driver_assignments da ON da.pickup_request_id = pr.id
       LEFT JOIN driver_profiles dp ON da.driver_id = dp.id
       LEFT JOIN users du ON dp.user_id = du.id
       ${filterSql}
       ORDER BY pr.created_at DESC`,
      params
    );

    return rows.map(r => {
      const timelineStage = calculateTimelineStage(r.status, r.assignment_status);
      return {
        ...r,
        waste_type_label: WASTE_TYPE_LABELS[r.waste_type] || r.waste_type,
        timelineStage,
        timelineInfo: TIMELINE_STAGES.find(s => s.id === timelineStage)
      };
    });
  },

  // 3. Complete Pickup Details
  getPickupDetails: (id) => {
    const raw = db.get(
      `SELECT pr.*, 
              cp.village_name, cp.house_number, cp.landmark, cp.user_id as citizen_user_id,
              cu.full_name as citizen_name, cu.email as citizen_email, cu.phone as citizen_phone,
              da.id as assignment_id, da.status as assignment_status, da.assigned_at, da.sequence_order,
              dp.id as assigned_driver_id, dp.vehicle_number, dp.vehicle_type, dp.capacity_kg, dp.license_number,
              du.full_name as driver_name, du.phone as driver_phone,
              cp_proof.proof_photo_url, cp_proof.collected_weight_kg, cp_proof.driver_notes, cp_proof.completed_at
       FROM pickup_requests pr
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       LEFT JOIN driver_assignments da ON da.pickup_request_id = pr.id
       LEFT JOIN driver_profiles dp ON da.driver_id = dp.id
       LEFT JOIN users du ON dp.user_id = du.id
       LEFT JOIN completion_proofs cp_proof ON cp_proof.pickup_request_id = pr.id
       WHERE pr.id = ? OR pr.request_code = ?`,
      [id, id]
    );

    if (!raw) return null;

    const photos = db.query(
      'SELECT id, photo_url, photo_type, uploaded_at FROM pickup_photos WHERE pickup_request_id = ?',
      [raw.id]
    );

    const timelineStage = calculateTimelineStage(raw.status, raw.assignment_status);

    return {
      ...raw,
      photos,
      waste_type_label: WASTE_TYPE_LABELS[raw.waste_type] || raw.waste_type,
      timelineStage,
      timelineStages: TIMELINE_STAGES.map(stage => ({
        ...stage,
        isCurrent: stage.id === timelineStage,
        isCompleted: stage.order <= (TIMELINE_STAGES.find(s => s.id === timelineStage)?.order || 1)
      }))
    };
  },

  // 4. Verify Request
  verifyPickup: (pickupId, adminUserId) => {
    db.run(
      "UPDATE pickup_requests SET status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [pickupId]
    );

    const pickup = PickupModel.getPickupDetails(pickupId);

    // Dispatch in-app notification to Citizen
    if (pickup && pickup.citizen_user_id) {
      NotificationModel.createNotification({
        userId: pickup.citizen_user_id,
        title: 'Pickup Request Verified',
        message: `Your waste pickup request ${pickup.request_code} has been verified by Gram Panchayat officials and queued for driver dispatch.`,
        type: 'INFO',
        notificationType: 'PICKUP_VERIFIED',
        relatedPickupId: pickup.id,
        actionUrl: `/citizen?tab=track&id=${pickup.id}`
      });
    }

    return pickup;
  },

  // 5. Assign Driver
  assignDriver: (pickupId, driverProfileId, adminUserId) => {
    const driver = db.get(
      `SELECT dp.*, u.full_name as driver_name, u.id as driver_user_id 
       FROM driver_profiles dp 
       JOIN users u ON dp.user_id = u.id 
       WHERE dp.id = ?`,
      [driverProfileId]
    );

    if (!driver) {
      throw new Error(`Driver profile #${driverProfileId} not found.`);
    }

    // Update pickup status to ASSIGNED
    db.run(
      "UPDATE pickup_requests SET status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [pickupId]
    );

    // Upsert driver assignment
    const existingAssignment = db.get(
      'SELECT id FROM driver_assignments WHERE pickup_request_id = ?',
      [pickupId]
    );

    if (existingAssignment) {
      db.run(
        `UPDATE driver_assignments 
         SET driver_id = ?, assigned_by = ?, status = 'ASSIGNED', assigned_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [driverProfileId, adminUserId, existingAssignment.id]
      );
    } else {
      db.run(
        `INSERT INTO driver_assignments (pickup_request_id, driver_id, assigned_by, sequence_order, status)
         VALUES (?, ?, ?, 1, 'ASSIGNED')`,
        [pickupId, driverProfileId, adminUserId]
      );
    }

    const updatedPickup = PickupModel.getPickupDetails(pickupId);

    // Notification to Driver
    NotificationModel.createNotification({
      userId: driver.driver_user_id,
      title: 'New Stop Assigned',
      message: `You have been assigned pickup ${updatedPickup.request_code} in ${updatedPickup.ward_number} (${updatedPickup.address}).`,
      type: 'INFO',
      notificationType: 'NEW_ASSIGNMENT',
      relatedPickupId: updatedPickup.id,
      actionUrl: `/driver?tab=assignments&id=${updatedPickup.id}`
    });

    // Notification to Citizen
    if (updatedPickup && updatedPickup.citizen_user_id) {
      NotificationModel.createNotification({
        userId: updatedPickup.citizen_user_id,
        title: 'Driver Assigned',
        message: `Driver ${driver.driver_name} (${driver.vehicle_number}) has been assigned to collect your waste (${updatedPickup.request_code}).`,
        type: 'SUCCESS',
        notificationType: 'DRIVER_ASSIGNED',
        relatedPickupId: updatedPickup.id,
        actionUrl: `/citizen?tab=track&id=${updatedPickup.id}`
      });
    }

    return updatedPickup;
  }
};

module.exports = PickupModel;
