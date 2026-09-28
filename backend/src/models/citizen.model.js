/**
 * ECHO ROUTE SMART WASTE
 * Citizen Profile & Operations Model
 */
const db = require('../../../database/client');
const { calculateTimelineStage, WASTE_TYPE_LABELS, TIMELINE_STAGES } = require('../config/constants');
const NotificationModel = require('./notification.model');

const CitizenModel = {
  findByUserId: (userId) => {
    return db.get(
      `SELECT cp.*, u.email, u.full_name, u.phone 
       FROM citizen_profiles cp 
       JOIN users u ON cp.user_id = u.id 
       WHERE u.id = ?`,
      [userId]
    );
  },

  getDashboardStats: (citizenProfileId) => {
    const totalRequests = db.get(
      'SELECT COUNT(*) as count FROM pickup_requests WHERE citizen_id = ?',
      [citizenProfileId]
    ).count;

    const pendingRequests = db.get(
      "SELECT COUNT(*) as count FROM pickup_requests WHERE citizen_id = ? AND status = 'PENDING'",
      [citizenProfileId]
    ).count;

    const scheduledPickups = db.get(
      "SELECT COUNT(*) as count FROM pickup_requests WHERE citizen_id = ? AND status IN ('VERIFIED', 'ASSIGNED')",
      [citizenProfileId]
    ).count;

    const completedPickups = db.get(
      "SELECT COUNT(*) as count FROM pickup_requests WHERE citizen_id = ? AND status = 'COMPLETED'",
      [citizenProfileId]
    ).count;

    // Active Pickup: most recent non-completed request
    const activeRaw = db.get(
      `SELECT pr.*, 
              da.status as assignment_status, da.sequence_order,
              dp.vehicle_number, dp.vehicle_type, dp.capacity_kg,
              du.full_name as driver_name, du.phone as driver_phone,
              (SELECT photo_url FROM pickup_photos pp WHERE pp.pickup_request_id = pr.id LIMIT 1) as photo_url
       FROM pickup_requests pr
       LEFT JOIN driver_assignments da ON da.pickup_request_id = pr.id
       LEFT JOIN driver_profiles dp ON da.driver_id = dp.id
       LEFT JOIN users du ON dp.user_id = du.id
       WHERE pr.citizen_id = ? AND pr.status != 'COMPLETED' AND pr.status != 'CANCELLED'
       ORDER BY pr.created_at DESC LIMIT 1`,
      [citizenProfileId]
    );

    let activePickup = null;
    if (activeRaw) {
      const timelineStage = calculateTimelineStage(activeRaw.status, activeRaw.assignment_status);
      activePickup = {
        ...activeRaw,
        waste_type_label: WASTE_TYPE_LABELS[activeRaw.waste_type] || activeRaw.waste_type,
        timelineStage,
        timelineInfo: TIMELINE_STAGES.find(s => s.id === timelineStage)
      };
    }

    return {
      totalRequests,
      pendingRequests,
      scheduledPickups,
      completedPickups,
      activePickup
    };
  },

  getMyPickups: (citizenProfileId, filter = 'all') => {
    let filterSql = '';
    const params = [citizenProfileId];

    if (filter === 'requested') {
      filterSql = " AND pr.status = 'PENDING'";
    } else if (filter === 'verified') {
      filterSql = " AND pr.status = 'VERIFIED'";
    } else if (filter === 'assigned') {
      filterSql = " AND pr.status = 'ASSIGNED'";
    } else if (filter === 'active') {
      filterSql = " AND pr.status IN ('IN_TRANSIT', 'COLLECTED')";
    } else if (filter === 'completed') {
      filterSql = " AND pr.status = 'COMPLETED'";
    }

    const rows = db.query(
      `SELECT pr.*, 
              da.status as assignment_status,
              dp.vehicle_number, dp.vehicle_type,
              du.full_name as driver_name, du.phone as driver_phone,
              (SELECT photo_url FROM pickup_photos pp WHERE pp.pickup_request_id = pr.id LIMIT 1) as photo_url,
              (SELECT COUNT(*) FROM pickup_photos pp WHERE pp.pickup_request_id = pr.id) as photo_count,
              (SELECT cp.proof_photo_url FROM completion_proofs cp WHERE cp.pickup_request_id = pr.id) as completion_proof_url
       FROM pickup_requests pr
       LEFT JOIN driver_assignments da ON da.pickup_request_id = pr.id
       LEFT JOIN driver_profiles dp ON da.driver_id = dp.id
       LEFT JOIN users du ON dp.user_id = du.id
       WHERE pr.citizen_id = ? ${filterSql}
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

  getPickupById: (pickupId) => {
    const raw = db.get(
      `SELECT pr.*, 
              da.status as assignment_status, da.assigned_at, da.sequence_order,
              dp.vehicle_number, dp.vehicle_type, dp.capacity_kg, dp.license_number,
              du.full_name as driver_name, du.phone as driver_phone,
              cp.proof_photo_url, cp.collected_weight_kg, cp.driver_notes, cp.completed_at
       FROM pickup_requests pr
       LEFT JOIN driver_assignments da ON da.pickup_request_id = pr.id
       LEFT JOIN driver_profiles dp ON da.driver_id = dp.id
       LEFT JOIN users du ON dp.user_id = du.id
       LEFT JOIN completion_proofs cp ON cp.pickup_request_id = pr.id
       WHERE pr.id = ? OR pr.request_code = ?`,
      [pickupId, pickupId]
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

  createPickup: (citizenProfileId, data) => {
    // Generate human-friendly sequential or random request code
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const requestCode = `REQ-${dateStr}-${randomSuffix}`;

    db.run(
      `INSERT INTO pickup_requests 
       (citizen_id, request_code, waste_type, description, estimated_volume_bags, 
        status, priority, ward_number, address, preferred_time, scheduled_date, gps_lat, gps_lng)
       VALUES (?, ?, ?, ?, ?, 'PENDING', 'NORMAL', ?, ?, ?, ?, ?, ?)`,
      [
        citizenProfileId,
        requestCode,
        data.waste_type,
        data.description || '',
        data.estimated_volume_bags || 1,
        data.ward_number || 'Ward 4',
        data.address,
        data.preferred_time || 'Morning (08:00 - 11:00 AM)',
        data.scheduled_date || new Date().toISOString().slice(0, 10),
        data.gps_lat || 28.5355,
        data.gps_lng || 77.3910
      ]
    );

    const created = db.get('SELECT * FROM pickup_requests WHERE request_code = ?', [requestCode]);

    // Save photo relationship if photoUrl exists
    if (data.photo_url) {
      db.run(
        `INSERT INTO pickup_photos (pickup_request_id, photo_url, photo_type)
         VALUES (?, ?, 'CITIZEN_INITIAL')`,
        [created.id, data.photo_url]
      );
    }

    // In-app notification for Citizen
    const citizenProfile = db.get('SELECT user_id FROM citizen_profiles WHERE id = ?', [citizenProfileId]);
    if (citizenProfile) {
      NotificationModel.createNotification({
        userId: citizenProfile.user_id,
        title: 'Pickup Request Registered',
        message: `Your waste pickup request ${requestCode} has been submitted to Gram Panchayat officials.`,
        type: 'SUCCESS',
        notificationType: 'PICKUP_SUBMITTED',
        relatedPickupId: created.id,
        actionUrl: `/citizen?tab=track&id=${created.id}`
      });
    }

    // In-app notification for Admins
    const admins = db.query("SELECT id FROM users WHERE role = 'ADMIN'");
    for (const admin of admins) {
      NotificationModel.createNotification({
        userId: admin.id,
        title: 'New Citizen Pickup Request',
        message: `New pickup request ${requestCode} (${data.waste_type}) submitted in Ward ${data.ward_number || '4'}.`,
        type: 'INFO',
        notificationType: 'NEW_PICKUP_REQUEST',
        relatedPickupId: created.id,
        actionUrl: `/admin?tab=pickups&id=${created.id}`
      });
    }

    return CitizenModel.getPickupById(created.id);
  },

  getComplaints: (citizenProfileId) => {
    return db.query(
      `SELECT c.*, pr.request_code, pr.waste_type 
       FROM complaints c
       LEFT JOIN pickup_requests pr ON c.pickup_request_id = pr.id
       WHERE c.citizen_id = ?
       ORDER BY c.created_at DESC`,
      [citizenProfileId]
    );
  },

  createComplaint: (citizenProfileId, data) => {
    db.run(
      `INSERT INTO complaints (citizen_id, pickup_request_id, complaint_type, subject, description, status)
       VALUES (?, ?, ?, ?, ?, 'SUBMITTED')`,
      [
        citizenProfileId,
        data.pickup_request_id || null,
        data.complaint_type || 'General Service Grievance',
        data.subject,
        data.description
      ]
    );

    const complaint = db.get(
      'SELECT * FROM complaints WHERE citizen_id = ? ORDER BY created_at DESC LIMIT 1',
      [citizenProfileId]
    );

    // Notify citizen
    const citizenProfile = db.get('SELECT user_id FROM citizen_profiles WHERE id = ?', [citizenProfileId]);
    if (citizenProfile) {
      NotificationModel.createNotification({
        userId: citizenProfile.user_id,
        title: 'Grievance Acknowledged',
        message: `Your complaint "${data.subject}" has been registered (Token #${complaint.id}).`,
        type: 'INFO',
        notificationType: 'COMPLAINT_UPDATE',
        relatedPickupId: data.pickup_request_id || null,
        actionUrl: '/citizen?tab=complaints'
      });
    }

    // Notify Admins
    const admins = db.query("SELECT id FROM users WHERE role = 'ADMIN'");
    for (const admin of admins) {
      NotificationModel.createNotification({
        userId: admin.id,
        title: 'New Citizen Grievance',
        message: `New complaint "${data.subject}" registered by resident (Token #${complaint.id}).`,
        type: 'WARNING',
        notificationType: 'COMPLAINT_RECEIVED',
        relatedPickupId: data.pickup_request_id || null,
        actionUrl: '/admin?tab=complaints'
      });
    }

    return complaint;
  },

  updateProfile: (userId, data) => {
    if (data.phone) {
      db.run('UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [data.phone, userId]);
    }

    db.run(
      `UPDATE citizen_profiles 
       SET house_number = COALESCE(?, house_number),
           landmark = COALESCE(?, landmark),
           village_name = COALESCE(?, village_name),
           ward_number = COALESCE(?, ward_number),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [data.house_number || null, data.landmark || null, data.village_name || null, data.ward_number || null, userId]
    );

    return CitizenModel.findByUserId(userId);
  },

  getNotifications: (userId) => {
    return NotificationModel.getUserNotifications(userId, { limit: 50 });
  },

  markNotificationRead: (userId, notificationId) => {
    return NotificationModel.markAsRead(notificationId, userId);
  }
};

module.exports = CitizenModel;
