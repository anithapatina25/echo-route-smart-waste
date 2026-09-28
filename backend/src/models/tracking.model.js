/**
 * ECHO ROUTE SMART WASTE
 * Live Tracking & Route Planning Model
 */
const db = require('../../../database/client');
const RouteService = require('../services/route.service');
const { ApiError } = require('../middleware/error.middleware');

const DEPOT_COORDINATES = {
  name: 'Gram Panchayat Central Sanitation Depot',
  lat: 28.5320,
  lng: 77.3880
};

const DISPOSAL_COORDINATES = {
  name: 'Gram Panchayat Solid Waste Processing & Compost Center',
  lat: 28.5420,
  lng: 77.4000
};

const TrackingModel = {
  // 1. Update Driver Location (POST /api/driver/location)
  updateDriverLocation: (driverProfileId, { latitude, longitude, speedKmh = 20.0, headingDeg = 0.0, activePickupId = null }) => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90.0 || lat > 90.0) {
      throw ApiError.badRequest('Invalid latitude: must be a floating point number between -90 and 90 degrees.');
    }
    if (isNaN(lng) || lng < -180.0 || lng > 180.0) {
      throw ApiError.badRequest('Invalid longitude: must be a floating point number between -180 and 180 degrees.');
    }

    // Update driver profile current position
    db.run(
      'UPDATE driver_profiles SET current_lat = ?, current_lng = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [lat, lng, driverProfileId]
    );

    // Insert into location history
    db.run(
      `INSERT INTO driver_location_history (driver_id, latitude, longitude, speed_kmh, heading_deg, active_pickup_id, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [driverProfileId, lat, lng, speedKmh, headingDeg, activePickupId]
    );

    return {
      driver_id: driverProfileId,
      latitude: lat,
      longitude: lng,
      speed_kmh: speedKmh,
      heading_deg: headingDeg,
      timestamp: new Date().toISOString(),
      prototypeNotice: 'Prototype GPS / Simulated Location: Location logged to Gram Panchayat telemetry stream.'
    };
  },

  // 2. Get Driver Location & Telemetry
  getDriverLocation: (driverProfileId) => {
    const driver = db.get(
      `SELECT dp.id, dp.user_id, dp.vehicle_number, dp.vehicle_type, dp.is_on_duty,
              dp.current_lat, dp.current_lng, dp.updated_at,
              u.full_name as driver_name, u.phone as driver_phone
       FROM driver_profiles dp
       JOIN users u ON dp.user_id = u.id
       WHERE dp.id = ?`,
      [driverProfileId]
    );

    if (!driver) throw ApiError.notFound('Driver profile not found.');

    // Deterministic simulated coordinates fallback if null
    const lat = driver.current_lat || 28.5340;
    const lng = driver.current_lng || 77.3895;

    // Find current active assignment
    const activeAssignment = db.get(
      `SELECT da.id, da.pickup_request_id, da.status, pr.request_code, pr.address, pr.ward_number
       FROM driver_assignments da
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id
       WHERE da.driver_id = ? AND da.status IN ('EN_ROUTE', 'ARRIVED', 'PICKED_UP')
       ORDER BY da.sequence_order ASC LIMIT 1`,
      [driverProfileId]
    );

    return {
      ...driver,
      current_lat: lat,
      current_lng: lng,
      activeAssignment: activeAssignment || null,
      prototypeNotice: 'Prototype GPS / Simulated Location: Coordinates generated from Panchayat fleet simulator.'
    };
  },

  // 3. Admin Live Tracking Telemetry (All Vehicles, Pickups, Stops, Depot)
  getAdminTrackingData: () => {
    // A. Active On-Duty Vehicles
    const vehicles = db.query(
      `SELECT dp.id as driver_id, dp.vehicle_number, dp.vehicle_type, dp.capacity_kg, dp.is_on_duty,
              dp.current_lat, dp.current_lng, dp.updated_at as last_ping,
              u.full_name as driver_name, u.phone as driver_phone,
              (SELECT da.status 
               FROM driver_assignments da 
               WHERE da.driver_id = dp.id AND da.status IN ('EN_ROUTE', 'ARRIVED', 'PICKED_UP') 
               LIMIT 1) as active_trip_status,
              (SELECT pr.request_code 
               FROM driver_assignments da 
               JOIN pickup_requests pr ON da.pickup_request_id = pr.id
               WHERE da.driver_id = dp.id AND da.status IN ('EN_ROUTE', 'ARRIVED', 'PICKED_UP') 
               LIMIT 1) as active_request_code
       FROM driver_profiles dp
       JOIN users u ON dp.user_id = u.id
       ORDER BY dp.is_on_duty DESC, u.full_name ASC`
    ).map(v => ({
      ...v,
      latitude: v.current_lat || 28.5340,
      longitude: v.current_lng || 77.3895,
      type: 'VEHICLE',
      status: v.active_trip_status || (v.is_on_duty ? 'ON_DUTY_IDLE' : 'OFF_DUTY')
    }));

    // B. Active Pickups (Pending, Verified, Assigned, In Transit, Collected)
    const activePickups = db.query(
      `SELECT pr.id, pr.request_code, pr.waste_type, pr.estimated_volume_bags,
              pr.status, pr.ward_number, pr.address, pr.gps_lat, pr.gps_lng,
              pr.scheduled_date, pr.preferred_time,
              cp.village_name, cp.landmark,
              cu.full_name as citizen_name, cu.phone as citizen_phone,
              da.id as assignment_id, da.driver_id, da.status as assignment_status, da.sequence_order,
              dp.vehicle_number
       FROM pickup_requests pr
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       LEFT JOIN driver_assignments da ON da.pickup_request_id = pr.id
       LEFT JOIN driver_profiles dp ON da.driver_id = dp.id
       WHERE pr.status NOT IN ('COMPLETED', 'CANCELLED')
       ORDER BY da.sequence_order ASC, pr.id ASC`
    ).map((p, idx) => ({
      ...p,
      latitude: Number(p.gps_lat) || (28.5350 + (idx * 0.002)),
      longitude: Number(p.gps_lng) || (77.3900 + (idx * 0.002)),
      type: p.assignment_status === 'ARRIVED' || p.assignment_status === 'EN_ROUTE' ? 'CURRENT_STOP' : 'PICKUP'
    }));

    // C. Completed Pickups (with historical locations & proof)
    const completedPickups = db.query(
      `SELECT pr.id, pr.request_code, pr.waste_type, pr.ward_number, pr.address,
              pr.gps_lat, pr.gps_lng, pr.status,
              cu.full_name as citizen_name,
              cp_proof.proof_photo_url, cp_proof.completed_at
       FROM pickup_requests pr
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       LEFT JOIN completion_proofs cp_proof ON cp_proof.pickup_request_id = pr.id
       WHERE pr.status = 'COMPLETED'
       ORDER BY cp_proof.completed_at DESC
       LIMIT 15`
    ).map((c, idx) => ({
      ...c,
      latitude: Number(c.gps_lat) || (28.5360 + (idx * 0.0015)),
      longitude: Number(c.gps_lng) || (77.3910 + (idx * 0.0015)),
      type: 'COMPLETED'
    }));

    return {
      depot: DEPOT_COORDINATES,
      disposalYard: DISPOSAL_COORDINATES,
      vehicles,
      activePickups,
      completedPickups,
      totalActiveVehicles: vehicles.filter(v => v.is_on_duty).length,
      totalActiveStops: activePickups.length,
      totalCompletedToday: completedPickups.length,
      prototypeNotice: 'Prototype GPS / Simulated Location: Fleet telemetry and stop coordinates are rendered via Panchayat simulated GPS stream.'
    };
  },

  // 4. Admin Routes Management (List & Details)
  getAdminRoutes: () => {
    const drivers = db.query(
      `SELECT dp.id as driver_id, dp.vehicle_number, dp.vehicle_type, dp.capacity_kg, dp.is_on_duty,
              u.full_name as driver_name, u.phone as driver_phone
       FROM driver_profiles dp
       JOIN users u ON dp.user_id = u.id
       ORDER BY dp.is_on_duty DESC, u.full_name ASC`
    );

    const routesList = [];

    for (const driver of drivers) {
      // Get assigned pickups for this driver
      const pickups = db.query(
        `SELECT da.id as assignment_id, da.sequence_order, da.status as assignment_status,
                pr.id as pickup_id, pr.request_code, pr.waste_type, pr.estimated_volume_bags,
                pr.address, pr.ward_number, pr.gps_lat, pr.gps_lng, pr.scheduled_date, pr.preferred_time,
                cp.village_name, cp.landmark,
                cu.full_name as citizen_name, cu.phone as citizen_phone
         FROM driver_assignments da
         JOIN pickup_requests pr ON da.pickup_request_id = pr.id
         JOIN citizen_profiles cp ON pr.citizen_id = cp.id
         JOIN users cu ON cp.user_id = cu.id
         WHERE da.driver_id = ?
         ORDER BY da.sequence_order ASC, pr.id ASC`,
        [driver.driver_id]
      );

      // Check existing persisted route
      let routeRecord = db.get(
        'SELECT * FROM routes WHERE driver_id = ? ORDER BY id DESC LIMIT 1',
        [driver.driver_id]
      );

      // If no route exists or pickups have changed, compute sequenced route
      const sequenced = RouteService.sequenceRouteStops(pickups, DEPOT_COORDINATES, DISPOSAL_COORDINATES);

      if (!routeRecord && pickups.length > 0) {
        db.run(
          `INSERT INTO routes (driver_id, route_name, status, total_stops, total_distance_km, optimized_waypoints_json, depot_name, depot_lat, depot_lng, estimated_duration_mins)
           VALUES (?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?)`,
          [
            driver.driver_id,
            `Ward Collection Route - ${driver.driver_name}`,
            sequenced.totalStops,
            sequenced.totalDistanceKm,
            JSON.stringify(sequenced.waypoints),
            DEPOT_COORDINATES.name,
            DEPOT_COORDINATES.lat,
            DEPOT_COORDINATES.lng,
            sequenced.estimatedDurationMins
          ]
        );
        routeRecord = db.get('SELECT * FROM routes WHERE driver_id = ? ORDER BY id DESC LIMIT 1', [driver.driver_id]);
      }

      routesList.push({
        driver,
        routeId: routeRecord?.id || null,
        routeName: routeRecord?.route_name || `Ward Route - ${driver.driver_name}`,
        status: routeRecord?.status || 'PLANNED',
        totalStops: sequenced.totalStops,
        totalDistanceKm: sequenced.totalDistanceKm,
        estimatedDurationMins: sequenced.estimatedDurationMins,
        depot: DEPOT_COORDINATES,
        disposalYard: DISPOSAL_COORDINATES,
        stops: sequenced.orderedStops,
        waypoints: sequenced.waypoints,
        prototypeNotice: 'Prototype route optimization: Distances and sequencing are estimated based on ward coordinates and nearest-neighbor heuristics.'
      });
    }

    return routesList;
  },

  // 5. Recalculate Driver Route (Nearest-Neighbor TSP)
  recalculateDriverRoute: (driverProfileId) => {
    const driver = db.get(
      `SELECT dp.*, u.full_name as driver_name 
       FROM driver_profiles dp 
       JOIN users u ON dp.user_id = u.id 
       WHERE dp.id = ?`,
      [driverProfileId]
    );

    if (!driver) throw ApiError.notFound(`Driver profile #${driverProfileId} not found.`);

    // Get all assigned pickups for this driver
    const pickups = db.query(
      `SELECT da.id as assignment_id, da.sequence_order, da.status as assignment_status,
              pr.id as pickup_id, pr.request_code, pr.waste_type, pr.estimated_volume_bags,
              pr.address, pr.ward_number, pr.gps_lat, pr.gps_lng, pr.scheduled_date, pr.preferred_time,
              cp.village_name, cp.landmark,
              cu.full_name as citizen_name, cu.phone as citizen_phone
       FROM driver_assignments da
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       WHERE da.driver_id = ?
       ORDER BY da.sequence_order ASC, pr.id ASC`,
      [driverProfileId]
    );

    const sequenced = RouteService.sequenceRouteStops(pickups, DEPOT_COORDINATES, DISPOSAL_COORDINATES);

    // Update sequence order in driver_assignments for each stop
    for (const stop of sequenced.orderedStops) {
      db.run(
        'UPDATE driver_assignments SET sequence_order = ? WHERE id = ?',
        [stop.stop_number, stop.assignment_id]
      );
    }

    // Upsert route in routes table
    const existingRoute = db.get('SELECT id FROM routes WHERE driver_id = ?', [driverProfileId]);
    if (existingRoute) {
      db.run(
        `UPDATE routes 
         SET total_stops = ?, total_distance_km = ?, optimized_waypoints_json = ?, estimated_duration_mins = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          sequenced.totalStops,
          sequenced.totalDistanceKm,
          JSON.stringify(sequenced.waypoints),
          sequenced.estimatedDurationMins,
          existingRoute.id
        ]
      );
    } else {
      db.run(
        `INSERT INTO routes (driver_id, route_name, status, total_stops, total_distance_km, optimized_waypoints_json, depot_name, depot_lat, depot_lng, estimated_duration_mins)
         VALUES (?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?)`,
        [
          driverProfileId,
          `Ward Collection Route - ${driver.driver_name}`,
          sequenced.totalStops,
          sequenced.totalDistanceKm,
          JSON.stringify(sequenced.waypoints),
          DEPOT_COORDINATES.name,
          DEPOT_COORDINATES.lat,
          DEPOT_COORDINATES.lng,
          sequenced.estimatedDurationMins
        ]
      );
    }

    return {
      driverId: driverProfileId,
      driverName: driver.driver_name,
      totalStops: sequenced.totalStops,
      totalDistanceKm: sequenced.totalDistanceKm,
      estimatedDurationMins: sequenced.estimatedDurationMins,
      depot: DEPOT_COORDINATES,
      disposalYard: DISPOSAL_COORDINATES,
      stops: sequenced.orderedStops,
      waypoints: sequenced.waypoints,
      prototypeNotice: 'Prototype route optimization: Route recalculated successfully using nearest-neighbor heuristic sequence.'
    };
  },

  // 6. Driver Route Map Telemetry (Strictly scoped to driverProfileId)
  getDriverRouteMap: (driverProfileId) => {
    const driver = db.get(
      `SELECT dp.*, u.full_name as driver_name, u.phone as driver_phone 
       FROM driver_profiles dp 
       JOIN users u ON dp.user_id = u.id 
       WHERE dp.id = ?`,
      [driverProfileId]
    );

    if (!driver) throw ApiError.notFound('Driver profile not found.');

    const pickups = db.query(
      `SELECT da.id as assignment_id, da.sequence_order, da.status as assignment_status,
              pr.id as pickup_id, pr.request_code, pr.waste_type, pr.estimated_volume_bags,
              pr.address, pr.ward_number, pr.gps_lat, pr.gps_lng, pr.scheduled_date, pr.preferred_time,
              cp.village_name, cp.landmark,
              cu.full_name as citizen_name, cu.phone as citizen_phone
       FROM driver_assignments da
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       JOIN users cu ON cp.user_id = cu.id
       WHERE da.driver_id = ?
       ORDER BY da.sequence_order ASC, pr.id ASC`,
      [driverProfileId]
    );

    const sequenced = RouteService.sequenceRouteStops(pickups, DEPOT_COORDINATES, DISPOSAL_COORDINATES);

    const driverLat = driver.current_lat || 28.5340;
    const driverLng = driver.current_lng || 77.3895;

    const currentStop = sequenced.orderedStops.find(s => ['EN_ROUTE', 'ARRIVED', 'PICKED_UP'].includes(s.assignment_status)) || sequenced.orderedStops[0] || null;

    return {
      driver: {
        id: driver.id,
        name: driver.driver_name,
        vehicle_number: driver.vehicle_number,
        vehicle_type: driver.vehicle_type,
        current_lat: driverLat,
        current_lng: driverLng
      },
      depot: DEPOT_COORDINATES,
      disposalYard: DISPOSAL_COORDINATES,
      currentStop,
      stops: sequenced.orderedStops,
      waypoints: sequenced.waypoints,
      totalStops: sequenced.totalStops,
      totalDistanceKm: sequenced.totalDistanceKm,
      estimatedDurationMins: sequenced.estimatedDurationMins,
      prototypeNotice: 'Prototype GPS: Location shown is simulated and not live vehicle telemetry.'
    };
  },

  // 7. Citizen Tracking Map Telemetry (Scoped to pickup)
  getCitizenTrackingMap: (pickupId, citizenUserId) => {
    const pickup = db.get(
      `SELECT pr.id, pr.citizen_id, pr.request_code, pr.waste_type, pr.status as pickup_status,
              pr.address, pr.ward_number, pr.gps_lat, pr.gps_lng, pr.scheduled_date, pr.preferred_time,
              cp.user_id as citizen_user_id, cp.village_name,
              da.id as assignment_id, da.status as assignment_status, da.sequence_order,
              dp.id as driver_id, dp.vehicle_number, dp.vehicle_type, dp.current_lat, dp.current_lng,
              dp.updated_at as driver_location_updated_at,
              du.full_name as driver_name, du.phone as driver_phone
       FROM pickup_requests pr
       JOIN citizen_profiles cp ON pr.citizen_id = cp.id
       LEFT JOIN driver_assignments da ON da.pickup_request_id = pr.id
       LEFT JOIN driver_profiles dp ON da.driver_id = dp.id
       LEFT JOIN users du ON dp.user_id = du.id
       WHERE pr.id = ? OR pr.request_code = ?`,
      [pickupId, pickupId]
    );

    if (!pickup) throw ApiError.notFound('Pickup request not found.');

    // Enforce ownership if requested by citizen
    if (citizenUserId && pickup.citizen_user_id !== citizenUserId) {
      throw ApiError.forbidden('Access denied to another citizen\'s pickup request tracking telemetry.');
    }

    const pickupLat = Number(pickup.gps_lat) || 28.5355;
    const pickupLng = Number(pickup.gps_lng) || 77.3910;

    const hasDriver = !!pickup.driver_id;
    const driverLat = hasDriver ? (pickup.current_lat || (pickupLat - 0.0040)) : null;
    const driverLng = hasDriver ? (pickup.current_lng || (pickupLng - 0.0035)) : null;

    const routeLine = hasDriver ? [
      [DEPOT_COORDINATES.lat, DEPOT_COORDINATES.lng],
      [driverLat, driverLng],
      [pickupLat, pickupLng]
    ] : [];

    const estDistanceKm = hasDriver ? RouteService.calculateEstimatedRoadDistanceKm(driverLat, driverLng, pickupLat, pickupLng) : null;

    return {
      pickup: {
        id: pickup.id,
        request_code: pickup.request_code,
        status: pickup.pickup_status,
        address: pickup.address,
        ward_number: pickup.ward_number,
        latitude: pickupLat,
        longitude: pickupLng
      },
      driver: hasDriver ? {
        id: pickup.driver_id,
        name: pickup.driver_name,
        phone: pickup.driver_phone,
        vehicle_number: pickup.vehicle_number,
        vehicle_type: pickup.vehicle_type,
        latitude: driverLat,
        longitude: driverLng,
        last_update: pickup.driver_location_updated_at || new Date().toISOString()
      } : null,
      routeLine,
      estimatedDistanceKm: estDistanceKm,
      prototypeNotice: 'Prototype GPS / Simulated Location: Vehicle coordinates are simulated for demonstration and do not reflect real-time satellite telemetry.'
    };
  }
};

module.exports = TrackingModel;
