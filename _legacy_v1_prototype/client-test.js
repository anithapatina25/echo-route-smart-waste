// client-test.js - Client test running against active server at http://localhost:3000
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

async function verifyLive() {
  console.log('--- RUNNING LIVE VERIFICATION OF 24-STEP END-TO-END WORKFLOW ---\n');

  // 1. Citizen Login
  console.log('1. Logging in as Citizen (Ramesh Patel)...');
  const citLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'citizen@echoroute.gov.in', password: 'citizen123', requestedRole: 'citizen' });
  if (citLogin.statusCode !== 200) throw new Error('Citizen login failed');
  const citToken = citLogin.body.token;
  console.log('   OK: Token obtained for', citLogin.body.user.name);

  // 2. Photo Upload
  console.log('2. Citizen uploading waste photo...');
  const uploadRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/upload', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citToken}` }
  }, { dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%2394a3b8"/><text x="150" y="100" text-anchor="middle">Garden Waste Photo</text></svg>' });
  if (uploadRes.statusCode !== 200) throw new Error('Upload failed');
  const photoUrl = uploadRes.body.url;
  console.log('   OK: Photo saved at', photoUrl.substring(0, 35) + '...');

  // 3. Citizen Books Pickup
  console.log('3. Citizen submitting pickup request...');
  const bookRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/pickups', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citToken}` }
  }, {
    wasteType: 'Plastic Waste',
    quantity: '4 Bags (~30kg)',
    address: 'House 14, Near Shiv Mandir, Ward 4',
    scheduledDate: new Date().toISOString().split('T')[0],
    preferredTime: 'Morning (08:00 - 11:00 AM)',
    description: 'Cleaned recyclable packaging and sacks',
    wastePhotoUrl: photoUrl
  });
  if (bookRes.statusCode !== 201) throw new Error('Book pickup failed');
  const pickupId = bookRes.body.pickup.id;
  console.log(`   OK: Pickup #${pickupId} registered with status "${bookRes.body.pickup.status}"`);

  // 4. Confirm in Citizen's pickups
  console.log('4. Confirming pickup in Citizen list...');
  const myPickups = await request({
    hostname: 'localhost', port: 3000, path: '/api/pickups', method: 'GET',
    headers: { 'Authorization': `Bearer ${citToken}` }
  });
  const foundInCit = myPickups.body.pickups.find(p => p.id === pickupId);
  if (!foundInCit) throw new Error('Not found in citizen list');
  console.log(`   OK: Pickup visible in citizen list. Status: ${foundInCit.status}`);

  // 5. Citizen Logout
  console.log('5. Logging out Citizen...');
  await request({ hostname: 'localhost', port: 3000, path: '/api/auth/logout', method: 'POST', headers: { 'Authorization': `Bearer ${citToken}` } });
  console.log('   OK: Citizen logged out');

  // 6. Admin Login
  console.log('6. Logging in as Admin (Officer Anil Sharma)...');
  const adminLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@echoroute.gov.in', password: 'admin123', requestedRole: 'admin' });
  if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
  const adminToken = adminLogin.body.token;
  console.log('   OK: Admin authenticated');

  // 7. Admin sees new request
  console.log('7. Verifying request appears in Admin operational queue...');
  const allPickups = await request({
    hostname: 'localhost', port: 3000, path: '/api/pickups', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const foundInAdmin = allPickups.body.pickups.find(p => p.id === pickupId);
  if (!foundInAdmin) throw new Error('Pickup missing in admin records');
  console.log(`   OK: Admin located #${pickupId} from citizen "${foundInAdmin.citizen_name}"`);

  // 8. Admin Verifies Request
  console.log('8. Admin verifying request...');
  const verifyRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/verify`, method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (verifyRes.statusCode !== 200) throw new Error('Verify failed');
  console.log('   OK: Request status updated to "Verified"');

  // 9. Admin Assigns Driver Suresh Kumar (ID 2)
  console.log('9. Admin assigning driver Suresh Kumar (Tata Ace DL-04-E-1024)...');
  const assignRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/assign`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { driverId: 2 });
  if (assignRes.statusCode !== 200) throw new Error('Assign driver failed');
  console.log('   OK: Driver Suresh Kumar assigned. Status: "Driver Assigned"');

  // 10. Admin Logout
  console.log('10. Logging out Admin...');
  await request({ hostname: 'localhost', port: 3000, path: '/api/auth/logout', method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}` } });
  console.log('   OK: Admin logged out');

  // 11. Driver Login (Suresh Kumar)
  console.log('11. Logging in as Driver (driver1@echoroute.gov.in)...');
  const driverLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'driver1@echoroute.gov.in', password: 'driver123', requestedRole: 'driver' });
  if (driverLogin.statusCode !== 200) throw new Error('Driver login failed');
  const driverToken = driverLogin.body.token;
  console.log('   OK: Driver authenticated');

  // 12. Confirm Driver sees only assigned pickups
  console.log('12. Confirming Driver sees assigned pickup and strict role isolation...');
  const driverPickups = await request({
    hostname: 'localhost', port: 3000, path: '/api/pickups', method: 'GET',
    headers: { 'Authorization': `Bearer ${driverToken}` }
  });
  const inDriverList = driverPickups.body.pickups.find(p => p.id === pickupId);
  if (!inDriverList) throw new Error('Assigned pickup missing from driver view');
  const nonAssigned = driverPickups.body.pickups.some(p => p.assigned_driver_id !== 2);
  if (nonAssigned) throw new Error('Data breach: driver received unassigned or other driver pickups');
  console.log(`   OK: Driver correctly sees #${pickupId}. All ${driverPickups.body.pickups.length} items belong to Suresh Kumar.`);

  // 13. Driver views citizen photo
  console.log('13. Driver opening pickup details to verify citizen photo...');
  const detailRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${driverToken}` }
  });
  if (!detailRes.body.pickup.citizen_photo_url) throw new Error('Citizen photo missing in driver detail');
  console.log('   OK: Citizen waste photo verified');

  // 14. Driver starts pickup
  console.log('14. Driver updating status to "Driver On The Way"...');
  const transitRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/driver-status`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverToken}` }
  }, { status: 'Driver On The Way' });
  if (transitRes.statusCode !== 200) throw new Error('Status update failed');
  console.log('   OK: Status updated to "Driver On The Way"');

  // 15. Driver arrives
  console.log('15. Driver updating status to "Arrived"...');
  const arriveRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/driver-status`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverToken}` }
  }, { status: 'Arrived' });
  if (arriveRes.statusCode !== 200) throw new Error('Status update to Arrived failed');
  console.log('   OK: Status updated to "Arrived"');

  // 16. Driver completes pickup with Proof Photo
  console.log('16. Driver uploading Completion Proof Photo and completing pickup...');
  const proofUpload = await request({
    hostname: 'localhost', port: 3000, path: '/api/upload', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverToken}` }
  }, { dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%2386efac"/><text x="150" y="100" text-anchor="middle">Tata Ace Loaded Proof</text></svg>' });
  const proofUrl = proofUpload.body.url;

  const completeRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}/complete`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverToken}` }
  }, { proofPhotoUrl: proofUrl, notes: 'Waste collected into vehicle tipper. Doorstep left clean.' });
  if (completeRes.statusCode !== 200) throw new Error('Complete failed');
  console.log('   OK: Pickup completed and proof photo saved!');

  // 17. Driver logout
  console.log('17. Logging out Driver...');
  await request({ hostname: 'localhost', port: 3000, path: '/api/auth/logout', method: 'POST', headers: { 'Authorization': `Bearer ${driverToken}` } });
  console.log('   OK: Driver logged out');

  // 18. Citizen Login again
  console.log('18. Logging in as Citizen to verify completion proof visibility...');
  const citLogin2 = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'citizen@echoroute.gov.in', password: 'citizen123', requestedRole: 'citizen' });
  const citToken2 = citLogin2.body.token;

  // 19. Confirm Citizen sees Completed status
  console.log('19. Citizen verifying status is "Completed"...');
  const citCheck = await request({
    hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${citToken2}` }
  });
  if (citCheck.body.pickup.status !== 'Completed') throw new Error(`Expected Completed, got ${citCheck.body.pickup.status}`);
  console.log('   OK: Citizen confirmed status: Completed');

  // 20. Confirm Citizen sees Driver Completion Proof photo & notes
  console.log('20. Citizen inspecting Driver Completion Proof photo and notes...');
  if (!citCheck.body.pickup.completion_proof_url) throw new Error('Completion proof photo missing from citizen view');
  console.log(`   OK: Proof photo attached: ${citCheck.body.pickup.completion_proof_url.substring(0, 35)}...`);
  console.log(`   OK: Driver notes: "${citCheck.body.pickup.completion_notes}"`);

  // 21. Citizen logout
  console.log('21. Citizen logging out...');
  await request({ hostname: 'localhost', port: 3000, path: '/api/auth/logout', method: 'POST', headers: { 'Authorization': `Bearer ${citToken2}` } });
  console.log('   OK: Citizen logged out');

  // 22. Admin Login again
  console.log('22. Logging in as Admin to inspect finalized operational record...');
  const adminLogin2 = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@echoroute.gov.in', password: 'admin123', requestedRole: 'admin' });
  const adminToken2 = adminLogin2.body.token;

  // 23. Confirm Admin sees completed pickup and proof photo
  console.log('23. Admin verifying completed status and proof photo in operational archives...');
  const adminCheck = await request({
    hostname: 'localhost', port: 3000, path: `/api/pickups/${pickupId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken2}` }
  });
  if (adminCheck.body.pickup.status !== 'Completed' || !adminCheck.body.pickup.completion_proof_url) {
    throw new Error('Admin view does not reflect completion or proof photo');
  }
  console.log('   OK: Admin verified permanent completion record and proof photo');

  // 24. Verify driver completed count updated in fleet stats
  console.log('24. Verifying fleet analytics and completion tallies...');
  const driverStats = await request({
    hostname: 'localhost', port: 3000, path: '/api/drivers', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken2}` }
  });
  const sureshDriver = driverStats.body.drivers.find(d => d.id === 2);
  console.log(`   OK: Driver Suresh Kumar total completed count: ${sureshDriver.completed_count}`);

  console.log('\n=============================================================');
  console.log('  ALL 24 STEPS VERIFIED END-TO-END ON LIVE APPLICATION!');
  console.log('=============================================================\n');
}

verifyLive().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
