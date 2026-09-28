/**
 * ECHO ROUTE SMART WASTE
 * Admin Management & Operations Model
 */
const db = require('../../../database/client');
const NotificationModel = require('./notification.model');

const AdminModel = {
  // 1. All Drivers with fleet details & assignment metrics
  getDrivers: () => {
    return db.query(
      `SELECT dp.*, 
              u.email, u.full_name as driver_name, u.phone as driver_phone, u.is_active as account_active,
              (SELECT COUNT(*) 
               FROM driver_assignments da 
               JOIN pickup_requests pr ON da.pickup_request_id = pr.id 
               WHERE da.driver_id = dp.id AND pr.status NOT IN ('COMPLETED', 'CANCELLED')) as active_assignments_count,
              (SELECT COUNT(*) 
               FROM driver_assignments da 
               JOIN pickup_requests pr ON da.pickup_request_id = pr.id 
               WHERE da.driver_id = dp.id AND pr.status = 'COMPLETED') as completed_assignments_count
       FROM driver_profiles dp
       JOIN users u ON dp.user_id = u.id
       ORDER BY dp.is_on_duty DESC, u.full_name ASC`
    );
  },

  // Enroll / Create New Driver Account & Vehicle Profile
  createDriver: async ({
    email,
    password,
    full_name,
    phone,
    vehicle_number,
    vehicle_type = 'Tata Ace Tipper',
    license_number,
    capacity_kg = 1000.0,
    is_on_duty = 1
  }) => {
    // 1. Check if email already exists
    const existing = db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      const err = new Error(`An account with email '${email}' already exists.`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Hash password with bcryptjs
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Insert into users table
    db.run(
      `INSERT INTO users (email, password_hash, role, full_name, phone, is_active)
       VALUES (?, ?, 'DRIVER', ?, ?, 1)`,
      [email.trim().toLowerCase(), passwordHash, full_name.trim(), phone ? phone.trim() : null]
    );
    const newUser = db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);

    // 4. Insert into driver_profiles table with Central Depot as initial coordinates
    db.run(
      `INSERT INTO driver_profiles (user_id, vehicle_number, vehicle_type, license_number, capacity_kg, is_on_duty, current_lat, current_lng)
       VALUES (?, ?, ?, ?, ?, ?, 28.5320, 77.3880)`,
      [
        newUser.id,
        vehicle_number.trim(),
        vehicle_type.trim(),
        license_number.trim(),
        Number(capacity_kg) || 1000.0,
        is_on_duty ? 1 : 0
      ]
    );
    const profile = db.get('SELECT id FROM driver_profiles WHERE user_id = ?', [newUser.id]);

    // 5. Return complete driver record
    return db.get(
      `SELECT dp.*, 
              u.email, u.full_name as driver_name, u.phone as driver_phone, u.is_active as account_active,
              0 as active_assignments_count,
              0 as completed_assignments_count
       FROM driver_profiles dp
       JOIN users u ON dp.user_id = u.id
       WHERE dp.id = ?`,
      [profile.id]
    );
  },

  // 2. Toggle Driver Duty Status (On Duty <-> Off Duty)
  toggleDriverDuty: (driverProfileId) => {
    const current = db.get('SELECT id, is_on_duty FROM driver_profiles WHERE id = ?', [driverProfileId]);
    if (!current) {
      throw new Error(`Driver profile #${driverProfileId} not found.`);
    }

    const newStatus = current.is_on_duty === 1 ? 0 : 1;
    db.run(
      'UPDATE driver_profiles SET is_on_duty = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, driverProfileId]
    );

    return db.get(
      `SELECT dp.*, u.full_name as driver_name, u.email, u.phone 
       FROM driver_profiles dp 
       JOIN users u ON dp.user_id = u.id 
       WHERE dp.id = ?`,
      [driverProfileId]
    );
  },

  // 3. Registered Citizen Directory
  getCitizens: () => {
    return db.query(
      `SELECT cp.*, 
              u.full_name as citizen_name, u.email as citizen_email, u.phone as citizen_phone, 
              u.created_at as joined_date,
              (SELECT COUNT(*) FROM pickup_requests pr WHERE pr.citizen_id = cp.id) as total_requests_count,
              (SELECT COUNT(*) FROM pickup_requests pr WHERE pr.citizen_id = cp.id AND pr.status = 'COMPLETED') as completed_requests_count,
              (SELECT COUNT(*) FROM complaints c WHERE c.citizen_id = cp.id) as complaints_count
       FROM citizen_profiles cp
       JOIN users u ON cp.user_id = u.id
       ORDER BY u.full_name ASC`
    );
  },

  // 4. All Grievances / Complaints
  getComplaints: () => {
    return db.query(
      `SELECT c.*, 
              cp.ward_number, cp.village_name, cp.user_id as citizen_user_id,
              cu.full_name as citizen_name, cu.email as citizen_email, cu.phone as citizen_phone,
              pr.request_code, pr.waste_type, pr.status as pickup_status
       FROM complaints c
       JOIN citizen_profiles cp ON c.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       LEFT JOIN pickup_requests pr ON c.pickup_request_id = pr.id
       ORDER BY CASE WHEN c.status = 'SUBMITTED' THEN 1 WHEN c.status = 'IN_REVIEW' THEN 2 ELSE 3 END, c.created_at DESC`
    );
  },

  // 5. Update / Resolve Grievance
  resolveComplaint: (complaintId, status, adminNotes, adminUserId) => {
    db.run(
      `UPDATE complaints 
       SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, adminNotes || '', complaintId]
    );

    const updated = db.get(
      `SELECT c.*, cp.user_id as citizen_user_id 
       FROM complaints c 
       JOIN citizen_profiles cp ON c.citizen_id = cp.id 
       WHERE c.id = ?`,
      [complaintId]
    );

    // Notify Citizen
    if (updated && updated.citizen_user_id) {
      NotificationModel.createNotification({
        userId: updated.citizen_user_id,
        title: `Grievance Update (Token #${complaintId})`,
        message: `Your complaint "${updated.subject}" status changed to ${status}. Notes: ${adminNotes || 'Reviewed by Gram Panchayat.'}`,
        type: status === 'RESOLVED' ? 'SUCCESS' : 'INFO',
        notificationType: 'COMPLAINT_UPDATE',
        relatedPickupId: updated.pickup_request_id || null,
        actionUrl: '/citizen?tab=complaints'
      });
    }

    return updated;
  }
};

module.exports = AdminModel;
