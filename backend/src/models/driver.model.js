/**
 * ECHO ROUTE SMART WASTE
 * Driver Model & Operations
 * Strictly scoped to authenticated driver profile
 */
const db = require('../../../database/client');
const { calculateTimelineStage, WASTE_TYPE_LABELS, TIMELINE_STAGES } = require('../config/constants');
const { ApiError } = require('../middleware/error.middleware');
const NotificationModel = require('./notification.model');

const DriverModel = {
  // 1. Find profile by User ID
  findByUserId: (userId) => {
    return db.get(
      `SELECT dp.*, u.email, u.full_name as driver_name, u.phone as driver_phone 
       FROM driver_profiles dp 
       JOIN users u ON dp.user_id = u.id 
       WHERE u.id = ?`,
      [userId]
    );
  },

  // 2. Dynamic Dashboard Statistics (No hardcoded metrics)
  getDashboardStats: (driverProfileId) => {
    // Today's Assignments count
    const todaysAssignments = db.get(
      `SELECT COUNT(*) as count 
       FROM driver_assignments da 
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id 
       WHERE da.driver_id = ? AND (date(pr.scheduled_date) = date('now', 'localtime') OR pr.scheduled_date IS NULL)`,
      [driverProfileId]
    )?.count || 0;

    // Pending Pickups (Assigned or Accepted awaiting dispatch/start)
    const pendingPickups = db.get(
      `SELECT COUNT(*) as count 
       FROM driver_assignments da 
       WHERE da.driver_id = ? AND da.status IN ('ASSIGNED', 'ACCEPTED')`,
      [driverProfileId]
    )?.count || 0;

    // Active Pickups (En route, Arrived, Picked Up)
    const activePickups = db.get(
      `SELECT COUNT(*) as count 
       FROM driver_assignments da 
       WHERE da.driver_id = ? AND da.status IN ('EN_ROUTE', 'ARRIVED', 'PICKED_UP')`,
      [driverProfileId]
    )?.count || 0;

    // Completed Pickups
    const completedPickups = db.get(
      `SELECT COUNT(*) as count 
       FROM driver_assignments da 
       WHERE da.driver_id = ? AND da.status = 'COMPLETED'`,
      [driverProfileId]
    )?.count || 0;

    // Current active pickup if any
    const currentActive = db.get(
      `SELECT da.id as assignment_id, da.status as assignment_status, da.sequence_order,
              pr.id as pickup_id, pr.request_code, pr.waste_type, pr.estimated_volume_bags,
              pr.address, pr.ward_number, pr.scheduled_date, pr.preferred_time,
              cp.village_name, cp.landmark,
              cu.full_name as citizen_name, cu.phone as citizen_phone
       FROM driver_assignments da
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       WHERE da.driver_id = ? AND da.status IN ('ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'PICKED_UP')
       ORDER BY CASE 
         WHEN da.status = 'PICKED_UP' THEN 1 
         WHEN da.status = 'ARRIVED' THEN 2 
         WHEN da.status = 'EN_ROUTE' THEN 3 
         ELSE 4 
       END ASC, da.sequence_order ASC
       LIMIT 1`,
      [driverProfileId]
    );

    return {
      todaysAssignments,
      pendingPickups,
      activePickups,
      completedPickups,
      currentActivePickup: currentActive || null
    };
  },

  // 3. Filterable Pickups List (Strictly scoped to driverProfileId)
  getDriverPickups: (driverProfileId, filter = 'all') => {
    let whereClause = 'WHERE da.driver_id = ?';
    const params = [driverProfileId];

    if (filter === 'today') {
      whereClause += " AND (date(pr.scheduled_date) = date('now', 'localtime') OR pr.scheduled_date IS NULL)";
    } else if (filter === 'pending') {
      whereClause += " AND da.status IN ('ASSIGNED', 'ACCEPTED')";
    } else if (filter === 'active') {
      whereClause += " AND da.status IN ('EN_ROUTE', 'ARRIVED', 'PICKED_UP')";
    } else if (filter === 'completed') {
      whereClause += " AND da.status = 'COMPLETED'";
    }

    const rows = db.query(
      `SELECT da.id as assignment_id, da.pickup_request_id, da.status as assignment_status,
              da.sequence_order, da.assigned_at, da.accepted_at, da.started_at, 
              da.arrived_at, da.picked_up_at, da.completed_at, da.driver_notes,
              pr.id as pickup_id, pr.request_code, pr.waste_type, pr.description, 
              pr.estimated_volume_bags, pr.status as pickup_status, pr.priority, 
              pr.ward_number, pr.address, pr.gps_lat, pr.gps_lng, 
              pr.scheduled_date, pr.preferred_time,
              cp.village_name, cp.house_number, cp.landmark,
              cu.full_name as citizen_name, cu.phone as citizen_phone,
              dp.vehicle_number, dp.vehicle_type, dp.capacity_kg,
              (SELECT photo_url FROM pickup_photos pp WHERE pp.pickup_request_id = pr.id LIMIT 1) as citizen_photo_url,
              (SELECT proof_photo_url FROM completion_proofs cp_proof WHERE cp_proof.pickup_request_id = pr.id LIMIT 1) as proof_photo_url
       FROM driver_assignments da
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       JOIN driver_profiles dp ON da.driver_id = dp.id
       ${whereClause}
       ORDER BY CASE 
         WHEN da.status = 'EN_ROUTE' THEN 1 
         WHEN da.status = 'ARRIVED' THEN 2 
         WHEN da.status = 'PICKED_UP' THEN 3 
         WHEN da.status = 'ACCEPTED' THEN 4 
         WHEN da.status = 'ASSIGNED' THEN 5 
         ELSE 6 
       END ASC, da.sequence_order ASC, pr.id DESC`,
      params
    );

    return rows.map((row) => ({
      ...row,
      waste_type_label: WASTE_TYPE_LABELS[row.waste_type] || row.waste_type,
      timelineStage: calculateTimelineStage(row.pickup_status, row.assignment_status)
    }));
  },

  // 4. Single Pickup Details with Ownership Verification
  getPickupDetails: (driverProfileId, pickupId) => {
    const raw = db.get(
      `SELECT da.id as assignment_id, da.pickup_request_id, da.status as assignment_status,
              da.sequence_order, da.assigned_at, da.accepted_at, da.started_at, 
              da.arrived_at, da.picked_up_at, da.completed_at, da.driver_notes,
              pr.id as pickup_id, pr.request_code, pr.waste_type, pr.description, 
              pr.estimated_volume_bags, pr.status as pickup_status, pr.priority, 
              pr.ward_number, pr.address, pr.gps_lat, pr.gps_lng, 
              pr.scheduled_date, pr.preferred_time,
              cp.village_name, cp.house_number, cp.landmark, cp.user_id as citizen_user_id,
              cu.full_name as citizen_name, cu.phone as citizen_phone, cu.email as citizen_email,
              dp.id as driver_profile_id, dp.vehicle_number, dp.vehicle_type, dp.capacity_kg,
              cp_proof.id as proof_id, cp_proof.proof_photo_url, cp_proof.collected_weight_kg,
              cp_proof.driver_notes as completion_driver_notes, cp_proof.completed_at as proof_completed_at
       FROM driver_assignments da
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       JOIN driver_profiles dp ON da.driver_id = dp.id
       LEFT JOIN completion_proofs cp_proof ON cp_proof.pickup_request_id = pr.id
       WHERE (pr.id = ? OR pr.request_code = ?) AND da.driver_id = ?`,
      [pickupId, pickupId, driverProfileId]
    );

    if (!raw) return null;

    // Get citizen waste photos
    const citizenPhotos = db.query(
      'SELECT id, photo_url, photo_type, uploaded_at FROM pickup_photos WHERE pickup_request_id = ?',
      [raw.pickup_id]
    );

    const timelineStage = calculateTimelineStage(raw.pickup_status, raw.assignment_status);

    return {
      ...raw,
      citizenPhotos,
      citizen_photo_url: citizenPhotos[0]?.photo_url || null,
      waste_type_label: WASTE_TYPE_LABELS[raw.waste_type] || raw.waste_type,
      timelineStage,
      timelineStages: TIMELINE_STAGES.map(stage => ({
        ...stage,
        isCurrent: stage.id === timelineStage,
        isCompleted: stage.order <= (TIMELINE_STAGES.find(s => s.id === timelineStage)?.order || 1)
      }))
    };
  },

  // 5. Accept Assignment
  acceptAssignment: (driverProfileId, pickupId, driverName = 'Driver') => {
    const assignment = db.get(
      `SELECT da.*, pr.request_code, cp.user_id as citizen_user_id 
       FROM driver_assignments da 
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id 
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id 
       WHERE (pr.id = ? OR pr.request_code = ?) AND da.driver_id = ?`,
      [pickupId, pickupId, driverProfileId]
    );

    if (!assignment) {
      throw ApiError.notFound('Assigned pickup request not found for this driver.');
    }

    if (assignment.status !== 'ASSIGNED') {
      throw ApiError.badRequest(
        `Cannot accept assignment: current status is already '${assignment.status}'.`
      );
    }

    // Update assignment status
    db.run(
      "UPDATE driver_assignments SET status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [assignment.id]
    );

    // Notify citizen
    if (assignment.citizen_user_id) {
      NotificationModel.createNotification({
        userId: assignment.citizen_user_id,
        title: 'Driver Accepted Assignment',
        message: 'Driver has accepted your pickup assignment.',
        type: 'INFO',
        notificationType: 'DRIVER_ACCEPTED',
        relatedPickupId: assignment.pickup_request_id,
        actionUrl: `/citizen?tab=track&id=${assignment.pickup_request_id}`
      });
    }

    // Notify admins
    const admins = db.query("SELECT id FROM users WHERE role = 'ADMIN'");
    for (const admin of admins) {
      NotificationModel.createNotification({
        userId: admin.id,
        title: 'Driver Accepted Pickup',
        message: `Driver ${driverName} accepted pickup request ${assignment.request_code}.`,
        type: 'INFO',
        notificationType: 'DRIVER_STATUS_UPDATE',
        relatedPickupId: assignment.pickup_request_id,
        actionUrl: `/admin?tab=pickups&id=${assignment.pickup_request_id}`
      });
    }

    return DriverModel.getPickupDetails(driverProfileId, pickupId);
  },

  // 6. Step-by-Step Workflow Transitions (START, ARRIVED, PICKED_UP)
  updateWorkflowStep: (driverProfileId, pickupId, action, driverName = 'Driver') => {
    const assignment = db.get(
      `SELECT da.*, pr.request_code, cp.user_id as citizen_user_id 
       FROM driver_assignments da 
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id 
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id 
       WHERE (pr.id = ? OR pr.request_code = ?) AND da.driver_id = ?`,
      [pickupId, pickupId, driverProfileId]
    );

    if (!assignment) {
      throw ApiError.notFound('Assigned pickup request not found for this driver.');
    }

    const normAction = action.toUpperCase();

    if (normAction === 'START' || normAction === 'ON_THE_WAY' || normAction === 'DRIVER_ON_THE_WAY') {
      // Validate transition
      if (!['ASSIGNED', 'ACCEPTED'].includes(assignment.status)) {
        throw ApiError.badRequest(
          `Cannot mark 'On The Way': Current assignment status is '${assignment.status}'. Expected 'ASSIGNED' or 'ACCEPTED'.`
        );
      }

      db.run(
        "UPDATE driver_assignments SET status = 'EN_ROUTE', started_at = CURRENT_TIMESTAMP WHERE id = ?",
        [assignment.id]
      );
      db.run(
        "UPDATE pickup_requests SET status = 'IN_TRANSIT', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [assignment.pickup_request_id]
      );

      // In-app notification for citizen
      if (assignment.citizen_user_id) {
        NotificationModel.createNotification({
          userId: assignment.citizen_user_id,
          title: 'Driver On The Way',
          message: 'Driver is on the way for your waste pickup.',
          type: 'INFO',
          notificationType: 'DRIVER_EN_ROUTE',
          relatedPickupId: assignment.pickup_request_id,
          actionUrl: `/citizen?tab=track&id=${assignment.pickup_request_id}`
        });
      }

      // In-app notification for admin
      const admins = db.query("SELECT id FROM users WHERE role = 'ADMIN'");
      for (const admin of admins) {
        NotificationModel.createNotification({
          userId: admin.id,
          title: 'Pickup In Transit',
          message: `Driver ${driverName} is on the way for pickup ${assignment.request_code}.`,
          type: 'INFO',
          notificationType: 'DRIVER_STATUS_UPDATE',
          relatedPickupId: assignment.pickup_request_id,
          actionUrl: `/admin?tab=pickups&id=${assignment.pickup_request_id}`
        });
      }

    } else if (normAction === 'ARRIVED') {
      // Validate transition
      if (assignment.status !== 'EN_ROUTE') {
        throw ApiError.badRequest(
          `Cannot mark 'Arrived': Current assignment status is '${assignment.status}'. Driver must be 'On The Way' first.`
        );
      }

      db.run(
        "UPDATE driver_assignments SET status = 'ARRIVED', arrived_at = CURRENT_TIMESTAMP WHERE id = ?",
        [assignment.id]
      );

      // Notification for citizen
      if (assignment.citizen_user_id) {
        NotificationModel.createNotification({
          userId: assignment.citizen_user_id,
          title: 'Driver Arrived',
          message: 'Driver has arrived for your pickup.',
          type: 'INFO',
          notificationType: 'DRIVER_ARRIVED',
          relatedPickupId: assignment.pickup_request_id,
          actionUrl: `/citizen?tab=track&id=${assignment.pickup_request_id}`
        });
      }

      // Notification for admin
      const admins = db.query("SELECT id FROM users WHERE role = 'ADMIN'");
      for (const admin of admins) {
        NotificationModel.createNotification({
          userId: admin.id,
          title: 'Driver Arrived at Stop',
          message: `Driver ${driverName} arrived at collection point for pickup ${assignment.request_code}.`,
          type: 'INFO',
          notificationType: 'DRIVER_STATUS_UPDATE',
          relatedPickupId: assignment.pickup_request_id,
          actionUrl: `/admin?tab=pickups&id=${assignment.pickup_request_id}`
        });
      }

    } else if (normAction === 'PICKED_UP') {
      // Validate transition
      if (assignment.status !== 'ARRIVED') {
        throw ApiError.badRequest(
          `Cannot mark 'Picked Up': Current assignment status is '${assignment.status}'. Driver must mark 'Arrived' first.`
        );
      }

      db.run(
        "UPDATE driver_assignments SET status = 'PICKED_UP', picked_up_at = CURRENT_TIMESTAMP WHERE id = ?",
        [assignment.id]
      );
      db.run(
        "UPDATE pickup_requests SET status = 'COLLECTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [assignment.pickup_request_id]
      );

      // Notification for citizen
      if (assignment.citizen_user_id) {
        NotificationModel.createNotification({
          userId: assignment.citizen_user_id,
          title: 'Waste Picked Up',
          message: 'Waste collected by driver. Final photo proof verification in progress.',
          type: 'INFO',
          notificationType: 'PICKUP_COLLECTED',
          relatedPickupId: assignment.pickup_request_id,
          actionUrl: `/citizen?tab=track&id=${assignment.pickup_request_id}`
        });
      }

      // Notification for admin
      const admins = db.query("SELECT id FROM users WHERE role = 'ADMIN'");
      for (const admin of admins) {
        NotificationModel.createNotification({
          userId: admin.id,
          title: 'Waste Collected',
          message: `Driver ${driverName} loaded waste for request ${assignment.request_code}. Proof photo pending.`,
          type: 'INFO',
          notificationType: 'DRIVER_STATUS_UPDATE',
          relatedPickupId: assignment.pickup_request_id,
          actionUrl: `/admin?tab=pickups&id=${assignment.pickup_request_id}`
        });
      }

    } else {
      throw ApiError.badRequest(`Invalid action: '${action}'. Valid actions: START, ARRIVED, PICKED_UP.`);
    }

    return DriverModel.getPickupDetails(driverProfileId, pickupId);
  },

  // 7. Complete Pickup with Mandatory Completion Proof Photo
  completePickup: (driverProfileId, pickupId, { proofPhotoUrl, driverNotes, collectedWeightKg }, driverName = 'Driver') => {
    const assignment = db.get(
      `SELECT da.*, pr.request_code, cp.user_id as citizen_user_id 
       FROM driver_assignments da 
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id 
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id 
       WHERE (pr.id = ? OR pr.request_code = ?) AND da.driver_id = ?`,
      [pickupId, pickupId, driverProfileId]
    );

    if (!assignment) {
      throw ApiError.notFound('Assigned pickup request not found for this driver.');
    }

    // Must be in active state (PICKED_UP, ARRIVED, or EN_ROUTE)
    if (assignment.status === 'COMPLETED') {
      throw ApiError.badRequest('This pickup request has already been completed.');
    }

    if (!['PICKED_UP', 'ARRIVED', 'EN_ROUTE'].includes(assignment.status)) {
      throw ApiError.badRequest(
        `Cannot complete pickup: Current status is '${assignment.status}'. Waste must be collected first.`
      );
    }

    // MANDATORY PROOF VALIDATION
    if (!proofPhotoUrl || typeof proofPhotoUrl !== 'string' || !proofPhotoUrl.trim()) {
      throw ApiError.badRequest(
        'Completion Proof Required: Driver must upload a valid photographic completion proof before closing the pickup.'
      );
    }

    const weight = collectedWeightKg ? parseFloat(collectedWeightKg) : null;
    const notes = driverNotes ? driverNotes.trim() : null;

    // 1. Insert or update completion proof record
    const existingProof = db.get(
      'SELECT id FROM completion_proofs WHERE pickup_request_id = ?',
      [assignment.pickup_request_id]
    );

    if (existingProof) {
      db.run(
        `UPDATE completion_proofs 
         SET proof_photo_url = ?, collected_weight_kg = ?, driver_notes = ?, completed_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [proofPhotoUrl, weight, notes, existingProof.id]
      );
    } else {
      db.run(
        `INSERT INTO completion_proofs (pickup_request_id, driver_id, proof_photo_url, collected_weight_kg, driver_notes, verification_status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [assignment.pickup_request_id, driverProfileId, proofPhotoUrl, weight, notes]
      );
    }

    // 2. Update assignment status to COMPLETED
    db.run(
      `UPDATE driver_assignments 
       SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, driver_notes = ? 
       WHERE id = ?`,
      [notes, assignment.id]
    );

    // 3. Update pickup request status to COMPLETED
    db.run(
      "UPDATE pickup_requests SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [assignment.pickup_request_id]
    );

    // 4. Create citizen notification
    if (assignment.citizen_user_id) {
      NotificationModel.createNotification({
        userId: assignment.citizen_user_id,
        title: 'Waste Pickup Completed',
        message: 'Your waste pickup has been completed.',
        type: 'SUCCESS',
        notificationType: 'PICKUP_COMPLETED',
        relatedPickupId: assignment.pickup_request_id,
        actionUrl: `/citizen?tab=track&id=${assignment.pickup_request_id}`
      });
    }

    // 5. Create admin notification
    const admins = db.query("SELECT id FROM users WHERE role = 'ADMIN'");
    for (const admin of admins) {
      NotificationModel.createNotification({
        userId: admin.id,
        title: 'Pickup Completed',
        message: `Pickup completed for request ${assignment.request_code} by driver ${driverName}. Photographic proof logged.`,
        type: 'SUCCESS',
        notificationType: 'PICKUP_COMPLETED',
        relatedPickupId: assignment.pickup_request_id,
        actionUrl: `/admin?tab=pickups&id=${assignment.pickup_request_id}`
      });
    }

    return DriverModel.getPickupDetails(driverProfileId, pickupId);
  },

  // 8. Today's Route Sequenced Stops
  getTodaysRoute: (driverProfileId) => {
    const stops = db.query(
      `SELECT da.id as assignment_id, da.sequence_order, da.status as assignment_status,
              da.assigned_at, da.started_at, da.arrived_at, da.picked_up_at, da.completed_at,
              pr.id as pickup_id, pr.request_code, pr.waste_type, pr.estimated_volume_bags,
              pr.priority, pr.ward_number, pr.address, pr.gps_lat, pr.gps_lng,
              pr.scheduled_date, pr.preferred_time, pr.status as pickup_status,
              cp.village_name, cp.house_number, cp.landmark,
              cu.full_name as citizen_name, cu.phone as citizen_phone,
              (SELECT photo_url FROM pickup_photos pp WHERE pp.pickup_request_id = pr.id LIMIT 1) as citizen_photo_url
       FROM driver_assignments da
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       WHERE da.driver_id = ?
       ORDER BY CASE 
         WHEN da.status = 'EN_ROUTE' THEN 1 
         WHEN da.status = 'ARRIVED' THEN 2 
         WHEN da.status = 'PICKED_UP' THEN 3 
         WHEN da.status = 'ACCEPTED' THEN 4 
         WHEN da.status = 'ASSIGNED' THEN 5 
         ELSE 6 
       END ASC, da.sequence_order ASC, pr.id ASC`,
      [driverProfileId]
    );

    return stops.map((s, idx) => ({
      ...s,
      stop_number: idx + 1,
      waste_type_label: WASTE_TYPE_LABELS[s.waste_type] || s.waste_type,
      timelineStage: calculateTimelineStage(s.pickup_status, s.assignment_status)
    }));
  },

  // 9. Completed Pickups Roster
  getCompletedPickups: (driverProfileId) => {
    const completed = db.query(
      `SELECT da.id as assignment_id, da.completed_at, da.driver_notes,
              pr.id as pickup_id, pr.request_code, pr.waste_type, pr.estimated_volume_bags,
              pr.ward_number, pr.address, pr.scheduled_date,
              cp.village_name,
              cu.full_name as citizen_name, cu.phone as citizen_phone,
              cp_proof.proof_photo_url, cp_proof.collected_weight_kg,
              cp_proof.driver_notes as proof_notes, cp_proof.verification_status
       FROM driver_assignments da
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       LEFT JOIN completion_proofs cp_proof ON cp_proof.pickup_request_id = pr.id
       WHERE da.driver_id = ? AND da.status = 'COMPLETED'
       ORDER BY da.completed_at DESC, da.id DESC`,
      [driverProfileId]
    );

    return completed.map(c => ({
      ...c,
      waste_type_label: WASTE_TYPE_LABELS[c.waste_type] || c.waste_type
    }));
  },

  // 10. Toggle Duty Status (On Duty / Off Duty)
  toggleDuty: (driverProfileId) => {
    const current = db.get('SELECT id, is_on_duty FROM driver_profiles WHERE id = ?', [driverProfileId]);
    if (!current) throw ApiError.notFound('Driver profile not found.');

    const newDuty = current.is_on_duty === 1 ? 0 : 1;
    db.run(
      'UPDATE driver_profiles SET is_on_duty = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newDuty, driverProfileId]
    );

    return db.get(
      `SELECT dp.*, u.full_name as driver_name, u.email, u.phone as driver_phone 
       FROM driver_profiles dp 
       JOIN users u ON dp.user_id = u.id 
       WHERE dp.id = ?`,
      [driverProfileId]
    );
  }
};

module.exports = DriverModel;
