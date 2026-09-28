/**
 * ECHO ROUTE SMART WASTE
 * Database Seeder
 * Populates realistic Gram Panchayat demo records with hashed passwords
 */
const bcrypt = require('bcryptjs');
const db = require('./client');

async function seed() {
  console.log('[ECHO ROUTE DB] Starting demo data seeding...');

  // Generate safe password hashes
  const salt = await bcrypt.genSalt(10);
  const citizenPasswordHash = await bcrypt.hash('citizen123', salt);
  const driverPasswordHash = await bcrypt.hash('driver123', salt);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);

  // Clear existing demo records to ensure idempotency
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM complaints;
    DELETE FROM completion_proofs;
    DELETE FROM driver_assignments;
    DELETE FROM pickup_photos;
    DELETE FROM pickup_requests;
    DELETE FROM routes;
    DELETE FROM driver_profiles;
    DELETE FROM citizen_profiles;
    DELETE FROM users;
  `);

  // 1. Insert Users
  const insertUser = (email, hash, role, name, phone) => {
    db.run(
      'INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hash, role, name, phone]
    );
    return db.get('SELECT id FROM users WHERE email = ?', [email]).id;
  };

  const adminUserId = insertUser(
    'admin@echoroute.gov.in',
    adminPasswordHash,
    'ADMIN',
    'Officer Anil Sharma (PDO)',
    '+91-98765-00001'
  );

  const citizenUserId = insertUser(
    'citizen@echoroute.gov.in',
    citizenPasswordHash,
    'CITIZEN',
    'Ramesh Patel',
    '+91-98765-00002'
  );

  const driverUserId = insertUser(
    'driver@echoroute.gov.in',
    driverPasswordHash,
    'DRIVER',
    'Suresh Kumar',
    '+91-98765-00003'
  );

  // 2. Insert Citizen Profile
  db.run(
    `INSERT INTO citizen_profiles (user_id, ward_number, village_name, house_number, landmark, gps_lat, gps_lng)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [citizenUserId, 'Ward 4', 'Sundarpur Gram Panchayat', 'House No. 42', 'Near Shiv Mandir Chowk', 28.5355, 77.3910]
  );
  const citizenProfileId = db.get('SELECT id FROM citizen_profiles WHERE user_id = ?', [citizenUserId]).id;

  // 3. Insert Driver Profile
  db.run(
    `INSERT INTO driver_profiles (user_id, vehicle_number, vehicle_type, license_number, capacity_kg, is_on_duty, current_lat, current_lng)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [driverUserId, 'GP-04-E-1024', 'Tata Ace Tipper', 'DL-1420110098', 1200.0, 1, 28.5340, 77.3895]
  );
  const driverProfileId = db.get('SELECT id FROM driver_profiles WHERE user_id = ?', [driverUserId]).id;

  // 4. Insert Demo Pickup Requests
  db.run(
    `INSERT INTO pickup_requests 
     (citizen_id, waste_type, description, estimated_volume_bags, status, priority, ward_number, address, gps_lat, gps_lng, scheduled_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE('now'))`,
    [
      citizenProfileId,
      'HOUSEHOLD',
      'Segregated domestic wet and dry waste bags',
      2,
      'VERIFIED',
      'NORMAL',
      'Ward 4',
      'House No. 42, Near Shiv Mandir Chowk',
      28.5355,
      77.3910
    ]
  );
  const pickupId1 = db.get('SELECT id FROM pickup_requests WHERE citizen_id = ?', [citizenProfileId]).id;

  // 5. Insert Demo Driver Assignment
  db.run(
    `INSERT INTO driver_assignments (pickup_request_id, driver_id, assigned_by, sequence_order, status)
     VALUES (?, ?, ?, ?, ?)`,
    [pickupId1, driverProfileId, adminUserId, 1, 'ASSIGNED']
  );

  // 6. Insert Demo Route for Driver
  db.run(
    `INSERT INTO routes (driver_id, route_name, status, total_stops, total_distance_km, optimized_waypoints_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      driverProfileId,
      'Morning Route - Ward 3 & 4 Cluster',
      'ACTIVE',
      4,
      7.8,
      JSON.stringify([
        { stop: 1, name: 'Panchayat Waste Yard Depot', lat: 28.5300, lng: 77.3800 },
        { stop: 2, name: 'House 42 Mandir Chowk', lat: 28.5355, lng: 77.3910, pickup_id: pickupId1 },
        { stop: 3, name: 'Primary Health Centre', lat: 28.5380, lng: 77.3940 },
        { stop: 4, name: 'Gram Sabha Composting Center', lat: 28.5420, lng: 77.4000 }
      ])
    ]
  );

  // 7. Insert Welcome Notifications
  db.run(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, ?, ?, ?)`,
    [citizenUserId, 'Welcome to Echo Route', 'Your Gram Panchayat smart waste management account is active.', 'SUCCESS']
  );
  db.run(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, ?, ?, ?)`,
    [driverUserId, 'Duty Assigned', 'You are assigned to Ward 3 & 4 Cluster today with vehicle GP-04-E-1024.', 'INFO']
  );
  db.run(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, ?, ?, ?)`,
    [adminUserId, 'Panchayat Portal Initialized', 'Command center is operational with 1 active driver and 1 pending verified pickup.', 'INFO']
  );

  console.log('[ECHO ROUTE DB] Demo data seeded successfully:');
  console.log('  - Admin:   admin@echoroute.gov.in   (pwd: admin123)');
  console.log('  - Citizen: citizen@echoroute.gov.in (pwd: citizen123)');
  console.log('  - Driver:  driver@echoroute.gov.in  (pwd: driver123)');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('[ECHO ROUTE DB] Seeding failed:', err);
    process.exit(1);
  });
}

module.exports = { seed };
