/**
 * ECHO ROUTE SMART WASTE
 * STAGE 5 DRIVER PORTAL - AUTOMATED BACKEND VERIFICATION SUITE
 */
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const db = require('./database/client');

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

async function runDriverTests() {
  console.log('================================================================');
  console.log('  ECHO ROUTE SMART WASTE - STAGE 5 DRIVER VERIFICATION SUITE');
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
    // 1. Authenticate as Driver
    console.log('[AUTH] Logging in as Driver...');
    const driverAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'driver@echoroute.gov.in',
        password: 'driver123',
        portalRole: 'DRIVER'
      })
    });
    test('Driver login successful (HTTP 200)', driverAuth.status === 200 && driverAuth.data.success);
    const driverToken = driverAuth.data.data?.token;
    const driverHeaders = { Authorization: `Bearer ${driverToken}` };

    // Also get Citizen token for security isolation tests
    const citizenAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'citizen@echoroute.gov.in',
        password: 'citizen123',
        portalRole: 'CITIZEN'
      })
    });
    const citizenToken = citizenAuth.data.data?.token;
    const citizenHeaders = { Authorization: `Bearer ${citizenToken}` };

    // Also get Admin token for admin verification checks
    const adminAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@echoroute.gov.in',
        password: 'admin123',
        portalRole: 'ADMIN'
      })
    });
    const adminToken = adminAuth.data.data?.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Driver Dashboard Metrics
    console.log('\n[DASHBOARD] Testing Driver Cockpit & Dynamic Metrics...');
    const dashRes = await request('/driver/dashboard', { headers: driverHeaders });
    test('GET /driver/dashboard returns HTTP 200', dashRes.status === 200 && dashRes.data.success);
    test('Metric: todaysAssignments is a dynamic number', typeof dashRes.data.data.metrics.todaysAssignments === 'number');
    test('Metric: pendingPickups is a dynamic number', typeof dashRes.data.data.metrics.pendingPickups === 'number');
    test('Metric: activePickups is a dynamic number', typeof dashRes.data.data.metrics.activePickups === 'number');
    test('Metric: completedPickups is a dynamic number', typeof dashRes.data.data.metrics.completedPickups === 'number');
    test('Driver profile contains vehicle number', !!dashRes.data.data.profile.vehicle_number);

    // 3. Driver Pickups List & Filtering
    console.log('\n[ASSIGNMENTS] Testing Driver Assignments...');
    const pickupsRes = await request('/driver/pickups', { headers: driverHeaders });
    test('GET /driver/pickups returns HTTP 200', pickupsRes.status === 200 && pickupsRes.data.success);
    test('Pickups list is an array', Array.isArray(pickupsRes.data.data));

    // Ensure we have an assigned pickup for test workflow.
    // Check if there is an active assigned pickup or create/assign one.
    let targetPickup = pickupsRes.data.data.find(p => ['ASSIGNED', 'ACCEPTED'].includes(p.assignment_status));
    if (!targetPickup) {
      console.log('  [SETUP] Creating & assigning a fresh pickup for testing...');
      // Create pickup as citizen
      const newPickupRes = await request('/citizen/pickups', {
        method: 'POST',
        headers: citizenHeaders,
        body: JSON.stringify({
          waste_type: 'Plastic Waste',
          estimated_volume_bags: 2,
          scheduled_date: new Date().toISOString().split('T')[0],
          preferred_time: 'Morning (08:00 - 11:00 AM)',
          address: 'Test Ward 4 Street',
          description: 'Stage 5 Driver Workflow Test'
        })
      });
      const createdId = newPickupRes.data.data.id;
      // Verify as admin
      await request(`/admin/pickups/${createdId}/verify`, { method: 'PATCH', headers: adminHeaders });
      // Assign driver 1 as admin
      await request(`/admin/pickups/${createdId}/assign`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ driver_id: 1 })
      });
      const refreshedPickups = await request('/driver/pickups', { headers: driverHeaders });
      targetPickup = refreshedPickups.data.data.find(p => p.pickup_id === createdId);
    }

    test('Target assigned pickup available for workflow testing', !!targetPickup);
    const targetId = targetPickup.pickup_id;

    // 4. Strict RBAC & Data Isolation
    console.log('\n[SECURITY] Testing RBAC & Driver Data Isolation...');
    // Create an unassigned pickup
    const unassignedRes = await request('/citizen/pickups', {
      method: 'POST',
      headers: citizenHeaders,
      body: JSON.stringify({
        waste_type: 'Household Waste',
        estimated_volume_bags: 1,
        scheduled_date: new Date().toISOString().split('T')[0],
        preferred_time: 'Morning (08:00 - 11:00 AM)',
        address: 'Unassigned Test Location'
      })
    });
    const unassignedId = unassignedRes.data.data.id;

    // Driver querying unassigned pickup must be rejected with HTTP 403 Forbidden
    const unassignedAccess = await request(`/driver/pickups/${unassignedId}`, { headers: driverHeaders });
    test('Security Block: Driver querying unassigned pickup returns HTTP 403 Forbidden', unassignedAccess.status === 403);

    // Citizen querying driver endpoints must be rejected with HTTP 403 Forbidden
    const citizenBlock = await request('/driver/dashboard', { headers: citizenHeaders });
    test('Security Block: Citizen calling /driver/dashboard returns HTTP 403 Forbidden', citizenBlock.status === 403);

    // 5. Driver Pickup Details View
    console.log('\n[DETAILS] Testing Pickup Details Inspection...');
    const detailsRes = await request(`/driver/pickups/${targetId}`, { headers: driverHeaders });
    test('GET /driver/pickups/:id returns HTTP 200', detailsRes.status === 200 && detailsRes.data.success);
    test('Details contains citizen name and contact', !!detailsRes.data.data.citizen_name);
    test('Details contains 7-step timelineStages', Array.isArray(detailsRes.data.data.timelineStages) && detailsRes.data.data.timelineStages.length === 7);

    // 6. Workflow Step 1: Accept Assignment
    console.log('\n[WORKFLOW] Testing Step-by-Step Workflow State Machine...');
    // If currently ASSIGNED, accept it
    if (detailsRes.data.data.assignment_status === 'ASSIGNED') {
      const acceptRes = await request(`/driver/pickups/${targetId}/accept`, {
        method: 'POST',
        headers: driverHeaders
      });
      test('POST /driver/pickups/:id/accept returns HTTP 200', acceptRes.status === 200 && acceptRes.data.success);
      test('Assignment status transitioned to ACCEPTED', acceptRes.data.data.assignment_status === 'ACCEPTED');
    }

    // Workflow Step 2: Start / On The Way
    const startRes = await request(`/driver/pickups/${targetId}/status`, {
      method: 'PATCH',
      headers: driverHeaders,
      body: JSON.stringify({ action: 'START' })
    });
    test('PATCH /driver/pickups/:id/status (START) returns HTTP 200', startRes.status === 200 && startRes.data.success);
    test('Assignment status transitioned to EN_ROUTE', startRes.data.data.assignment_status === 'EN_ROUTE');
    test('Pickup status transitioned to IN_TRANSIT', startRes.data.data.pickup_status === 'IN_TRANSIT');

    // Workflow Step 3: Arrived
    const arrivedRes = await request(`/driver/pickups/${targetId}/status`, {
      method: 'PATCH',
      headers: driverHeaders,
      body: JSON.stringify({ action: 'ARRIVED' })
    });
    test('PATCH /driver/pickups/:id/status (ARRIVED) returns HTTP 200', arrivedRes.status === 200 && arrivedRes.data.success);
    test('Assignment status transitioned to ARRIVED', arrivedRes.data.data.assignment_status === 'ARRIVED');

    // Workflow Step 4: Picked Up
    const pickedUpRes = await request(`/driver/pickups/${targetId}/status`, {
      method: 'PATCH',
      headers: driverHeaders,
      body: JSON.stringify({ action: 'PICKED_UP' })
    });
    test('PATCH /driver/pickups/:id/status (PICKED_UP) returns HTTP 200', pickedUpRes.status === 200 && pickedUpRes.data.success);
    test('Assignment status transitioned to PICKED_UP', pickedUpRes.data.data.assignment_status === 'PICKED_UP');
    test('Pickup status transitioned to COLLECTED', pickedUpRes.data.data.pickup_status === 'COLLECTED');

    // 7. Completion Proof Validation
    console.log('\n[PROOF & COMPLETION] Testing Photographic Completion Proof...');
    // Attempt to complete without proof -> MUST return 400 Bad Request
    const noProofRes = await request(`/driver/pickups/${targetId}/complete`, {
      method: 'POST',
      headers: driverHeaders,
      body: JSON.stringify({ driver_notes: 'Trying without proof' })
    });
    test('Completion without photo proof rejected with HTTP 400 Bad Request', noProofRes.status === 400);

    // Upload proof photo
    const dummyProofBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await request('/driver/upload-proof', {
      method: 'POST',
      headers: driverHeaders,
      body: JSON.stringify({ photo_data: dummyProofBase64, filename: 'completion_proof.png' })
    });
    test('POST /driver/upload-proof returns HTTP 200', uploadRes.status === 200 && uploadRes.data.success);
    test('Returns safe relative proof_photo_url', uploadRes.data.proof_photo_url.startsWith('/uploads/completion_proofs/'));

    // Submit Complete Pickup
    const completeRes = await request(`/driver/pickups/${targetId}/complete`, {
      method: 'POST',
      headers: driverHeaders,
      body: JSON.stringify({
        proof_photo_url: uploadRes.data.proof_photo_url,
        driver_notes: 'Waste collected cleanly from doorstep. Area swept.',
        collected_weight_kg: 18.5
      })
    });
    test('POST /driver/pickups/:id/complete returns HTTP 200', completeRes.status === 200 && completeRes.data.success);
    test('Pickup status updated to COMPLETED', completeRes.data.data.pickup_status === 'COMPLETED');
    test('Assignment status updated to COMPLETED', completeRes.data.data.assignment_status === 'COMPLETED');
    test('Completion proof record linked with photo', !!completeRes.data.data.proof_photo_url);

    // Check citizen received notification
    const citizenNotifs = await request('/citizen/notifications', { headers: citizenHeaders });
    const hasCompleteNotif = citizenNotifs.data.data.some(n => n.title.includes('Completed'));
    test('Citizen received pickup completion notification', hasCompleteNotif);

    // 8. Today's Route View
    console.log('\n[ROUTE] Testing Today\'s Route Sequenced Stops...');
    const routeRes = await request('/driver/route', { headers: driverHeaders });
    test('GET /driver/route returns HTTP 200', routeRes.status === 200 && routeRes.data.success);
    test('Route contains prototype notice', !!routeRes.data.prototypeNotice);
    test('Route returns sequenced stops array', Array.isArray(routeRes.data.data));

    // 9. Completed Pickups Roster
    console.log('\n[COMPLETED] Testing Completed Pickups Roster...');
    const completedRes = await request('/driver/completed', { headers: driverHeaders });
    test('GET /driver/completed returns HTTP 200', completedRes.status === 200 && completedRes.data.success);
    test('Completed list contains newly completed pickup', completedRes.data.data.some(p => p.pickup_id === targetId));

    // 10. Driver Profile & Duty Toggle
    console.log('\n[PROFILE] Testing Driver Profile & Duty Toggle...');
    const profileRes = await request('/driver/profile', { headers: driverHeaders });
    test('GET /driver/profile returns HTTP 200', profileRes.status === 200 && profileRes.data.success);
    test('Profile returns license number and vehicle capacity', !!profileRes.data.data.license_number && !!profileRes.data.data.capacity_kg);

    const initialDuty = profileRes.data.data.is_on_duty;
    const dutyToggleRes = await request('/driver/duty', { method: 'PATCH', headers: driverHeaders });
    test('PATCH /driver/duty toggles duty status', dutyToggleRes.status === 200 && dutyToggleRes.data.data.is_on_duty !== initialDuty);

    // Toggle back to original
    await request('/driver/duty', { method: 'PATCH', headers: driverHeaders });

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('================================================================');
  console.log(`  SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runDriverTests();
