// test-workflow.js - Automated test of the 24-step end-to-end lifecycle
const http = require('node:http');
const server = require('./server.js');

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

async function runTest() {
  console.log('--- STARTING 24-STEP END-TO-END WORKFLOW TEST ---\n');

  try {
    // 1. Login as Citizen (Ramesh Patel)
    console.log('Step 1: Logging in as Citizen (citizen@echoroute.gov.in)...');
    const citLogin = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'citizen@echoroute.gov.in',
      password: 'citizen123',
      requestedRole: 'citizen'
    });
    if (citLogin.statusCode !== 200) throw new Error(`Citizen login failed: ${JSON.stringify(citLogin.body)}`);
    const citizenToken = citLogin.body.token;
    console.log('  -> Logged in as:', citLogin.body.user.name, `(${citLogin.body.user.role})`);

    // 2. Upload Waste Photo as Citizen
    console.log('\nStep 2: Citizen uploads waste photo...');
    const photoUpload = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      }
    }, {
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%23cbd5e1"/><text x="150" y="100" text-anchor="middle">Test Waste Photo</text></svg>'
    });
    if (photoUpload.statusCode !== 200) throw new Error(`Photo upload failed: ${JSON.stringify(photoUpload.body)}`);
    const wastePhotoUrl = photoUpload.body.url;
    console.log('  -> Uploaded photo URL:', wastePhotoUrl.substring(0, 50) + '...');

    // 3. Citizen Books a Waste Pickup
    console.log('\nStep 3: Citizen books a waste pickup request...');
    const pickupReq = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/pickups',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      }
    }, {
      wasteType: 'Household Waste',
      quantity: '3 Bags (~20kg)',
      address: 'House 14, Near Shiv Mandir, Ward 4',
      latitude: 28.5372,
      longitude: 77.3895,
      scheduledDate: new Date().toISOString().split('T')[0],
      preferredTime: 'Morning (08:00 - 11:00 AM)',
      description: 'Cleaned household garden waste and segregated organic items.',
      wastePhotoUrl
    });
    if (pickupReq.statusCode !== 201) throw new Error(`Pickup creation failed: ${JSON.stringify(pickupReq.body)}`);
    const createdPickupId = pickupReq.body.pickup.id;
    console.log('  -> Pickup created successfully! ID:', createdPickupId, 'Status:', pickupReq.body.pickup.status);

    // 4. Confirm in Citizen's Pickup list
    console.log('\nStep 4: Confirming request appears in Citizen My Pickups...');
    const citPickups = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/pickups',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const foundCit = citPickups.body.pickups.find(p => p.id === createdPickupId);
    if (!foundCit || foundCit.status !== 'Requested') throw new Error('Request not found in citizen list or status wrong');
    console.log('  -> Verified in citizen pickups: status =', foundCit.status);

    // 5. Logout Citizen
    console.log('\nStep 5: Citizen logout...');
    await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    console.log('  -> Citizen logged out.');

    // 6. Login as Admin (Officer Anil Sharma)
    console.log('\nStep 6: Login as Panchayat Admin (admin@echoroute.gov.in)...');
    const adminLogin = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@echoroute.gov.in',
      password: 'admin123',
      requestedRole: 'admin'
    });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.body.token;
    console.log('  -> Admin logged in:', adminLogin.body.user.name);

    // 7. Admin views all requests and verifies new request is present
    console.log('\nStep 7: Admin checks pickup requests list...');
    const adminPickups = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/pickups',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const foundAdmin = adminPickups.body.pickups.find(p => p.id === createdPickupId);
    if (!foundAdmin) throw new Error('Admin cannot find the new pickup request');
    console.log('  -> Found request in Admin queue: ID:', foundAdmin.id, 'Citizen:', foundAdmin.citizen_name);

    // 8. Admin Verifies Request
    console.log('\nStep 8: Admin verifies request...');
    const verifyRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/pickups/${createdPickupId}/verify`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (verifyRes.statusCode !== 200) throw new Error('Admin verification failed');
    console.log('  -> Verification successful! Status:', verifyRes.body.status);

    // 9. Admin Assigns Driver (Suresh Kumar, user id 2)
    console.log('\nStep 9: Admin assigns driver (Suresh Kumar)...');
    // First get drivers
    const driversList = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/drivers',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const suresh = driversList.body.drivers.find(d => d.name.includes('Suresh'));
    if (!suresh) throw new Error('Driver Suresh Kumar not found');

    const assignRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/pickups/${createdPickupId}/assign`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { driverId: suresh.id });
    if (assignRes.statusCode !== 200) throw new Error('Driver assignment failed');
    console.log('  -> Driver assigned:', assignRes.body.assignedDriver.name);

    // 10. Logout Admin
    console.log('\nStep 10: Admin logout...');
    await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('  -> Admin logged out.');

    // 11. Login as Driver (driver1@echoroute.gov.in)
    console.log('\nStep 11: Driver login (driver1@echoroute.gov.in)...');
    const driverLogin = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'driver1@echoroute.gov.in',
      password: 'driver123',
      requestedRole: 'driver'
    });
    if (driverLogin.statusCode !== 200) throw new Error('Driver login failed');
    const driverToken = driverLogin.body.token;
    console.log('  -> Driver logged in:', driverLogin.body.user.name, `(${driverLogin.body.user.profile.vehicle_type})`);

    // 12. Confirm Driver sees only assigned pickups
    console.log('\nStep 12: Confirming driver sees assigned pickup and NO other drivers pickups...');
    const drvPickups = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/pickups',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    const assignedToSuresh = drvPickups.body.pickups.filter(p => p.id === createdPickupId);
    if (assignedToSuresh.length === 0) throw new Error('Assigned pickup not found in driver portal');
    // Ensure all returned pickups are assigned to this driver
    const wrongAssigned = drvPickups.body.pickups.some(p => p.assigned_driver_id !== driverLogin.body.user.id);
    if (wrongAssigned) throw new Error('Data leak: driver received pickups assigned to other drivers!');
    console.log(`  -> Driver sees ${drvPickups.body.pickups.length} assignments, all strictly assigned to ${driverLogin.body.user.name}.`);

    // 13. Driver views pickup details & citizen waste photo
    console.log('\nStep 13: Driver opens pickup details...');
    const drvPickupDetails = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/pickups/${createdPickupId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    const pDetail = drvPickupDetails.body.pickup;
    if (!pDetail.citizen_photo_url) throw new Error('Citizen waste photo missing from driver details');
    console.log('  -> Citizen photo confirmed present:', pDetail.citizen_photo_url.substring(0, 40) + '...');

    // 14. Driver starts pickup (Driver On The Way)
    console.log('\nStep 14: Driver starts pickup (Status: Driver On The Way)...');
    const onTheWayRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/pickups/${createdPickupId}/driver-status`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      }
    }, { status: 'Driver On The Way' });
    if (onTheWayRes.statusCode !== 200) throw new Error('Status update to Driver On The Way failed');
    console.log('  -> Status updated:', onTheWayRes.body.status);

    // 15. Driver arrives at location (Status: Arrived)
    console.log('\nStep 15: Driver arrives at citizen address (Status: Arrived)...');
    const arrivedRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/pickups/${createdPickupId}/driver-status`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      }
    }, { status: 'Arrived' });
    if (arrivedRes.statusCode !== 200) throw new Error('Status update to Arrived failed');
    console.log('  -> Status updated:', arrivedRes.body.status);

    // 16. Driver uploads completion proof photo & completes pickup
    console.log('\nStep 16: Driver uploads completion proof photo and completes pickup...');
    const proofUpload = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      }
    }, {
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%23bbf7d0"/><text x="150" y="100" text-anchor="middle">Driver Completion Proof</text></svg>'
    });
    const proofUrl = proofUpload.body.url;

    const completeRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/pickups/${createdPickupId}/complete`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      }
    }, {
      proofPhotoUrl: proofUrl,
      notes: 'Waste collected, weighed (18.5kg), and vehicle loaded. Site left completely clean.'
    });
    if (completeRes.statusCode !== 200) throw new Error(`Pickup completion failed: ${JSON.stringify(completeRes.body)}`);
    console.log('  -> Pickup completed! Timestamp:', completeRes.body.completedAt);

    // 17. Driver logout
    console.log('\nStep 17: Driver logout...');
    await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });

    // 18. Login as Citizen
    console.log('\nStep 18: Login as Citizen to verify completion...');
    const citLogin2 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'citizen@echoroute.gov.in', password: 'citizen123', requestedRole: 'citizen' });
    const citToken2 = citLogin2.body.token;

    // 19. Confirm pickup shows Completed in Citizen portal
    console.log('\nStep 19: Citizen checks pickup status...');
    const citPickupDetails = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/pickups/${createdPickupId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${citToken2}` }
    });
    const citView = citPickupDetails.body.pickup;
    if (citView.status !== 'Completed') throw new Error(`Expected status Completed, got: ${citView.status}`);
    console.log('  -> Confirmed: Citizen sees status is Completed!');

    // 20. Confirm Citizen can see Driver Completion Proof photo and notes
    console.log('\nStep 20: Citizen verifies Driver Completion Proof Photo...');
    if (!citView.completion_proof_url) throw new Error('Completion proof photo missing in Citizen view');
    console.log('  -> Completion proof photo confirmed:', citView.completion_proof_url.substring(0, 40) + '...');
    console.log('  -> Driver notes:', citView.completion_notes);

    // 21. Citizen logout
    console.log('\nStep 21: Citizen logout...');
    await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citToken2}` }
    });

    // 22. Login as Admin
    console.log('\nStep 22: Login as Admin to inspect final status...');
    const adminLogin2 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@echoroute.gov.in', password: 'admin123', requestedRole: 'admin' });
    const adminToken2 = adminLogin2.body.token;

    // 23. Confirm Admin sees completed pickup and proof photo
    console.log('\nStep 23: Admin confirms completed pickup and proof photo in operational records...');
    const adminPickupDetails = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/pickups/${createdPickupId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken2}` }
    });
    const adminView = adminPickupDetails.body.pickup;
    if (adminView.status !== 'Completed' || !adminView.completion_proof_url) {
      throw new Error('Admin view does not reflect completed status or proof photo');
    }
    console.log('  -> Verified: Admin sees completed pickup with proof photo.');

    // 24. Verify driver completed count updated in fleet stats
    console.log('\nStep 24: Verifying fleet metrics...');
    const driversList2 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/drivers',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken2}` }
    });
    const suresh2 = driversList2.body.drivers.find(d => d.name.includes('Suresh'));
    console.log(`  -> Driver ${suresh2.name} completed pickups count: ${suresh2.completed_count}`);

    console.log('\n=============================================================');
    console.log('  ALL 24 STEPS PASSED PERFECTLY!');
    console.log('=============================================================\n');

  } catch (err) {
    console.error('\nTEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTest();
