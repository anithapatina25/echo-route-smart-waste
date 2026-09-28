/**
 * ECHO ROUTE SMART WASTE - STAGE 7 NOTIFICATIONS CENTER TEST SUITE
 * Verifies unified notification APIs, user isolation, RBAC, unread counts,
 * mark-as-read, delete, and end-to-end event generation across workflows.
 */
const BASE_URL = 'http://localhost:5000';

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

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // text response
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('  ECHO ROUTE SMART WASTE - STAGE 7 NOTIFICATIONS TEST SUITE');
  console.log('================================================================');

  try {
    // -------------------------------------------------------------
    // [1. Authentication]
    // -------------------------------------------------------------
    console.log('\n[AUTH] Authenticating test accounts for Citizen, Driver, Admin...');
    const citizenLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'citizen@echoroute.gov.in', password: 'citizen123', portal: 'CITIZEN' })
    });
    assert(citizenLogin.status === 200, 'Citizen authenticated');
    const citizenToken = citizenLogin.data.data.token;
    const citizenUser = citizenLogin.data.data.user;

    const driverLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'driver@echoroute.gov.in', password: 'driver123', portal: 'DRIVER' })
    });
    assert(driverLogin.status === 200, 'Driver authenticated');
    const driverToken = driverLogin.data.data.token;
    const driverUser = driverLogin.data.data.user;

    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@echoroute.gov.in', password: 'admin123', portal: 'ADMIN' })
    });
    assert(adminLogin.status === 200, 'Admin authenticated');
    const adminToken = adminLogin.data.data.token;
    const adminUser = adminLogin.data.data.user;

    // -------------------------------------------------------------
    // [2. Security & Unauthenticated Access]
    // -------------------------------------------------------------
    console.log('\n[SECURITY] Testing Unauthenticated Access to Notifications API...');
    const unauthGet = await request('/api/notifications');
    assert(unauthGet.status === 401, 'Unauthenticated GET /api/notifications returns HTTP 401');

    const unauthCount = await request('/api/notifications/unread-count');
    assert(unauthCount.status === 401, 'Unauthenticated GET /api/notifications/unread-count returns HTTP 401');

    const unauthPatch = await request('/api/notifications/1/read', { method: 'PATCH' });
    assert(unauthPatch.status === 401, 'Unauthenticated PATCH /api/notifications/:id/read returns HTTP 401');

    // -------------------------------------------------------------
    // [3. Role & User Data Isolation]
    // -------------------------------------------------------------
    console.log('\n[ISOLATION] Testing Strict User Notification Data Isolation...');
    const citizenNotes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(citizenNotes.status === 200, 'Citizen GET /api/notifications returns HTTP 200');
    assert(Array.isArray(citizenNotes.data.data), 'Citizen notifications is an array');
    const citizenAllOwn = citizenNotes.data.data.every(n => n.user_id === citizenUser.id);
    assert(citizenAllOwn, 'Citizen only sees notifications matching their own user_id');

    const driverNotes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert(driverNotes.status === 200, 'Driver GET /api/notifications returns HTTP 200');
    const driverAllOwn = driverNotes.data.data.every(n => n.user_id === driverUser.id);
    assert(driverAllOwn, 'Driver only sees notifications matching their own user_id');

    const adminNotes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminNotes.status === 200, 'Admin GET /api/notifications returns HTTP 200');
    const adminAllOwn = adminNotes.data.data.every(n => n.user_id === adminUser.id);
    assert(adminAllOwn, 'Admin only sees notifications matching their own user_id');

    // -------------------------------------------------------------
    // [4. Unread Counts & Mark Read Operations]
    // -------------------------------------------------------------
    console.log('\n[READ OPS] Testing Unread Count and Read Operations...');
    const unreadCountRes = await request('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(unreadCountRes.status === 200, 'GET /api/notifications/unread-count returns HTTP 200');
    assert(typeof unreadCountRes.data.count === 'number', 'Unread count is a valid number');

    // Find or ensure an unread notification for citizen
    let targetNote = citizenNotes.data.data.find(n => !n.is_read);
    if (!targetNote && citizenNotes.data.data.length > 0) {
      targetNote = citizenNotes.data.data[0];
    }

    if (targetNote) {
      const markRes = await request(`/api/notifications/${targetNote.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${citizenToken}` }
      });
      assert(markRes.status === 200, `PATCH /api/notifications/${targetNote.id}/read returns HTTP 200`);
      assert(markRes.data.data.is_read === true, 'Notification marked as is_read: true');

      // Cross-user test: Driver attempts to mark citizen's notification as read
      const crossRead = await request(`/api/notifications/${targetNote.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      assert(crossRead.status === 403, 'Security Guard: Cross-user mark-as-read returns HTTP 403 Forbidden');

      // Cross-user test: Driver attempts to delete citizen's notification
      const crossDelete = await request(`/api/notifications/${targetNote.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      assert(crossDelete.status === 403, 'Security Guard: Cross-user delete returns HTTP 403 Forbidden');
    }

    // Test Mark All As Read
    const markAllRes = await request('/api/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(markAllRes.status === 200, 'PATCH /api/notifications/read-all returns HTTP 200');
    assert(markAllRes.data.unreadCount === 0, 'Unread count is 0 after mark-all-read');

    // -------------------------------------------------------------
    // [5. End-to-End Workflow Event Generation]
    // -------------------------------------------------------------
    console.log('\n[EVENTS] Testing End-to-End Workflow Event Notifications Generation...');

    // 1. Citizen books pickup
    const bookRes = await request('/api/citizen/pickups', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({
        waste_type: 'HOUSEHOLD',
        estimated_volume_bags: 2,
        scheduled_date: '2026-09-22',
        preferred_time: 'Morning (08:00 - 11:00)',
        address: 'Ward 4 Clean Lane #77',
        ward_number: 'Ward 4'
      })
    });
    assert(bookRes.status === 201, 'Citizen creates new pickup request (HTTP 201)');
    const createdPickup = bookRes.data.data;

    // Check Citizen received PICKUP_SUBMITTED notification
    const citizenLatest = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const subNote = citizenLatest.data.data.find(n => n.related_pickup_id === createdPickup.id || n.title.includes('Registered'));
    assert(Boolean(subNote), 'Citizen received pickup submission notification');
    assert(subNote?.notification_type === 'PICKUP_SUBMITTED', 'Notification type is PICKUP_SUBMITTED');

    // Check Admin received NEW_PICKUP_REQUEST notification
    const adminLatest = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminSubNote = adminLatest.data.data.find(n => n.related_pickup_id === createdPickup.id || n.message.includes(createdPickup.request_code));
    assert(Boolean(adminSubNote), 'Admin received NEW_PICKUP_REQUEST notification');
    assert(adminSubNote?.notification_type === 'NEW_PICKUP_REQUEST', 'Admin notification type is NEW_PICKUP_REQUEST');

    // 2. Admin verifies pickup
    const verifyRes = await request(`/api/admin/pickups/${createdPickup.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(verifyRes.status === 200, 'Admin verifies pickup request (HTTP 200)');

    // Check Citizen received PICKUP_VERIFIED
    const citizenAfterVerify = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const verifyNote = citizenAfterVerify.data.data.find(n => n.related_pickup_id === createdPickup.id && n.notification_type === 'PICKUP_VERIFIED');
    assert(Boolean(verifyNote), 'Citizen received PICKUP_VERIFIED notification');

    // 3. Admin assigns driver (Driver 1)
    const assignRes = await request(`/api/admin/pickups/${createdPickup.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ driver_id: 1 })
    });
    assert(assignRes.status === 200, 'Admin assigns pickup to driver (HTTP 200)');

    // Check Driver received NEW_ASSIGNMENT
    const driverAfterAssign = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    const driverAssignNote = driverAfterAssign.data.data.find(n => n.related_pickup_id === createdPickup.id && n.notification_type === 'NEW_ASSIGNMENT');
    assert(Boolean(driverAssignNote), 'Driver received NEW_ASSIGNMENT notification');

    // Check Citizen received DRIVER_ASSIGNED
    const citizenAfterAssign = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const citizenAssignNote = citizenAfterAssign.data.data.find(n => n.related_pickup_id === createdPickup.id && n.notification_type === 'DRIVER_ASSIGNED');
    assert(Boolean(citizenAssignNote), 'Citizen received DRIVER_ASSIGNED notification');

    // 4. Driver accepts assignment
    const acceptRes = await request(`/api/driver/pickups/${createdPickup.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert(acceptRes.status === 200, 'Driver accepts assignment (HTTP 200)');

    // Check Citizen received DRIVER_ACCEPTED
    const citizenAfterAccept = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const acceptNote = citizenAfterAccept.data.data.find(n => n.related_pickup_id === createdPickup.id && n.notification_type === 'DRIVER_ACCEPTED');
    assert(Boolean(acceptNote), 'Citizen received DRIVER_ACCEPTED notification');

    // 5. Driver updates status: START (EN_ROUTE)
    const startRes = await request(`/api/driver/pickups/${createdPickup.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ action: 'START' })
    });
    assert(startRes.status === 200, 'Driver marks START / EN_ROUTE (HTTP 200)');

    // Check Citizen received DRIVER_EN_ROUTE
    const citizenAfterStart = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const enRouteNote = citizenAfterStart.data.data.find(n => n.related_pickup_id === createdPickup.id && n.notification_type === 'DRIVER_EN_ROUTE');
    assert(Boolean(enRouteNote), 'Citizen received DRIVER_EN_ROUTE notification');

    // 6. Driver updates status: ARRIVED
    const arrivedRes = await request(`/api/driver/pickups/${createdPickup.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ action: 'ARRIVED' })
    });
    assert(arrivedRes.status === 200, 'Driver marks ARRIVED (HTTP 200)');

    // Check Citizen received DRIVER_ARRIVED
    const citizenAfterArrived = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const arrivedNote = citizenAfterArrived.data.data.find(n => n.related_pickup_id === createdPickup.id && n.notification_type === 'DRIVER_ARRIVED');
    assert(Boolean(arrivedNote), 'Citizen received DRIVER_ARRIVED notification');

    // 7. Driver updates status: PICKED_UP
    const pickedUpRes = await request(`/api/driver/pickups/${createdPickup.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ action: 'PICKED_UP' })
    });
    assert(pickedUpRes.status === 200, 'Driver marks PICKED_UP (HTTP 200)');

    // Check Citizen received PICKUP_COLLECTED
    const citizenAfterPickedUp = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const collectedNote = citizenAfterPickedUp.data.data.find(n => n.related_pickup_id === createdPickup.id && n.notification_type === 'PICKUP_COLLECTED');
    assert(Boolean(collectedNote), 'Citizen received PICKUP_COLLECTED notification');

    // 8. Driver completes with proof photo
    const sampleProofBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await request('/api/driver/upload-proof', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ photo_data: sampleProofBase64 })
    });
    assert(uploadRes.status === 200, 'Driver uploads proof photo (HTTP 200)');

    const completeRes = await request(`/api/driver/pickups/${createdPickup.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({
        proof_photo_url: uploadRes.data.proof_photo_url || uploadRes.data.data?.proof_photo_url,
        collected_weight_kg: 25.5,
        driver_notes: 'Stage 7 notification event verification test.'
      })
    });
    assert(completeRes.status === 200, 'Driver completes pickup with proof (HTTP 200)');

    // Check Citizen received PICKUP_COMPLETED
    const citizenAfterComplete = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const compNote = citizenAfterComplete.data.data.find(n => n.related_pickup_id === createdPickup.id && n.notification_type === 'PICKUP_COMPLETED');
    assert(Boolean(compNote), 'Citizen received PICKUP_COMPLETED notification');

    // Check Admin received PICKUP_COMPLETED
    const adminAfterComplete = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminCompNote = adminAfterComplete.data.data.find(n => n.related_pickup_id === createdPickup.id && n.notification_type === 'PICKUP_COMPLETED');
    assert(Boolean(adminCompNote), 'Admin received PICKUP_COMPLETED notification');

    // 9. Grievance Flow: Citizen files complaint
    const complaintRes = await request('/api/citizen/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({
        subject: 'Stage 7 Notification Grievance Verification',
        description: 'Testing complaint notification generation and activity feed integration.',
        complaint_type: 'Missed Pickup / Delay'
      })
    });
    assert(complaintRes.status === 201, 'Citizen files complaint (HTTP 201)');
    const complaint = complaintRes.data.data;

    // Check Admin received COMPLAINT_RECEIVED notification
    const adminAfterComplaint = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const compRecvNote = adminAfterComplaint.data.data.find(n => n.notification_type === 'COMPLAINT_RECEIVED');
    assert(Boolean(compRecvNote), 'Admin received COMPLAINT_RECEIVED notification');

    // Admin updates complaint status
    const updateCompRes = await request(`/api/admin/complaints/${complaint.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'RESOLVED', adminNotes: 'Verified and resolved in Stage 7.' })
    });
    assert(updateCompRes.status === 200, 'Admin resolves complaint (HTTP 200)');

    // Check Citizen received COMPLAINT_UPDATE
    const citizenAfterCompUpdate = await request('/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const compUpdateNote = citizenAfterCompUpdate.data.data.find(n => n.notification_type === 'COMPLAINT_UPDATE');
    assert(Boolean(compUpdateNote), 'Citizen received COMPLAINT_UPDATE notification');

    // -------------------------------------------------------------
    // [6. Admin Recent Activity Feed]
    // -------------------------------------------------------------
    console.log('\n[ACTIVITY] Testing Admin Recent Activity Feed...');
    const actRes = await request('/api/admin/activity?limit=10', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(actRes.status === 200, 'Admin GET /api/admin/activity returns HTTP 200');
    assert(Array.isArray(actRes.data.data), 'Activity feed returns an array');
    assert(actRes.data.data.length > 0, 'Activity feed has recent real events');
    const hasTitles = actRes.data.data.every(e => Boolean(e.title && e.created_at));
    assert(hasTitles, 'Activity feed items contain real title and timestamp');

    // Security check: Citizen attempting to call /api/admin/activity
    const citizenAct = await request('/api/admin/activity', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(citizenAct.status === 403, 'RBAC Block: Citizen calling /api/admin/activity returns HTTP 403 Forbidden');

    // -------------------------------------------------------------
    // [7. Delete Single Notification]
    // -------------------------------------------------------------
    console.log('\n[DELETE] Testing Notification Deletion...');
    const noteToDelete = citizenAfterCompUpdate.data.data[0];
    if (noteToDelete) {
      const delRes = await request(`/api/notifications/${noteToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${citizenToken}` }
      });
      assert(delRes.status === 200, `DELETE /api/notifications/${noteToDelete.id} returns HTTP 200`);

      // Deleting again should return 404
      const delAgain = await request(`/api/notifications/${noteToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${citizenToken}` }
      });
      assert(delAgain.status === 404, 'Deleting non-existent notification returns HTTP 404 Not Found');
    }

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  }

  console.log('================================================================');
  console.log(`  STAGE 7 SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
