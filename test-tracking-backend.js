/**
 * ECHO ROUTE SMART WASTE
 * STAGE 6 LIVE TRACKING & ROUTE PLANNING - AUTOMATED BACKEND VERIFICATION SUITE
 */
const assert = require('node:assert');

const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }
  return { status: response.status, data };
}

async function runTrackingTests() {
  console.log('================================================================');
  console.log('  ECHO ROUTE SMART WASTE - STAGE 6 TRACKING & ROUTING SUITE');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  const test = (description, condition) => {
    try {
      assert.ok(condition, description);
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${description} -> ${err.message}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate All Three Roles
    console.log('[AUTH] Logging in as Driver, Admin, and Citizen...');
    const driverAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'driver@echoroute.gov.in', password: 'driver123', portalRole: 'DRIVER' })
    });
    test('Driver authentication successful', driverAuth.status === 200 && driverAuth.data.success);
    const driverHeaders = { Authorization: `Bearer ${driverAuth.data.data?.token}` };

    const adminAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@echoroute.gov.in', password: 'admin123', portalRole: 'ADMIN' })
    });
    test('Admin authentication successful', adminAuth.status === 200 && adminAuth.data.success);
    const adminHeaders = { Authorization: `Bearer ${adminAuth.data.data?.token}` };

    const citizenAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'citizen@echoroute.gov.in', password: 'citizen123', portalRole: 'CITIZEN' })
    });
    test('Citizen authentication successful', citizenAuth.status === 200 && citizenAuth.data.success);
    const citizenHeaders = { Authorization: `Bearer ${citizenAuth.data.data?.token}` };

    // 2. Driver Location Updates (POST /api/driver/location)
    console.log('\n[DRIVER LOCATION] Testing Driver Telemetry & Location Updates...');
    const locUpdateRes = await request('/driver/location', {
      method: 'POST',
      headers: driverHeaders,
      body: JSON.stringify({
        latitude: 28.5348,
        longitude: 77.3899,
        speed_kmh: 22.0,
        heading_deg: 90.0
      })
    });
    test('POST /driver/location returns HTTP 200', locUpdateRes.status === 200 && locUpdateRes.data.success);
    test('Location update returned correct latitude', locUpdateRes.data.data.latitude === 28.5348);
    test('Location update contains prototype notice', !!locUpdateRes.data.data.prototypeNotice);

    // Validation: Invalid latitude (e.g. 95.0)
    const invalidLocRes = await request('/driver/location', {
      method: 'POST',
      headers: driverHeaders,
      body: JSON.stringify({ latitude: 95.0, longitude: 77.3899 })
    });
    test('Invalid latitude (>90) rejected with HTTP 400 Bad Request', invalidLocRes.status === 400);

    // Security: Citizen cannot update driver location
    const citizenLocBlock = await request('/driver/location', {
      method: 'POST',
      headers: citizenHeaders,
      body: JSON.stringify({ latitude: 28.5348, longitude: 77.3899 })
    });
    test('Security Block: Citizen calling POST /driver/location returns HTTP 403 Forbidden', citizenLocBlock.status === 403);

    // GET /driver/location
    const getDriverLocRes = await request('/driver/location', { headers: driverHeaders });
    test('GET /driver/location returns HTTP 200', getDriverLocRes.status === 200 && getDriverLocRes.data.success);
    test('Driver location has vehicle registration', !!getDriverLocRes.data.data.vehicle_number);

    // 3. Admin Live Tracking Telemetry (GET /api/admin/tracking)
    console.log('\n[ADMIN LIVE TRACKING] Testing Admin Live Telemetry Feed...');
    const trackingRes = await request('/admin/tracking', { headers: adminHeaders });
    test('GET /admin/tracking returns HTTP 200', trackingRes.status === 200 && trackingRes.data.success);
    test('Tracking data contains vehicles array', Array.isArray(trackingRes.data.data.vehicles));
    test('Tracking data contains activePickups array', Array.isArray(trackingRes.data.data.activePickups));
    test('Tracking data contains completedPickups array', Array.isArray(trackingRes.data.data.completedPickups));
    test('Tracking data contains Gram Panchayat Depot coordinates', !!trackingRes.data.data.depot.lat && !!trackingRes.data.data.depot.lng);
    test('Tracking data contains prototype GPS disclaimer', !!trackingRes.data.data.prototypeNotice);

    // Security: Non-admin calling /admin/tracking
    const driverTrackingBlock = await request('/admin/tracking', { headers: driverHeaders });
    test('Security Block: Driver calling /admin/tracking returns HTTP 403 Forbidden', driverTrackingBlock.status === 403);

    const citizenTrackingBlock = await request('/admin/tracking', { headers: citizenHeaders });
    test('Security Block: Citizen calling /admin/tracking returns HTTP 403 Forbidden', citizenTrackingBlock.status === 403);

    // 4. Admin Route Planning & Nearest-Neighbor Sequencing
    console.log('\n[ROUTE PLANNING] Testing Route Optimization & Sequencing...');
    const routesRes = await request('/admin/routes', { headers: adminHeaders });
    test('GET /admin/routes returns HTTP 200', routesRes.status === 200 && routesRes.data.success);
    test('Routes list is an array', Array.isArray(routesRes.data.data));

    // Recalculate route for Driver 1
    const recalcRes = await request('/admin/routes/1/recalculate', {
      method: 'POST',
      headers: adminHeaders
    });
    test('POST /admin/routes/:driverId/recalculate returns HTTP 200', recalcRes.status === 200 && recalcRes.data.success);
    test('Recalculated route returns totalDistanceKm', typeof recalcRes.data.data.totalDistanceKm === 'number');
    test('Recalculated route returns estimatedDurationMins', typeof recalcRes.data.data.estimatedDurationMins === 'number');
    test('First waypoint in sequence is Gram Panchayat Depot', recalcRes.data.data.waypoints[0].type === 'DEPOT');
    test('Recalculate route contains prototype optimization notice', !!recalcRes.data.data.prototypeNotice);

    // Security: Non-admin calling route recalculate
    const driverRecalcBlock = await request('/admin/routes/1/recalculate', {
      method: 'POST',
      headers: driverHeaders
    });
    test('Security Block: Driver calling route recalculate returns HTTP 403 Forbidden', driverRecalcBlock.status === 403);

    // 5. Driver Route Map Telemetry (GET /api/driver/route/map)
    console.log('\n[DRIVER ROUTE MAP] Testing Driver Route Telemetry...');
    const driverMapRes = await request('/driver/route/map', { headers: driverHeaders });
    test('GET /driver/route/map returns HTTP 200', driverMapRes.status === 200 && driverMapRes.data.success);
    test('Driver map data contains driver vehicle info', !!driverMapRes.data.data.driver.vehicle_number);
    test('Driver map data contains sequenced waypoints', Array.isArray(driverMapRes.data.data.waypoints));
    test('Driver map data contains prototype GPS notice', !!driverMapRes.data.data.prototypeNotice);

    // Security: Citizen calling driver route map
    const citizenDriverMapBlock = await request('/driver/route/map', { headers: citizenHeaders });
    test('Security Block: Citizen calling /driver/route/map returns HTTP 403 Forbidden', citizenDriverMapBlock.status === 403);

    // 6. Citizen Track Pickup Map Telemetry
    console.log('\n[CITIZEN TRACK MAP] Testing Citizen Collection Map Telemetry...');
    // Create and assign a pickup for citizen to test map telemetry
    const newPickupRes = await request('/citizen/pickups', {
      method: 'POST',
      headers: citizenHeaders,
      body: JSON.stringify({
        waste_type: 'Household Waste',
        estimated_volume_bags: 1,
        scheduled_date: new Date().toISOString().split('T')[0],
        preferred_time: 'Morning (08:00 - 11:00 AM)',
        address: 'Ward 4 Testing House'
      })
    });
    const testPickupId = newPickupRes.data.data.id;

    // Verify and assign to Driver 1 as Admin
    await request(`/admin/pickups/${testPickupId}/verify`, { method: 'PATCH', headers: adminHeaders });
    await request(`/admin/pickups/${testPickupId}/assign`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ driver_id: 1 })
    });

    const citizenMapRes = await request(`/citizen/track/${testPickupId}/map`, { headers: citizenHeaders });
    test('GET /citizen/track/:id/map returns HTTP 200', citizenMapRes.status === 200 && citizenMapRes.data.success);
    test('Map data contains pickup coordinates', !!citizenMapRes.data.data.pickup.latitude && !!citizenMapRes.data.data.pickup.longitude);
    test('Map data contains assigned driver location', !!citizenMapRes.data.data.driver.latitude && !!citizenMapRes.data.data.driver.longitude);
    test('Map data contains route line polyline', Array.isArray(citizenMapRes.data.data.routeLine));
    test('Citizen map contains simulated prototype GPS notice', !!citizenMapRes.data.data.prototypeNotice);

  } catch (err) {
    console.error('Fatal tracking test error:', err);
    failed++;
  }

  console.log('================================================================');
  console.log(`  SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runTrackingTests();
