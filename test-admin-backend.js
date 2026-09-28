/**
 * ECHO ROUTE SMART WASTE
 * Stage 4 Admin Portal Backend Verification Suite
 */
const app = require('./backend/src/app');
const db = require('./database/client');

async function runAdminTests() {
  console.log('================================================================');
  console.log('  ECHO ROUTE SMART WASTE - STAGE 4 ADMIN VERIFICATION SUITE');
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

  const PORT = 5097;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}`;

  try {
    // 1. Admin Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@echoroute.gov.in', password: 'admin123', portalRole: 'ADMIN' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Admin login successful (HTTP 200)');
    const adminToken = loginData.data.token;
    const adminHeaders = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    // 2. GET /api/admin/dashboard - 8 Dynamic Metrics
    const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers: adminHeaders });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, 'GET /api/admin/dashboard returns HTTP 200');
    const m = dashData.data.metrics;
    assert(typeof m.totalCitizens === 'number', `Metric 1: totalCitizens = ${m.totalCitizens}`);
    assert(typeof m.registeredDrivers === 'number', `Metric 2: registeredDrivers = ${m.registeredDrivers}`);
    assert(typeof m.totalPickups === 'number', `Metric 3: totalPickups = ${m.totalPickups}`);
    assert(typeof m.pendingRequests === 'number', `Metric 4: pendingRequests = ${m.pendingRequests}`);
    assert(typeof m.verifiedRequests === 'number', `Metric 5: verifiedRequests = ${m.verifiedRequests}`);
    assert(typeof m.activePickups === 'number', `Metric 6: activePickups = ${m.activePickups}`);
    assert(typeof m.completedPickups === 'number', `Metric 7: completedPickups = ${m.completedPickups}`);
    assert(typeof m.openComplaints === 'number', `Metric 8: openComplaints = ${m.openComplaints}`);

    // 3. GET /api/admin/pickups
    const pickupsRes = await fetch(`${BASE_URL}/api/admin/pickups`, { headers: adminHeaders });
    const pickupsData = await pickupsRes.json();
    assert(pickupsRes.status === 200, 'GET /api/admin/pickups returns HTTP 200');
    assert(pickupsData.count > 0, `Total pickups fetched across system: ${pickupsData.count}`);
    const samplePickup = pickupsData.data[0];

    // 4. GET /api/admin/pickups/:id
    const singleRes = await fetch(`${BASE_URL}/api/admin/pickups/${samplePickup.id}`, { headers: adminHeaders });
    const singleData = await singleRes.json();
    assert(singleRes.status === 200, 'GET /api/admin/pickups/:id returns HTTP 200');
    assert(singleData.data.citizen_name !== undefined, 'Pickup details contains citizen name');

    // 5. Verification Pipeline: PATCH /api/admin/pickups/:id/verify
    // Find or create a PENDING pickup
    let pendingPickup = pickupsData.data.find(p => p.status === 'PENDING');
    if (!pendingPickup) {
      // Create a test pending pickup
      const citizenProfile = db.get("SELECT id FROM citizen_profiles LIMIT 1");
      db.run(
        `INSERT INTO pickup_requests (citizen_id, request_code, waste_type, address, ward_number, status, preferred_time, scheduled_date)
         VALUES (?, 'REQ-TEST-VERIFY', 'HOUSEHOLD', 'Test Address', 'Ward 4', 'PENDING', 'Morning', DATE('now'))`,
        [citizenProfile.id]
      );
      pendingPickup = db.get("SELECT * FROM pickup_requests WHERE request_code = 'REQ-TEST-VERIFY'");
    }

    const verifyRes = await fetch(`${BASE_URL}/api/admin/pickups/${pendingPickup.id}/verify`, {
      method: 'PATCH',
      headers: adminHeaders
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200, 'PATCH /api/admin/pickups/:id/verify returns HTTP 200');
    assert(verifyData.data.status === 'VERIFIED', 'Pickup status transitioned to VERIFIED');

    // 6. Driver Assignment Pipeline: POST /api/admin/pickups/:id/assign
    const driverProfile = db.get("SELECT id FROM driver_profiles LIMIT 1");
    const assignRes = await fetch(`${BASE_URL}/api/admin/pickups/${pendingPickup.id}/assign`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ driver_id: driverProfile.id })
    });
    const assignData = await assignRes.json();
    assert(assignRes.status === 200, 'POST /api/admin/pickups/:id/assign returns HTTP 200');
    assert(assignData.data.status === 'ASSIGNED', 'Pickup status transitioned to ASSIGNED');
    assert(assignData.data.assigned_driver_id === driverProfile.id, 'Assigned driver profile recorded');

    // 7. GET /api/admin/drivers & Duty Toggling
    const driversRes = await fetch(`${BASE_URL}/api/admin/drivers`, { headers: adminHeaders });
    const driversData = await driversRes.json();
    assert(driversRes.status === 200, 'GET /api/admin/drivers returns HTTP 200');
    assert(driversData.count > 0, 'Driver fleet roster returned');

    const toggleRes = await fetch(`${BASE_URL}/api/admin/drivers/${driverProfile.id}/duty`, {
      method: 'PATCH',
      headers: adminHeaders
    });
    const toggleData = await toggleRes.json();
    assert(toggleRes.status === 200, 'PATCH /api/admin/drivers/:id/duty returns HTTP 200');
    assert(typeof toggleData.data.is_on_duty === 'number', `Duty status toggled to: ${toggleData.data.is_on_duty}`);

    // Toggle back
    await fetch(`${BASE_URL}/api/admin/drivers/${driverProfile.id}/duty`, { method: 'PATCH', headers: adminHeaders });

    // 7b. Enroll / Register New Driver: POST /api/admin/drivers
    const testDriverEmail = `newdriver_${Date.now()}@echoroute.gov.in`;
    const addDriverRes = await fetch(`${BASE_URL}/api/admin/drivers`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        fullName: 'Rajesh Sharma',
        email: testDriverEmail,
        password: 'driverpassword123',
        phone: '+91-98765-11111',
        vehicleNumber: 'GP-04-E-2050',
        vehicleType: 'Electric Auto Tipper',
        licenseNumber: 'DL-9920260001',
        capacityKg: 850,
        isOnDuty: 1
      })
    });
    const addDriverData = await addDriverRes.json();
    assert(addDriverRes.status === 201, 'POST /api/admin/drivers returns HTTP 201 Created');
    assert(addDriverData.data.driver_name === 'Rajesh Sharma', 'New driver name recorded');
    assert(addDriverData.data.vehicle_number === 'GP-04-E-2050', 'New driver vehicle number recorded');
    assert(addDriverData.data.is_on_duty === 1, 'New driver marked on duty');

    // Duplicate email check
    const dupRes = await fetch(`${BASE_URL}/api/admin/drivers`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        fullName: 'Duplicate Driver',
        email: testDriverEmail,
        password: 'password123',
        vehicleNumber: 'GP-04-E-9999',
        licenseNumber: 'DL-0000000000'
      })
    });
    assert(dupRes.status === 400, 'Duplicate email driver registration rejected with HTTP 400');

    // Missing fields check
    const missingRes = await fetch(`${BASE_URL}/api/admin/drivers`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        fullName: 'Missing Fields'
      })
    });
    assert(missingRes.status === 400, 'Missing fields driver registration rejected with HTTP 400');

    // Authenticate with new driver credentials
    const newDriverLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testDriverEmail,
        password: 'driverpassword123',
        portalRole: 'DRIVER'
      })
    });
    const newDriverLoginData = await newDriverLogin.json();
    assert(newDriverLogin.status === 200, 'Newly created driver can log in via POST /api/auth/login');
    assert(newDriverLoginData.data.user.role === 'DRIVER', 'Authenticated role is DRIVER');

    // 8. Citizen Directory: GET /api/admin/citizens
    const citizensRes = await fetch(`${BASE_URL}/api/admin/citizens`, { headers: adminHeaders });
    const citizensData = await citizensRes.json();
    assert(citizensRes.status === 200, 'GET /api/admin/citizens returns HTTP 200');
    assert(citizensData.count > 0, 'Citizen directory returned');
    assert(typeof citizensData.data[0].total_requests_count === 'number', 'Total requests count per citizen present');

    // 9. Complaints Management: GET & PATCH
    const complaintsRes = await fetch(`${BASE_URL}/api/admin/complaints`, { headers: adminHeaders });
    const complaintsData = await complaintsRes.json();
    assert(complaintsRes.status === 200, 'GET /api/admin/complaints returns HTTP 200');
    if (complaintsData.count > 0) {
      const targetComplaint = complaintsData.data[0];
      const updateCompRes = await fetch(`${BASE_URL}/api/admin/complaints/${targetComplaint.id}`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          status: 'RESOLVED',
          admin_notes: 'Waste collection scheduled for priority cleanup and verified by Ward supervisor.'
        })
      });
      const updateCompData = await updateCompRes.json();
      assert(updateCompRes.status === 200, 'PATCH /api/admin/complaints/:id returns HTTP 200');
      assert(updateCompData.data.status === 'RESOLVED', 'Complaint status updated to RESOLVED');
    }

    // 10. STRICT RBAC ACCESS CONTROL CHECKS
    // Citizen attempting to access Admin endpoints -> MUST RETURN 403 Forbidden!
    const citizenLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@echoroute.gov.in', password: 'citizen123', portalRole: 'CITIZEN' })
    });
    const citizenToken = (await citizenLoginRes.json()).data.token;
    const citizenHeaders = { 'Authorization': `Bearer ${citizenToken}` };

    const cDash = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers: citizenHeaders });
    assert(cDash.status === 403, 'RBAC Block: Citizen calling /api/admin/dashboard returns 403 Forbidden');

    const cVerify = await fetch(`${BASE_URL}/api/admin/pickups/${pendingPickup.id}/verify`, {
      method: 'PATCH',
      headers: { ...citizenHeaders, 'Content-Type': 'application/json' }
    });
    assert(cVerify.status === 403, 'RBAC Block: Citizen calling /api/admin/pickups/:id/verify returns 403 Forbidden');

    const cAssign = await fetch(`${BASE_URL}/api/admin/pickups/${pendingPickup.id}/assign`, {
      method: 'POST',
      headers: { ...citizenHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: driverProfile.id })
    });
    assert(cAssign.status === 403, 'RBAC Block: Citizen calling /api/admin/pickups/:id/assign returns 403 Forbidden');

    const cAddDriver = await fetch(`${BASE_URL}/api/admin/drivers`, {
      method: 'POST',
      headers: { ...citizenHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Unauthorized', email: 'unauth@test.com', password: '123' })
    });
    assert(cAddDriver.status === 403, 'RBAC Block: Citizen calling POST /api/admin/drivers returns 403 Forbidden');

  } finally {
    server.close();
  }

  console.log('================================================================');
  console.log(`  SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runAdminTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
