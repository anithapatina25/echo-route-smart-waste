// api.js - REST API Route Handlers for ECHO ROUTE SMART WASTE
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  db,
  hashPassword,
  getUserByEmail,
  getUserById,
  getCitizenProfile,
  getDriverProfile,
  UPLOADS_DIR
} = require('./db.js');
const { createSession, destroySession, authenticate, extractToken } = require('./auth.js');

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper to read JSON request body
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Safety limit: 20MB for image data
      if (body.length > 20 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Add notification helper
function addNotification(userId, title, message, type = 'info', link = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userId, title, message, type, link);
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

// Route dispatcher
async function handleApiRequest(req, res, pathname) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const session = authenticate(req);

  try {
    // ==========================================
    // AUTHENTICATION ROUTES
    // ==========================================
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password, requestedRole } = await readJsonBody(req);
      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password are required' });
      }

      const user = getUserByEmail(email);
      if (!user) {
        return sendJson(res, 401, { error: 'Invalid email or password' });
      }

      const inputHash = hashPassword(password);
      if (user.password_hash !== inputHash) {
        return sendJson(res, 401, { error: 'Invalid email or password' });
      }

      // Optional check if user selected specific portal role tab
      if (requestedRole && requestedRole !== user.role) {
        return sendJson(res, 403, {
          error: `This account is registered as a ${user.role.toUpperCase()}, not ${requestedRole.toUpperCase()}. Please switch to the ${user.role.toUpperCase()} portal.`
        });
      }

      const newSession = createSession(user);
      const profile = user.role === 'citizen' ? getCitizenProfile(user.id) :
                      user.role === 'driver' ? getDriverProfile(user.id) : null;

      return sendJson(res, 200, {
        message: 'Login successful',
        token: newSession.token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone,
          profile
        }
      });
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const token = extractToken(req);
      destroySession(token);
      return sendJson(res, 200, { message: 'Logged out successfully' });
    }

    if (pathname === '/api/auth/me' && req.method === 'GET') {
      if (!session) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }
      const user = getUserById(session.userId);
      if (!user) {
        return sendJson(res, 404, { error: 'User not found' });
      }
      const profile = user.role === 'citizen' ? getCitizenProfile(user.id) :
                      user.role === 'driver' ? getDriverProfile(user.id) : null;
      return sendJson(res, 200, {
        user: {
          ...user,
          profile
        }
      });
    }

    // All routes below require valid session
    if (!session) {
      return sendJson(res, 401, { error: 'Authentication required. Please log in.' });
    }

    // ==========================================
    // IMAGE UPLOAD ROUTE
    // ==========================================
    if (pathname === '/api/upload' && req.method === 'POST') {
      const { dataUrl, filename } = await readJsonBody(req);
      if (!dataUrl) {
        return sendJson(res, 400, { error: 'dataUrl is required' });
      }

      // If dataUrl matches data:image/...;base64,...
      const match = dataUrl.match(/^data:image\/([a-zA-Z0-9\+\.]+);base64,(.+)$/);
      if (match) {
        let ext = match[1].toLowerCase();
        if (ext === 'jpeg') ext = 'jpg';
        if (ext.includes('svg')) ext = 'svg';
        const base64Data = match[2];
        const cleanName = `img-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, cleanName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        return sendJson(res, 200, {
          url: `/uploads/${cleanName}`,
          filename: cleanName
        });
      } else if (dataUrl.startsWith('data:image/svg+xml')) {
        // SVG Data URI (URL encoded or raw)
        let svgContent = '';
        if (dataUrl.includes(';base64,')) {
          svgContent = Buffer.from(dataUrl.split(';base64,')[1], 'base64').toString('utf-8');
        } else {
          svgContent = decodeURIComponent(dataUrl.replace(/^data:image\/svg\+xml;?(?:utf8)?,/, ''));
        }
        const cleanName = `img-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.svg`;
        const filePath = path.join(UPLOADS_DIR, cleanName);
        fs.writeFileSync(filePath, svgContent, 'utf-8');
        return sendJson(res, 200, {
          url: `/uploads/${cleanName}`,
          filename: cleanName
        });
      } else {
        return sendJson(res, 400, { error: 'Invalid image format. Expected base64 or SVG data URL.' });
      }
    }

    // ==========================================
    // PICKUP REQUEST ROUTES
    // ==========================================
    // GET /api/pickups
    if (pathname === '/api/pickups' && req.method === 'GET') {
      let query = `
        SELECT p.*,
               u_cit.name as citizen_name, u_cit.phone as citizen_phone, u_cit.email as citizen_email,
               cp.village_ward as citizen_ward,
               u_drv.name as driver_name, u_drv.phone as driver_phone,
               dp.vehicle_number, dp.vehicle_type
        FROM pickup_requests p
        JOIN users u_cit ON p.citizen_id = u_cit.id
        LEFT JOIN citizen_profiles cp ON u_cit.id = cp.user_id
        LEFT JOIN users u_drv ON p.assigned_driver_id = u_drv.id
        LEFT JOIN driver_profiles dp ON u_drv.id = dp.user_id
      `;

      let params = [];

      // Role-based filtering
      if (session.role === 'citizen') {
        query += ' WHERE p.citizen_id = ? ORDER BY p.created_at DESC';
        params.push(session.userId);
      } else if (session.role === 'driver') {
        query += ' WHERE p.assigned_driver_id = ? ORDER BY p.created_at DESC';
        params.push(session.userId);
      } else if (session.role === 'admin') {
        query += ' ORDER BY p.created_at DESC';
      } else {
        return sendJson(res, 403, { error: 'Forbidden' });
      }

      const pickups = db.prepare(query).all(...params);
      return sendJson(res, 200, { pickups });
    }

    // POST /api/pickups (Citizen creates request)
    if (pathname === '/api/pickups' && req.method === 'POST') {
      if (session.role !== 'citizen') {
        return sendJson(res, 403, { error: 'Only citizens can create pickup requests' });
      }

      const body = await readJsonBody(req);
      const {
        wasteType,
        quantity,
        address,
        latitude,
        longitude,
        scheduledDate,
        preferredTime,
        description,
        wastePhotoUrl
      } = body;

      if (!wasteType || !quantity || !address || !scheduledDate || !preferredTime) {
        return sendJson(res, 400, { error: 'Missing required fields for pickup request' });
      }

      // Generate unique Request ID: ER-2026-XXXX
      const countRow = db.prepare('SELECT count(*) as c FROM pickup_requests').get();
      const nextSeq = String(countRow.c + 1).padStart(4, '0');
      const requestId = `ER-2026-${nextSeq}`;

      const lat = latitude || (28.5350 + (Math.random() - 0.5) * 0.02);
      const lng = longitude || (77.3900 + (Math.random() - 0.5) * 0.02);

      const stmt = db.prepare(`
        INSERT INTO pickup_requests (
          id, citizen_id, waste_type, quantity, address, latitude, longitude,
          scheduled_date, preferred_time, description, status, citizen_photo_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Requested', ?)
      `);

      stmt.run(
        requestId,
        session.userId,
        wasteType,
        quantity,
        address,
        lat,
        lng,
        scheduledDate,
        preferredTime,
        description || '',
        wastePhotoUrl || null
      );

      // Notification to citizen
      addNotification(
        session.userId,
        'Pickup Request Submitted',
        `Your request #${requestId} for ${wasteType} (${quantity}) has been registered and sent for verification.`,
        'info',
        `#track-${requestId}`
      );

      // Notification to Admins
      const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
      for (const admin of admins) {
        addNotification(
          admin.id,
          'New Pickup Request',
          `${session.name} submitted request #${requestId} (${wasteType}, ${quantity}) in ${address}.`,
          'warning',
          `#requests`
        );
      }

      const created = db.prepare('SELECT * FROM pickup_requests WHERE id = ?').get(requestId);
      return sendJson(res, 201, {
        message: 'Pickup request submitted successfully',
        pickup: created
      });
    }

    // Single pickup routes: /api/pickups/:id...
    const pickupMatch = pathname.match(/^\/api\/pickups\/([A-Za-z0-9\-]+)(?:\/(.*))?$/);
    if (pickupMatch) {
      const pickupId = pickupMatch[1];
      const subAction = pickupMatch[2]; // e.g. 'verify', 'assign', 'driver-status', 'complete'

      const pickup = db.prepare(`
        SELECT p.*,
               u_cit.name as citizen_name, u_cit.phone as citizen_phone, u_cit.email as citizen_email,
               cp.village_ward as citizen_ward,
               u_drv.name as driver_name, u_drv.phone as driver_phone,
               dp.vehicle_number, dp.vehicle_type
        FROM pickup_requests p
        JOIN users u_cit ON p.citizen_id = u_cit.id
        LEFT JOIN citizen_profiles cp ON u_cit.id = cp.user_id
        LEFT JOIN users u_drv ON p.assigned_driver_id = u_drv.id
        LEFT JOIN driver_profiles dp ON u_drv.id = dp.user_id
        WHERE p.id = ?
      `).get(pickupId);

      if (!pickup) {
        return sendJson(res, 404, { error: 'Pickup request not found' });
      }

      // Check access permission
      if (session.role === 'citizen' && pickup.citizen_id !== session.userId) {
        return sendJson(res, 403, { error: 'Access denied to this pickup request' });
      }
      if (session.role === 'driver' && pickup.assigned_driver_id !== session.userId) {
        return sendJson(res, 403, { error: 'Access denied: pickup is not assigned to you' });
      }

      // GET /api/pickups/:id
      if (!subAction && req.method === 'GET') {
        return sendJson(res, 200, { pickup });
      }

      // PUT /api/pickups/:id/verify (Admin verifies request)
      if (subAction === 'verify' && req.method === 'PUT') {
        if (session.role !== 'admin') {
          return sendJson(res, 403, { error: 'Only Panchayat Admins can verify requests' });
        }
        if (pickup.status !== 'Requested') {
          return sendJson(res, 400, { error: `Only requests in 'Requested' status can be verified. Current status: ${pickup.status}` });
        }

        db.prepare("UPDATE pickup_requests SET status = 'Verified', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(pickupId);

        addNotification(
          pickup.citizen_id,
          'Request Verified',
          `Your waste pickup #${pickupId} has been verified by Panchayat officials and queued for driver assignment.`,
          'info',
          `#track-${pickupId}`
        );

        return sendJson(res, 200, { message: 'Pickup request verified successfully', status: 'Verified' });
      }

      // PUT /api/pickups/:id/assign (Admin assigns driver)
      if (subAction === 'assign' && req.method === 'PUT') {
        if (session.role !== 'admin') {
          return sendJson(res, 403, { error: 'Only Panchayat Admins can assign drivers' });
        }
        if (pickup.status === 'Completed' || pickup.status === 'Cancelled') {
          return sendJson(res, 400, { error: `Cannot assign driver to a ${pickup.status.toLowerCase()} pickup request` });
        }

        const { driverId } = await readJsonBody(req);
        if (!driverId) {
          return sendJson(res, 400, { error: 'driverId is required' });
        }

        const driverUser = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'driver'").get(driverId);
        if (!driverUser) {
          return sendJson(res, 404, { error: 'Driver not found' });
        }

        const driverProf = getDriverProfile(driverId);
        if (!driverProf || driverProf.is_active !== 1) {
          return sendJson(res, 400, { error: 'Selected driver is currently inactive or off duty. Only active drivers can be assigned.' });
        }

        db.prepare(`
          UPDATE pickup_requests
          SET assigned_driver_id = ?, status = 'Driver Assigned', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(driverId, pickupId);

        // Notify Driver
        addNotification(
          driverId,
          'New Pickup Assigned',
          `You have been assigned pickup #${pickupId} (${pickup.waste_type}, ${pickup.quantity}) at ${pickup.address}.`,
          'warning',
          `#pickup-${pickupId}`
        );

        // Notify Citizen
        addNotification(
          pickup.citizen_id,
          'Driver Assigned',
          `Driver ${driverUser.name} (${driverProf ? driverProf.vehicle_type : 'Collection Vehicle'}) has been assigned to your pickup #${pickupId}.`,
          'info',
          `#track-${pickupId}`
        );

        return sendJson(res, 200, {
          message: 'Driver assigned successfully',
          assignedDriver: { id: driverUser.id, name: driverUser.name }
        });
      }

      // PUT /api/pickups/:id/accept (Driver accepts assignment)
      if (subAction === 'accept' && req.method === 'PUT') {
        if (session.role !== 'driver') {
          return sendJson(res, 403, { error: 'Only the assigned driver can accept this pickup' });
        }
        if (pickup.status !== 'Driver Assigned') {
          return sendJson(res, 400, { error: `Cannot accept pickup in "${pickup.status}" status` });
        }

        db.prepare("UPDATE pickup_requests SET accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(pickupId);

        const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
        for (const admin of admins) {
          addNotification(
            admin.id,
            'Assignment Accepted',
            `Driver ${session.name} acknowledged and accepted assignment for #${pickupId}.`,
            'info',
            '#requests'
          );
        }

        return sendJson(res, 200, { message: 'Assignment accepted by driver', acceptedAt: new Date().toISOString() });
      }

      // PUT /api/pickups/:id/driver-status (Driver updates progress: Driver On The Way, Arrived, Picked Up)
      if (subAction === 'driver-status' && req.method === 'PUT') {
        if (session.role !== 'driver') {
          return sendJson(res, 403, { error: 'Only the assigned driver can update transit status' });
        }
        if (pickup.status === 'Completed' || pickup.status === 'Cancelled') {
          return sendJson(res, 400, { error: `Cannot modify status of a ${pickup.status.toLowerCase()} pickup` });
        }

        const { status } = await readJsonBody(req);
        const validStatuses = ['Driver Assigned', 'Driver On The Way', 'Arrived', 'Picked Up'];
        if (!validStatuses.includes(status)) {
          return sendJson(res, 400, { error: `Invalid driver status: ${status}` });
        }

        // Enforce sequential lifecycle transitions
        const allowedTransitions = {
          'Driver Assigned': ['Driver On The Way'],
          'Driver On The Way': ['Arrived'],
          'Arrived': ['Picked Up']
        };

        if (allowedTransitions[pickup.status] && !allowedTransitions[pickup.status].includes(status)) {
          return sendJson(res, 400, {
            error: `Invalid transition from "${pickup.status}" to "${status}". Next expected step: ${allowedTransitions[pickup.status].join(', ')}`
          });
        }

        db.prepare("UPDATE pickup_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, pickupId);

        let notifMsg = `Driver ${session.name} status updated to: ${status}.`;
        if (status === 'Driver On The Way') notifMsg = `Driver ${session.name} is on the way to collect your waste.`;
        if (status === 'Arrived') notifMsg = `Driver ${session.name} has arrived at your address.`;
        if (status === 'Picked Up') notifMsg = `Driver ${session.name} has loaded your segregated waste into the collection vehicle.`;

        addNotification(
          pickup.citizen_id,
          `Pickup Status: ${status}`,
          notifMsg,
          'info',
          `#track-${pickupId}`
        );

        return sendJson(res, 200, { message: 'Status updated', status });
      }

      // POST /api/pickups/:id/complete (Driver uploads completion proof & completes pickup)
      if (subAction === 'complete' && req.method === 'POST') {
        if (session.role !== 'driver') {
          return sendJson(res, 403, { error: 'Only the assigned driver can complete the pickup' });
        }
        if (pickup.status === 'Completed') {
          return sendJson(res, 400, { error: 'Pickup request is already completed' });
        }
        if (pickup.status !== 'Arrived' && pickup.status !== 'Picked Up') {
          return sendJson(res, 400, {
            error: `Driver must arrive and pick up waste before completing. Current status is "${pickup.status}".`
          });
        }

        const { proofPhotoUrl, notes } = await readJsonBody(req);
        if (!proofPhotoUrl) {
          return sendJson(res, 400, { error: 'Completion proof photo is required to complete the pickup' });
        }

        db.prepare(`
          UPDATE pickup_requests
          SET status = 'Completed',
              completion_proof_url = ?,
              completion_notes = ?,
              completed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(proofPhotoUrl, notes || 'Waste safely collected and loaded.', pickupId);

        // Notify Citizen
        addNotification(
          pickup.citizen_id,
          'Pickup Completed!',
          `Your waste pickup #${pickupId} has been completed by driver ${session.name}. Completion proof photo is now available.`,
          'success',
          `#track-${pickupId}`
        );

        // Notify Admins
        const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
        for (const admin of admins) {
          addNotification(
            admin.id,
            'Pickup Completed',
            `Driver ${session.name} completed pickup #${pickupId} (${pickup.waste_type}). Proof photo uploaded.`,
            'success',
            `#requests`
          );
        }

        return sendJson(res, 200, {
          message: 'Pickup marked as Completed with proof photo',
          completedAt: new Date().toISOString()
        });
      }
    }

    // ==========================================
    // DRIVER FLEET MANAGEMENT ROUTES
    // ==========================================
    if (pathname === '/api/drivers' && req.method === 'GET') {
      if (session.role !== 'admin') {
        return sendJson(res, 403, { error: 'Only admins can view the driver roster' });
      }

      const drivers = db.prepare(`
        SELECT u.id, u.name, u.email, u.phone, u.created_at,
               dp.vehicle_number, dp.vehicle_type, dp.license_number, dp.is_active,
               dp.current_lat, dp.current_lng,
               (SELECT COUNT(*) FROM pickup_requests p WHERE p.assigned_driver_id = u.id AND p.status != 'Completed' AND p.status != 'Cancelled') as active_assignments,
               (SELECT COUNT(*) FROM pickup_requests p WHERE p.assigned_driver_id = u.id AND p.status = 'Completed') as completed_count
        FROM users u
        JOIN driver_profiles dp ON u.id = dp.user_id
        WHERE u.role = 'driver'
        ORDER BY u.name ASC
      `).all();

      return sendJson(res, 200, { drivers });
    }

    if (pathname === '/api/drivers' && req.method === 'POST') {
      if (session.role !== 'admin') {
        return sendJson(res, 403, { error: 'Only admins can add drivers' });
      }

      const { name, email, phone, password, vehicleNumber, vehicleType, licenseNumber } = await readJsonBody(req);
      if (!name || !email || !password || !vehicleNumber || !vehicleType) {
        return sendJson(res, 400, { error: 'Name, email, password, vehicle number, and vehicle type are required' });
      }

      const existing = getUserByEmail(email);
      if (existing) {
        return sendJson(res, 400, { error: 'A user with this email already exists' });
      }

      const pHash = hashPassword(password);
      const userRes = db.prepare(`
        INSERT INTO users (email, password_hash, role, name, phone)
        VALUES (?, ?, 'driver', ?, ?)
      `).run(email, pHash, name, phone || '');

      const newDriverId = Number(userRes.lastInsertRowid);
      db.prepare(`
        INSERT INTO driver_profiles (user_id, vehicle_number, vehicle_type, license_number, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(newDriverId, vehicleNumber, vehicleType, licenseNumber || 'DL-PENDING');

      return sendJson(res, 201, { message: 'Driver created successfully', driverId: newDriverId });
    }

    const driverToggleMatch = pathname.match(/^\/api\/drivers\/(\d+)\/toggle-active$/);
    if (driverToggleMatch && req.method === 'PUT') {
      if (session.role !== 'admin') {
        return sendJson(res, 403, { error: 'Only admins can modify driver status' });
      }
      const driverId = parseInt(driverToggleMatch[1], 10);
      const cur = db.prepare('SELECT is_active FROM driver_profiles WHERE user_id = ?').get(driverId);
      if (!cur) return sendJson(res, 404, { error: 'Driver profile not found' });
      const newStatus = cur.is_active ? 0 : 1;
      db.prepare('UPDATE driver_profiles SET is_active = ? WHERE user_id = ?').run(newStatus, driverId);
      return sendJson(res, 200, { message: 'Driver status updated', isActive: newStatus === 1 });
    }

    // ==========================================
    // CITIZEN MANAGEMENT ROUTES (ADMIN)
    // ==========================================
    if (pathname === '/api/citizens' && req.method === 'GET') {
      if (session.role !== 'admin') {
        return sendJson(res, 403, { error: 'Only admins can view citizen management directory' });
      }

      const citizens = db.prepare(`
        SELECT u.id, u.name, u.email, u.phone, u.created_at,
               cp.village_ward, cp.address,
               (SELECT COUNT(*) FROM pickup_requests p WHERE p.citizen_id = u.id) as total_requests,
               (SELECT COUNT(*) FROM pickup_requests p WHERE p.citizen_id = u.id AND p.status = 'Completed') as completed_requests,
               (SELECT COUNT(*) FROM pickup_requests p WHERE p.citizen_id = u.id AND p.status NOT IN ('Completed', 'Cancelled')) as active_requests
        FROM users u
        LEFT JOIN citizen_profiles cp ON u.id = cp.user_id
        WHERE u.role = 'citizen'
        ORDER BY u.created_at DESC
      `).all();

      return sendJson(res, 200, { citizens });
    }

    // ==========================================
    // COMPLAINT MANAGEMENT ROUTES
    // ==========================================
    if (pathname === '/api/complaints' && req.method === 'GET') {
      let query = `
        SELECT c.*, u.name as citizen_name, u.phone as citizen_phone, cp.village_ward
        FROM complaints c
        JOIN users u ON c.citizen_id = u.id
        LEFT JOIN citizen_profiles cp ON u.id = cp.user_id
      `;
      let params = [];

      if (session.role === 'citizen') {
        query += ' WHERE c.citizen_id = ? ORDER BY c.created_at DESC';
        params.push(session.userId);
      } else if (session.role === 'admin') {
        query += ' ORDER BY c.created_at DESC';
      } else {
        return sendJson(res, 403, { error: 'Drivers do not have access to complaint desk' });
      }

      const complaints = db.prepare(query).all(...params);
      return sendJson(res, 200, { complaints });
    }

    if (pathname === '/api/complaints' && req.method === 'POST') {
      if (session.role !== 'citizen') {
        return sendJson(res, 403, { error: 'Only citizens can lodge complaints' });
      }

      const { type, description, location, photoUrl } = await readJsonBody(req);
      if (!type || !description || !location) {
        return sendJson(res, 400, { error: 'Complaint type, description, and location are required' });
      }

      const countRow = db.prepare('SELECT count(*) as c FROM complaints').get();
      const complaintId = `CMP-2026-${String(countRow.c + 1).padStart(4, '0')}`;

      db.prepare(`
        INSERT INTO complaints (id, citizen_id, type, description, photo_url, location, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending')
      `).run(complaintId, session.userId, type, description, photoUrl || null, location);

      // Notify Admins
      const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
      for (const admin of admins) {
        addNotification(
          admin.id,
          'New Complaint Lodged',
          `${session.name} reported "${type}" at ${location}.`,
          'warning',
          `#complaints`
        );
      }

      addNotification(
        session.userId,
        'Complaint Registered',
        `Your grievance #${complaintId} regarding ${type} has been submitted to the Gram Panchayat.`,
        'info',
        `#complaints`
      );

      return sendJson(res, 201, { message: 'Complaint registered successfully', complaintId });
    }

    const complaintStatusMatch = pathname.match(/^\/api\/complaints\/([A-Za-z0-9\-]+)\/status$/);
    if (complaintStatusMatch && req.method === 'PUT') {
      if (session.role !== 'admin') {
        return sendJson(res, 403, { error: 'Only admins can update complaint status' });
      }

      const complaintId = complaintStatusMatch[1];
      const { status, adminNotes } = await readJsonBody(req);
      const valid = ['Pending', 'Under Review', 'Assigned', 'Resolved'];
      if (!valid.includes(status)) {
        return sendJson(res, 400, { error: 'Invalid complaint status' });
      }

      const comp = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
      if (!comp) return sendJson(res, 404, { error: 'Complaint not found' });

      db.prepare(`
        UPDATE complaints
        SET status = ?, admin_notes = ?, resolved_at = ${status === 'Resolved' ? 'CURRENT_TIMESTAMP' : 'resolved_at'}
        WHERE id = ?
      `).run(status, adminNotes || '', complaintId);

      addNotification(
        comp.citizen_id,
        `Complaint Update: ${status}`,
        `Your complaint #${complaintId} has been updated to ${status}. Notes: ${adminNotes || 'None'}`,
        status === 'Resolved' ? 'success' : 'info',
        '#complaints'
      );

      return sendJson(res, 200, { message: 'Complaint status updated', status });
    }

    // ==========================================
    // NOTIFICATION ROUTES
    // ==========================================
    if (pathname === '/api/notifications' && req.method === 'GET') {
      const notifs = db.prepare(`
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 30
      `).all(session.userId);

      const unreadCount = db.prepare(`
        SELECT COUNT(*) as c FROM notifications
        WHERE user_id = ? AND is_read = 0
      `).get(session.userId).c;

      return sendJson(res, 200, { notifications: notifs, unreadCount });
    }

    if (pathname === '/api/notifications/mark-read' && req.method === 'POST') {
      const { id } = await readJsonBody(req);
      if (id) {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, session.userId);
      } else {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(session.userId);
      }
      return sendJson(res, 200, { message: 'Notifications marked as read' });
    }

    // ==========================================
    // ROUTE PLANNING & OPTIMIZATION MODULE
    // ==========================================
    if (pathname === '/api/routes/optimize' && req.method === 'GET') {
      // Accessible by Admin or Driver
      const parsedUrl = new URL(req.url, 'http://localhost');
      let driverId = parsedUrl.searchParams.get('driverId');

      if (session.role === 'driver') {
        driverId = session.userId;
      } else if (session.role === 'citizen') {
        return sendJson(res, 403, { error: 'Unauthorized' });
      }

      // Default to driver 2 (Suresh Kumar) if none specified for admin view
      if (!driverId) {
        const firstDriver = db.prepare("SELECT id FROM users WHERE role = 'driver' LIMIT 1").get();
        driverId = firstDriver ? firstDriver.id : null;
      }

      if (!driverId) {
        return sendJson(res, 400, { error: 'No driver specified' });
      }

      const driver = db.prepare(`
        SELECT u.id, u.name, u.phone, dp.vehicle_number, dp.vehicle_type, dp.current_lat, dp.current_lng
        FROM users u
        JOIN driver_profiles dp ON u.id = dp.user_id
        WHERE u.id = ?
      `).get(driverId);

      // Get assigned active pickups for this driver
      const pickups = db.prepare(`
        SELECT id, citizen_id, waste_type, quantity, address, latitude, longitude,
               scheduled_date, preferred_time, status
        FROM pickup_requests
        WHERE assigned_driver_id = ? AND status != 'Cancelled'
        ORDER BY scheduled_date ASC
      `).all(driverId);

      // Panchayat Depot / Material Recovery Facility (Depot base coordinates)
      const depot = {
        name: 'Shanti Nagar Gram Panchayat MRF Yard & Depot',
        latitude: 28.5355,
        longitude: 77.3910
      };

      // Heuristic Nearest-Neighbor Route Sequencing
      let unvisited = [...pickups];
      let currentPoint = { latitude: driver.current_lat || depot.latitude, longitude: driver.current_lng || depot.longitude };
      let optimizedSequence = [];
      let totalDistanceKm = 0;

      function calcDist(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      }

      while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < unvisited.length; i++) {
          const d = calcDist(currentPoint.latitude, currentPoint.longitude, unvisited[i].latitude, unvisited[i].longitude);
          if (d < minDist) {
            minDist = d;
            nearestIdx = i;
          }
        }
        const nextPickup = unvisited.splice(nearestIdx, 1)[0];
        totalDistanceKm += (minDist === Infinity ? 0 : minDist);
        optimizedSequence.push({
          stopNumber: optimizedSequence.length + 1,
          pickup: nextPickup,
          estimatedDistanceKm: Math.round((minDist === Infinity ? 0 : minDist) * 10) / 10
        });
        currentPoint = { latitude: nextPickup.latitude, longitude: nextPickup.longitude };
      }

      // Add return to Gram Panchayat recycling depot
      const returnDist = calcDist(currentPoint.latitude, currentPoint.longitude, depot.latitude, depot.longitude);
      totalDistanceKm += returnDist;

      return sendJson(res, 200, {
        driver,
        depot,
        stops: optimizedSequence,
        totalPickups: pickups.length,
        totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
        fuelSavingsPercent: 24,
        fuelSavingsLabel: 'Illustrative route-efficiency estimate: ~24% (Prototype Simulation)',
        simulatedNotice: 'Prototype simulated route sequence & waypoint calculation for Gram Panchayat Shanti Nagar fleet.'
      });
    }

    // ==========================================
    // ADMIN DASHBOARD SUMMARY STATS
    // ==========================================
    if (pathname === '/api/stats' && req.method === 'GET') {
      if (session.role !== 'admin') {
        return sendJson(res, 403, { error: 'Only admins have access to central operational metrics' });
      }

      const totalCitizens = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'citizen'").get().c;
      const totalDrivers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'driver'").get().c;
      const totalPickups = db.prepare("SELECT COUNT(*) as c FROM pickup_requests").get().c;
      const pendingPickups = db.prepare("SELECT COUNT(*) as c FROM pickup_requests WHERE status = 'Requested'").get().c;
      const verifiedPickups = db.prepare("SELECT COUNT(*) as c FROM pickup_requests WHERE status = 'Verified'").get().c;
      const activePickups = db.prepare("SELECT COUNT(*) as c FROM pickup_requests WHERE status IN ('Driver Assigned', 'Driver On The Way', 'Arrived', 'Picked Up')").get().c;
      const completedPickups = db.prepare("SELECT COUNT(*) as c FROM pickup_requests WHERE status = 'Completed'").get().c;
      const openComplaints = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status != 'Resolved'").get().c;

      // Category breakdown
      const wasteCategories = db.prepare(`
        SELECT waste_type, COUNT(*) as count
        FROM pickup_requests
        GROUP BY waste_type
      `).all();

      return sendJson(res, 200, {
        metrics: {
          totalCitizens,
          totalDrivers,
          totalPickups,
          pendingPickups,
          verifiedPickups,
          activePickups,
          completedPickups,
          openComplaints
        },
        wasteCategories
      });
    }

    // 404 for unmatched /api routes
    return sendJson(res, 404, { error: `API route not found: ${pathname}` });

  } catch (err) {
    console.error(`API Error on ${req.method} ${pathname}:`, err);
    return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
}

module.exports = { handleApiRequest };
