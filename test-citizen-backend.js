/**
 * ECHO ROUTE SMART WASTE
 * Stage 3 Citizen Portal Backend Verification Suite
 */
const app = require('./backend/src/app');
const db = require('./database/client');
const bcrypt = require('./backend/node_modules/bcryptjs');

async function runCitizenTests() {
  console.log('================================================================');
  console.log('  ECHO ROUTE SMART WASTE - STAGE 3 CITIZEN VERIFICATION SUITE');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  const PORT = 5098;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}`;

  try {
    // 1. Citizen Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@echoroute.gov.in', password: 'citizen123', portalRole: 'CITIZEN' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Citizen login successful (HTTP 200)');
    const token = loginData.data.token;
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. GET /api/citizen/dashboard
    const dashRes = await fetch(`${BASE_URL}/api/citizen/dashboard`, { headers: authHeaders });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, 'GET /api/citizen/dashboard returns HTTP 200');
    assert(typeof dashData.data.stats.totalRequests === 'number', 'Dashboard totalRequests is a dynamic number');
    assert(typeof dashData.data.stats.pendingRequests === 'number', 'Dashboard pendingRequests is a dynamic number');
    assert(typeof dashData.data.stats.scheduledPickups === 'number', 'Dashboard scheduledPickups is a dynamic number');
    assert(typeof dashData.data.stats.completedPickups === 'number', 'Dashboard completedPickups is a dynamic number');

    // 3. Validation rejection for empty form
    const badFormRes = await fetch(`${BASE_URL}/api/citizen/pickups`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    assert(badFormRes.status === 400, 'Empty pickup form submission returns HTTP 400 Bad Request');

    // 4. POST /api/citizen/pickups with realistic data and base64 test photo
    // 1x1 transparent PNG as base64
    const testPhotoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const createRes = await fetch(`${BASE_URL}/api/citizen/pickups`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        waste_type: 'Plastic Waste',
        estimated_volume_bags: 3,
        scheduled_date: '2026-09-25',
        preferred_time: 'Morning (08:00 - 11:00 AM)',
        address: 'House 42, Near Shiv Mandir Chowk, Ward 4',
        description: 'Dry plastic bottles and packaging cartons collected over the week',
        photo_data: testPhotoBase64
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'POST /api/citizen/pickups returns HTTP 201 Created');
    assert(createData.data.request_code.startsWith('REQ-'), `Generated request code formatted: ${createData.data?.request_code}`);
    assert(createData.data.status === 'PENDING', 'Initial pickup status is PENDING (REQUESTED)');
    assert(createData.data.photos.length > 0, 'Waste photo successfully attached to pickup');
    const newPickupId = createData.data.id;

    // 5. Verify In-App Notifications generated for both Citizen and Admin
    const notifs = db.query('SELECT * FROM notifications ORDER BY id DESC LIMIT 5');
    assert(notifs.some(n => n.title.includes('Pickup Request')), 'Citizen received pickup confirmation notification');
    assert(notifs.some(n => n.title.includes('New Citizen Pickup Request')), 'Admin received dispatch notice notification');

    // 6. GET /api/citizen/pickups
    const pickupsRes = await fetch(`${BASE_URL}/api/citizen/pickups`, { headers: authHeaders });
    const pickupsData = await pickupsRes.json();
    assert(pickupsRes.status === 200, 'GET /api/citizen/pickups returns HTTP 200');
    assert(pickupsData.data.some(p => p.id === newPickupId), 'Newly created pickup is present in citizen list');

    // 7. GET /api/citizen/pickups/:id
    const singleRes = await fetch(`${BASE_URL}/api/citizen/pickups/${newPickupId}`, { headers: authHeaders });
    const singleData = await singleRes.json();
    assert(singleRes.status === 200, 'GET /api/citizen/pickups/:id returns HTTP 200');
    assert(singleData.data.timelineStages.length === 7, 'Pickup details contains full 7-step timeline');
    assert(singleData.data.timelineStage === 'REQUESTED', 'Current timeline stage is REQUESTED');

    // 8. STRICT RBAC & DATA ISOLATION TEST:
    // Create a second citizen in database
    const hash = await bcrypt.hash('pass123', 10);
    db.run(
      "INSERT INTO users (email, password_hash, role, full_name, phone) VALUES ('other_citizen@echoroute.gov.in', ?, 'CITIZEN', 'Other Resident', '9999999999')",
      [hash]
    );
    const otherUser = db.get("SELECT id FROM users WHERE email = 'other_citizen@echoroute.gov.in'");
    db.run(
      "INSERT INTO citizen_profiles (user_id, ward_number, village_name, house_number) VALUES (?, 'Ward 2', 'Sundarpur', 'House 12')",
      [otherUser.id]
    );

    // Login as second citizen
    const otherLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'other_citizen@echoroute.gov.in', password: 'pass123', portalRole: 'CITIZEN' })
    });
    const otherLoginData = await otherLoginRes.json();
    const otherToken = otherLoginData.data.token;

    // Second citizen attempts to view Citizen 1's pickup -> MUST RETURN 403 Forbidden!
    const unauthorizedRes = await fetch(`${BASE_URL}/api/citizen/pickups/${newPickupId}`, {
      headers: { 'Authorization': `Bearer ${otherToken}` }
    });
    assert(unauthorizedRes.status === 403, 'Security Guard: Cross-citizen access blocked with HTTP 403 Forbidden');

    // 9. Report Issue / Complaints
    const complaintRes = await fetch(`${BASE_URL}/api/citizen/complaints`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subject: 'Waste segregation guidelines query',
        description: 'Need clarity on whether medicine blister packs are classified under E-Waste or Household.',
        complaint_type: 'Inquiry / Grievance',
        pickup_request_id: newPickupId
      })
    });
    const complaintData = await complaintRes.json();
    assert(complaintRes.status === 201, 'POST /api/citizen/complaints returns HTTP 201 Created');
    assert(complaintData.data.status === 'SUBMITTED', 'Complaint status is SUBMITTED');

    // 10. Update Profile
    const profileRes = await fetch(`${BASE_URL}/api/citizen/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        phone: '+91-98765-43210',
        house_number: 'House No. 42-B',
        landmark: 'Opposite Shiv Mandir Garden'
      })
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200, 'PUT /api/citizen/profile returns HTTP 200');
    assert(profileData.data.house_number === 'House No. 42-B', 'Profile update persisted in SQLite');

    // Clean up dummy second user
    db.run("DELETE FROM citizen_profiles WHERE user_id = ?", [otherUser.id]);
    db.run("DELETE FROM users WHERE id = ?", [otherUser.id]);

  } finally {
    server.close();
  }

  console.log('================================================================');
  console.log(`  SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runCitizenTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
