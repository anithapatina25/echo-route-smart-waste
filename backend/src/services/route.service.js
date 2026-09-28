/**
 * ECHO ROUTE SMART WASTE
 * Route Planning & Sequencing Service
 * Prototype Nearest-Neighbor TSP & Geodesic Distance Engine
 */
const DEFAULT_DEPOT = {
  name: 'Gram Panchayat Central Sanitation Depot',
  lat: 28.5320,
  lng: 77.3880
};

const DEFAULT_DISPOSAL_YARD = {
  name: 'Panchayat Waste Processing & Composting Center',
  lat: 28.5420,
  lng: 77.4000
};

// Road curvature multiplier to convert geodesic straight-line distance to realistic rural road driving distance
const ROAD_CURVATURE_FACTOR = 1.28;

// Average rural sanitation vehicle speed in km/h (tipper / tractor with stops)
const AVERAGE_SPEED_KMH = 20.0;

// Estimated collection dwell time per household stop (minutes)
const DWELL_TIME_MINS_PER_STOP = 5.0;

const RouteService = {
  /**
   * Calculate straight-line (geodesic) distance in kilometers using the Haversine formula
   */
  calculateGeodesicDistanceKm: (lat1, lon1, lat2, lon2) => {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
      return 0.0;
    }
    const R = 6371.0; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180.0;
    const dLon = (lon2 - lon1) * Math.PI / 180.0;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Calculate realistic estimated prototype road driving distance in kilometers
   */
  calculateEstimatedRoadDistanceKm: (lat1, lon1, lat2, lon2) => {
    const geodesic = RouteService.calculateGeodesicDistanceKm(lat1, lon1, lat2, lon2);
    return Math.round(geodesic * ROAD_CURVATURE_FACTOR * 10) / 10;
  },

  /**
   * Nearest-Neighbor TSP Prototype Route Sequencing
   * Orders assigned pickup stops efficiently starting from the Gram Panchayat Depot
   */
  sequenceRouteStops: (pickups = [], depot = DEFAULT_DEPOT, disposalYard = DEFAULT_DISPOSAL_YARD) => {
    if (!pickups || pickups.length === 0) {
      return {
        depot,
        disposalYard,
        orderedStops: [],
        waypoints: [
          { sequence: 0, type: 'DEPOT', name: depot.name, lat: depot.lat, lng: depot.lng }
        ],
        totalDistanceKm: 0.0,
        estimatedDurationMins: 0,
        totalStops: 0,
        prototypeNotice: 'Prototype route optimization: Distances and sequencing are estimated based on ward coordinates and nearest-neighbor heuristics.'
      };
    }

    const unvisited = [...pickups];
    const orderedStops = [];
    const waypoints = [
      { sequence: 0, type: 'DEPOT', name: depot.name, lat: depot.lat, lng: depot.lng, address: 'Panchayat Fleet Yard' }
    ];

    let currentLat = depot.lat;
    let currentLng = depot.lng;
    let cumulativeDistance = 0.0;
    let sequenceCounter = 1;

    // Greedy Nearest-Neighbor search
    while (unvisited.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const p = unvisited[i];
        // Use default coords if missing
        const pLat = Number(p.gps_lat) || (depot.lat + 0.0035 * sequenceCounter);
        const pLng = Number(p.gps_lng) || (depot.lng + 0.0030 * sequenceCounter);

        const dist = RouteService.calculateGeodesicDistanceKm(currentLat, currentLng, pLat, pLng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx >= 0) {
        const nextPickup = unvisited.splice(nearestIdx, 1)[0];
        const stopLat = Number(nextPickup.gps_lat) || (depot.lat + 0.0035 * sequenceCounter);
        const stopLng = Number(nextPickup.gps_lng) || (depot.lng + 0.0030 * sequenceCounter);

        const segmentDistance = RouteService.calculateEstimatedRoadDistanceKm(currentLat, currentLng, stopLat, stopLng);
        cumulativeDistance += segmentDistance;

        const stopRecord = {
          ...nextPickup,
          stop_number: sequenceCounter,
          gps_lat: stopLat,
          gps_lng: stopLng,
          segment_distance_km: segmentDistance
        };

        orderedStops.push(stopRecord);
        waypoints.push({
          sequence: sequenceCounter,
          type: 'PICKUP',
          name: `Stop #${sequenceCounter}: ${nextPickup.citizen_name || 'Resident'} (${nextPickup.request_code || nextPickup.id})`,
          pickup_id: nextPickup.pickup_id || nextPickup.id,
          request_code: nextPickup.request_code,
          lat: stopLat,
          lng: stopLng,
          address: nextPickup.address,
          ward: nextPickup.ward_number,
          waste_type: nextPickup.waste_type,
          status: nextPickup.assignment_status || nextPickup.pickup_status || nextPickup.status
        });

        currentLat = stopLat;
        currentLng = stopLng;
        sequenceCounter++;
      }
    }

    // Add final leg to Disposal / Composting Yard
    const finalLegDistance = RouteService.calculateEstimatedRoadDistanceKm(currentLat, currentLng, disposalYard.lat, disposalYard.lng);
    cumulativeDistance += finalLegDistance;

    waypoints.push({
      sequence: sequenceCounter,
      type: 'DISPOSAL_YARD',
      name: disposalYard.name,
      lat: disposalYard.lat,
      lng: disposalYard.lng,
      address: 'Panchayat Waste Composting Yard'
    });

    const totalDistanceRounded = Math.round(cumulativeDistance * 10) / 10;
    const drivingTimeMins = (totalDistanceRounded / AVERAGE_SPEED_KMH) * 60.0;
    const totalDurationMins = Math.round(drivingTimeMins + orderedStops.length * DWELL_TIME_MINS_PER_STOP);

    return {
      depot,
      disposalYard,
      orderedStops,
      waypoints,
      totalDistanceKm: totalDistanceRounded,
      estimatedDurationMins: totalDurationMins,
      totalStops: orderedStops.length,
      prototypeNotice: 'Prototype route optimization: Sequences and distances are estimated using rural road heuristics and are not live satellite telemetry.'
    };
  }
};

module.exports = RouteService;
