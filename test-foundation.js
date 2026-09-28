/**
 * ECHO ROUTE SMART WASTE - Comprehensive Foundation Verification Suite
 */
const fs = require('node:fs');
const app = require('./backend/src/app');
const db = require('./database/client');

async function runTests() {
  console.log('===============================================================');
  console.log('  ECHO ROUTE SMART WASTE - FOUNDATION VERIFICATION TEST SUITE');
  console.log('===============================================================');

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

  // TEST 1: Database Connectivity & Path
  console.log('\n[TEST GROUP 1: Database Architecture & Integrity]');
  const dbPath = db.getDbPath();
  assert(fs.existsSync(dbPath), `Dedicated database file exists at ${dbPath}`);

  const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;").map(t => t.name);
  const requiredEntities = [
    'users',
    'citizen_profiles',
    'driver_profiles',
    'pickup_requests',
    'pickup_photos',
    'completion_proofs',
    'driver_assignments',
    'routes',
    'complaints',
    'notifications'
  ];

  requiredEntities.forEach(entity => {
    assert(tables.includes(entity), `Entity table '${entity}' exists in database schema`);
  });

  // Start test server on port 5099
  const PORT = 5099;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}`;

  try {
    // TEST 2: Health & Diagnostic Endpoint
    console.log('\n[TEST GROUP 2: System Health & Diagnostics]');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health check returns HTTP 200');
    assert(healthData.status === 'OPERATIONAL', 'Health status is OPERATIONAL');
    assert(healthData.database.status === 'CONNECTED', 'Database connection status is CONNECTED');
    assert(healthData.database.type.includes('SQLite'), 'Database type is confirmed SQLite');

    // TEST 3: Demo Authentication for All Three Roles
    console.log('\n[TEST GROUP 3: Central Authentication & 3-Role Portals]');

    // 3A: Citizen Demo Login
    const citizenLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@echoroute.gov.in', password: 'citizen123', portalRole: 'CITIZEN' })
    });
    const citizenLoginData = await citizenLoginRes.json();
    assert(citizenLoginRes.status === 200, 'Citizen login returns HTTP 200');
    assert(citizenLoginData.data?.user?.role === 'CITIZEN', 'Citizen role correctly authenticated');
    const citizenToken = citizenLoginData.data?.token;

    // 3B: Driver Demo Login
    const driverLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@echoroute.gov.in', password: 'driver123', portalRole: 'DRIVER' })
    });
    const driverLoginData = await driverLoginRes.json();
    assert(driverLoginRes.status === 200, 'Driver login returns HTTP 200');
    assert(driverLoginData.data?.user?.role === 'DRIVER', 'Driver role correctly authenticated');
    const driverToken = driverLoginData.data?.token;

    // 3C: Admin Demo Login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@echoroute.gov.in', password: 'admin123', portalRole: 'ADMIN' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin login returns HTTP 200');
    assert(adminLoginData.data?.user?.role === 'ADMIN', 'Admin role correctly authenticated');
    const adminToken = adminLoginData.data?.token;

    // 3D: Portal mismatch rejection (Citizen trying to log into Admin portal)
    const mismatchLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@echoroute.gov.in', password: 'citizen123', portalRole: 'ADMIN' })
    });
    assert(mismatchLoginRes.status === 403, 'Portal mismatch returns HTTP 403 Forbidden');

    // 3E: Invalid password rejection
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@echoroute.gov.in', password: 'wrongpassword' })
    });
    assert(badLoginRes.status === 401, 'Invalid password returns HTTP 401 Unauthorized');

    // TEST 4: Role-Based Access Control (RBAC) & Foundation Endpoints
    console.log('\n[TEST GROUP 4: RBAC & Protected Endpoints]');

    // 4A: Authorized Citizen Status
    const citizenStatusRes = await fetch(`${BASE_URL}/api/citizen/status`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const citizenStatusData = await citizenStatusRes.json();
    assert(citizenStatusRes.status === 200, 'Citizen accesses /api/citizen/status with HTTP 200');
    assert(citizenStatusData.data?.recentPickups?.length > 0, 'Citizen has demo pickup request in DB');

    // 4B: Authorized Driver Status
    const driverStatusRes = await fetch(`${BASE_URL}/api/driver/status`, {
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    const driverStatusData = await driverStatusRes.json();
    assert(driverStatusRes.status === 200, 'Driver accesses /api/driver/status with HTTP 200');
    assert(driverStatusData.data?.profile?.vehicle_number === 'GP-04-E-1024', 'Driver assigned vehicle confirmed');

    // 4C: Authorized Admin Status
    const adminStatusRes = await fetch(`${BASE_URL}/api/admin/status`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminStatusData = await adminStatusRes.json();
    assert(adminStatusRes.status === 200, 'Admin accesses /api/admin/status with HTTP 200');
    assert(adminStatusData.data?.overview?.totalPickups >= 1, 'Admin overview metrics live');

    // 4D: Unauthorized Access Checks (Citizen -> Admin)
    const citizenToAdminRes = await fetch(`${BASE_URL}/api/admin/status`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(citizenToAdminRes.status === 403, 'RBAC Block: Citizen calling /api/admin/status returns 403');

    // 4E: Unauthorized Access Checks (Driver -> Admin)
    const driverToAdminRes = await fetch(`${BASE_URL}/api/admin/status`, {
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    assert(driverToAdminRes.status === 403, 'RBAC Block: Driver calling /api/admin/status returns 403');

    // 4F: Unauthenticated Access Check
    const unauthRes = await fetch(`${BASE_URL}/api/citizen/status`);
    assert(unauthRes.status === 401, 'Unauthenticated call returns HTTP 401 Unauthorized');

    // TEST 5: Frontend Static Delivery & Initial Routes
    console.log('\n[TEST GROUP 5: Frontend Static Delivery & Routes]');
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootHtml = await rootRes.text();
    assert(rootRes.status === 200, 'Root route / returns HTTP 200');
    assert(rootHtml.includes('ECHO ROUTE SMART WASTE'), 'Root HTML contains application branding');

    const loginRouteRes = await fetch(`${BASE_URL}/login`);
    assert(loginRouteRes.status === 200, 'Route /login returns HTTP 200 (SPA client fallback)');

    const citizenRouteRes = await fetch(`${BASE_URL}/citizen`);
    assert(citizenRouteRes.status === 200, 'Route /citizen returns HTTP 200 (SPA client fallback)');

    const driverRouteRes = await fetch(`${BASE_URL}/driver`);
    assert(driverRouteRes.status === 200, 'Route /driver returns HTTP 200 (SPA client fallback)');

    const adminRouteRes = await fetch(`${BASE_URL}/admin`);
    assert(adminRouteRes.status === 200, 'Route /admin returns HTTP 200 (SPA client fallback)');

  } finally {
    server.close();
  }

  console.log('\n===============================================================');
  console.log(`  SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
