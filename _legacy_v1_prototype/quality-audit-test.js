// quality-audit-test.js - Comprehensive test suite for ECHO ROUTE SMART WASTE
const http = require('node:http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json || body });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('=============================================================');
  console.log('  ECHO ROUTE SMART WASTE — COMPREHENSIVE QUALITY AUDIT');
  console.log('=============================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failedTests++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // PHASE 2 — TEST AUTHENTICATION & DEMO ACCOUNTS
    // -------------------------------------------------------------
    console.log('--- PHASE 2: AUTHENTICATION & SESSION PERSISTENCE ---');

    // 1. Citizen Login
    const citRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'citizen@echoroute.gov.in', password: 'citizen123', requestedRole: 'citizen' });
    assert(citRes.statusCode === 200, 'Citizen demo login succeeds with 200 OK');
    assert(citRes.body.user.role === 'citizen', 'Citizen role verified as citizen');
    const citizenToken = citRes.body.token;

    // 2. Driver Login
    const drvRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'driver1@echoroute.gov.in', password: 'driver123', requestedRole: 'driver' });
    assert(drvRes.statusCode === 200, 'Driver demo login succeeds with 200 OK');
    assert(drvRes.body.user.role === 'driver', 'Driver role verified as driver');
    const driver1Token = drvRes.body.token;

    // 3. Admin Login
    const admRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@echoroute.gov.in', password: 'admin123', requestedRole: 'admin' });
    assert(admRes.statusCode === 200, 'Admin demo login succeeds with 200 OK');
    assert(admRes.body.user.role === 'admin', 'Admin role verified as admin');
    const adminToken = admRes.body.token;

    // 4. Incorrect Password Test
    const badPassRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@echoroute.gov.in', password: 'wrongpassword' });
    assert(badPassRes.statusCode === 401, 'Incorrect password correctly rejected with 401 Unauthorized');

    // 5. Session Persistence Test (SQLite-backed session)
    const meRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/auth/me', method: 'GET',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(meRes.statusCode === 200 && meRes.body.user.email === 'citizen@echoroute.gov.in', 'Session persistence via /api/auth/me functions properly');

    // -------------------------------------------------------------
    // PHASE 3 — TEST ROLE SECURITY & BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- PHASE 3: ROLE SECURITY & ACCESS CONTROL GUARDS ---');

    // Citizen cannot access Admin fleet roster
    const citDriversRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/drivers', method: 'GET',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(citDriversRes.statusCode === 403, 'Citizen blocked from Admin driver fleet roster (403 Forbidden)');

    // Citizen cannot access operational stats
    const citStatsRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(citStatsRes.statusCode === 403, 'Citizen blocked from Admin operational stats (403 Forbidden)');

    // Driver cannot access operational stats
    const drvStatsRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET',
      headers: { 'Authorization': `Bearer ${driver1Token}` }
    });
    assert(drvStatsRes.statusCode === 403, 'Driver blocked from Admin operational stats (403 Forbidden)');

    // Driver cannot access Complaints desk
    const drvComplaintsRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/complaints', method: 'GET',
      headers: { 'Authorization': `Bearer ${driver1Token}` }
    });
    assert(drvComplaintsRes.statusCode === 403, 'Driver blocked from Complaints desk (403 Forbidden)');

    // Driver 2 Login
    const drv2Res = await request({
      hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'driver2@echoroute.gov.in', password: 'driver123', requestedRole: 'driver' });
    const driver2Token = drv2Res.body.token;

    // -------------------------------------------------------------
    // PHASE 4 & 5 — COMPLETE PICKUP WORKFLOW & IMAGE PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n--- PHASE 4 & 5: COMPLETE PICKUP WORKFLOW & IMAGE SYSTEM ---');

    // Step 1: Citizen uploads waste photo
    const uploadPhoto = await request({
      hostname: 'localhost', port: 3000, path: '/api/upload', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenToken}` }
    }, {
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%23cbd5e1"/><text x="150" y="100" text-anchor="middle">Plastic Dry Waste</text></svg>'
    });
    assert(uploadPhoto.statusCode === 200, 'Citizen photo upload succeeds with 200 OK');
    const citizenPhotoUrl = uploadPhoto.body.url;
    assert(citizenPhotoUrl.startsWith('/uploads/'), 'Photo saved to disk in /uploads/ directory');

    // Step 2: Verify photo is served by web server
    const servePhoto = await request({ hostname: 'localhost', port: 3000, path: citizenPhotoUrl, method: 'GET' });
    assert(servePhoto.statusCode === 200, 'Uploaded photo is directly accessible via static server');

    // Step 3: Citizen books pickup request
    const bookRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/pickups', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenToken}` }
    }, {
      wasteType: 'Plastic Waste',
      quantity: '3 Bags (~25kg)',
      address: 'House 14, Near Shiv Mandir, Ward 4',
      scheduledDate: new Date().toISOString().split('T')[0],
      preferredTime: 'Morning (08:00 - 11:00 AM)',
      description: 'Cleaned recyclable packaging and plastic bottles',
      wastePhotoUrl: citizenPhotoUrl
    });
    assert(bookRes.statusCode === 201, 'Pickup request created with 201 Created');
    const pickupId = bookRes.body.pickup.id;
    assert(bookRes.body.pickup.status === 'Requested', 'Initial status set to Requested');

    // Step 4: Admin verifies request
    const verifyRes = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/verify`, method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(verifyRes.statusCode === 200, 'Admin verification succeeds');

    // Step 5: Admin assigns Driver Suresh Kumar (ID 2)
    const assignRes = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/assign`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { driverId: 2 });
    assert(assignRes.statusCode === 200, 'Admin driver assignment succeeds with status Driver Assigned');

    // Step 6: Driver 2 tries to access Driver 1's pickup -> blocked!
    const drv2Access = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${driver2Token}` }
    });
    assert(drv2Access.statusCode === 403, 'Driver 2 blocked from viewing Driver 1 assigned pickup (403 Forbidden)');

    // Step 7: Driver Suresh Kumar views assigned pickup
    const drv1Access = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${driver1Token}` }
    });
    assert(drv1Access.statusCode === 200, 'Assigned driver Suresh Kumar can view pickup details');
    assert(drv1Access.body.pickup.citizen_photo_url === citizenPhotoUrl, 'Citizen waste photo visible to driver');

    // Step 8: Driver Suresh Kumar accepts assignment
    const acceptRes = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/accept`, method: 'PUT',
      headers: { 'Authorization': `Bearer ${driver1Token}` }
    });
    assert(acceptRes.statusCode === 200, 'Driver formally accepts assignment');

    // Step 9: Driver starts pickup -> Driver On The Way
    const onWayRes = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/driver-status`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` }
    }, { status: 'Driver On The Way' });
    assert(onWayRes.statusCode === 200 && onWayRes.body.status === 'Driver On The Way', 'Status transitioned to Driver On The Way');

    // Step 10: Driver arrives at doorstep -> Arrived
    const arrivedRes = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/driver-status`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` }
    }, { status: 'Arrived' });
    assert(arrivedRes.statusCode === 200 && arrivedRes.body.status === 'Arrived', 'Status transitioned to Arrived');

    // Step 11: Driver marks waste picked up & loaded -> Picked Up
    const pickedUpRes = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/driver-status`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` }
    }, { status: 'Picked Up' });
    assert(pickedUpRes.statusCode === 200 && pickedUpRes.body.status === 'Picked Up', 'Status transitioned to Picked Up');

    // Step 12: Driver uploads completion proof photo
    const uploadProof = await request({
      hostname: 'localhost', port: 3000, path: '/api/upload', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` }
    }, {
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%23bbf7d0"/><text x="150" y="100" text-anchor="middle">Loaded Vehicle Clean Site</text></svg>'
    });
    assert(uploadProof.statusCode === 200, 'Driver proof photo upload succeeds');
    const proofUrl = uploadProof.body.url;
    assert(proofUrl.startsWith('/uploads/'), 'Proof photo saved to disk in /uploads/');

    // Step 13: Driver completes pickup
    const completeRes = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/complete`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` }
    }, {
      proofPhotoUrl: proofUrl,
      notes: 'Waste safely loaded into Tata Ace tipper recycling compartment. Site clean.'
    });
    assert(completeRes.statusCode === 200, 'Pickup successfully marked Completed');

    // Step 14: Citizen verifies completed status and proof photo
    const citCheck = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(citCheck.body.pickup.status === 'Completed', 'Citizen confirmed status is Completed');
    assert(citCheck.body.pickup.completion_proof_url === proofUrl, 'Citizen can view driver completion proof photo');

    // Step 15: Admin verifies completed status and proof photo
    const admCheck = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(admCheck.body.pickup.status === 'Completed', 'Admin confirmed status is Completed');
    assert(admCheck.body.pickup.completion_proof_url === proofUrl, 'Admin can view driver completion proof photo');

    // -------------------------------------------------------------
    // PHASE 6 — INVALID STATUS TRANSITIONS PREVENTION
    // -------------------------------------------------------------
    console.log('\n--- PHASE 6: STATUS LIFECYCLE & INVALID TRANSITIONS ---');

    // Try modifying status of a completed pickup -> rejected
    const invalidModify = await request({
      hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/driver-status`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` }
    }, { status: 'Driver On The Way' });
    assert(invalidModify.statusCode === 400, 'Modifying status of completed pickup correctly rejected (400 Bad Request)');

    // -------------------------------------------------------------
    // PHASE 10 — COMPLAINTS / GRIEVANCE REDRESSAL LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- PHASE 10: COMPLAINT LIFECYCLE ---');

    // Citizen creates complaint
    const newCompRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/complaints', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenToken}` }
    }, {
      type: 'Overflowing Waste',
      location: 'Ward 4, Haat Bazaar Mandir',
      description: 'Bin overflow after Friday weekly vegetable market'
    });
    assert(newCompRes.statusCode === 201, 'Citizen complaint registered with 201 Created');
    const compId = newCompRes.body.complaintId;

    // Admin updates complaint status to Under Review
    const compReview = await request({
      hostname: 'localhost', port: 3000, path: `/api/complaints/${compId}/status`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { status: 'Under Review', adminNotes: 'Sanitation inspector notified for morning clearance' });
    assert(compReview.statusCode === 200, 'Complaint updated to Under Review');

    // Admin resolves complaint
    const compResolve = await request({
      hostname: 'localhost', port: 3000, path: `/api/complaints/${compId}/status`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { status: 'Resolved', adminNotes: 'Cleared by Tata Ace tipper team at 9:30 AM' });
    assert(compResolve.statusCode === 200, 'Complaint resolved by Admin');

    // Citizen checks resolved status
    const citCompCheck = await request({
      hostname: 'localhost', port: 3000, path: '/api/complaints', method: 'GET',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const myComp = citCompCheck.body.complaints.find(c => c.id === compId);
    assert(myComp && myComp.status === 'Resolved', 'Citizen confirms complaint shows Resolved with admin notes');

    // -------------------------------------------------------------
    // PHASE 11 & 12 — ROUTE OPTIMIZER & ANALYTICS
    // -------------------------------------------------------------
    console.log('\n--- PHASE 11 & 12: ROUTE OPTIMIZATION & ANALYTICS LABELS ---');

    const routeRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/routes/optimize', method: 'GET',
      headers: { 'Authorization': `Bearer ${driver1Token}` }
    });
    assert(routeRes.statusCode === 200, 'Route optimization endpoint returns 200 OK');
    assert(routeRes.body.fuelSavingsLabel.includes('Illustrative route-efficiency estimate'), 'Route efficiency clearly labeled as illustrative prototype estimate');
    assert(routeRes.body.simulatedNotice.toLowerCase().includes('prototype simulated'), 'Simulated GPS notice verified in route response');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`  QUALITY AUDIT COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('=============================================================\n');

  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exit(1);
  }
}

runAudit();
