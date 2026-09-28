import React, { useState, useEffect } from 'react';
import { 
  Route, 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Calendar, 
  Truck, 
  ArrowRight,
  Eye,
  Info,
  Compass,
  AlertCircle,
  TrendingUp,
  Radio,
  Warehouse
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { InteractiveMap } from '../../components/InteractiveMap';
import { DriverPickupDetailsModal } from './DriverPickupDetailsModal';

export function DriverRouteView() {
  const { showToast } = useToast();
  const [stops, setStops] = useState([]);
  const [routeMapData, setRouteMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatingGps, setSimulatingGps] = useState(false);

  // Details Modal
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRoute = async () => {
    try {
      setLoading(true);
      const [todayRes, mapRes] = await Promise.all([
        authApi.getDriverTodaysRoute(),
        authApi.getDriverRouteMap().catch(() => ({ success: false, data: null }))
      ]);

      if (todayRes.success) {
        setStops(todayRes.data || []);
      }
      if (mapRes.success && mapRes.data) {
        setRouteMapData(mapRes.data);
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to load route itinerary', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, []);

  const totalStops = stops.length;
  const completedStops = stops.filter(s => s.assignment_status === 'COMPLETED').length;
  const pendingStops = totalStops - completedStops;

  const handleOpenStop = (stop) => {
    setSelectedPickup(stop);
    setModalOpen(true);
  };

  // Find currently active stop
  const activeStop = stops.find(s => ['EN_ROUTE', 'ARRIVED', 'PICKED_UP'].includes(s.assignment_status)) 
    || stops.find(s => ['ASSIGNED', 'ACCEPTED'].includes(s.assignment_status))
    || null;

  // Handle simulating driver GPS move toward target stop
  const handleSimulateMove = async () => {
    if (!activeStop) return;
    try {
      setSimulatingGps(true);
      const targetLat = Number(activeStop.gps_lat) || 28.5355;
      const targetLng = Number(activeStop.gps_lng) || 77.3910;
      
      // Simulate moving closer (slight offset or arrival)
      const res = await authApi.updateDriverLocation({
        latitude: targetLat,
        longitude: targetLng,
        speed_kmh: 24,
        heading_deg: 90,
        active_pickup_id: activeStop.pickup_id
      });

      if (res.success) {
        showToast('GPS Telemetry Updated', `Simulated coordinates updated toward ${activeStop.request_code}.`, 'info');
        await fetchRoute();
      }
    } catch (err) {
      showToast('GPS Update Failed', err.message || 'Could not update coordinates', 'error');
    } finally {
      setSimulatingGps(false);
    }
  };

  // Prepare InteractiveMap markers & polylines
  const mapMarkers = [];
  const routePoints = [];

  const depot = routeMapData?.depot || { lat: 28.5320, lng: 77.3880, name: 'Gram Panchayat Depot' };
  const disposal = routeMapData?.disposalYard || { lat: 28.5420, lng: 77.4000, name: 'Composting Yard' };

  // 1. Depot
  mapMarkers.push({
    id: 'depot',
    lat: depot.lat,
    lng: depot.lng,
    type: 'DEPOT',
    title: depot.name,
    subtitle: 'Route Origin Yard',
    address: 'Central Sanitation Facility'
  });
  routePoints.push({ lat: depot.lat, lng: depot.lng });

  // 2. Ordered Stops
  stops.forEach((stop, index) => {
    const lat = Number(stop.gps_lat) || (28.5350 + (index * 0.002));
    const lng = Number(stop.gps_lng) || (77.3900 + (index * 0.002));
    const isCompleted = stop.assignment_status === 'COMPLETED';
    const isActive = ['EN_ROUTE', 'ARRIVED', 'PICKED_UP'].includes(stop.assignment_status);

    mapMarkers.push({
      id: `stop-${stop.pickup_id || index}`,
      lat,
      lng,
      type: isCompleted ? 'COMPLETED' : isActive ? 'CURRENT_STOP' : 'PICKUP',
      sequence: stop.sequence_order || index + 1,
      title: `Stop ${stop.sequence_order || index + 1}: ${stop.request_code}`,
      subtitle: `${stop.citizen_name} (${stop.ward_number})`,
      address: stop.address,
      status: stop.assignment_status
    });
    routePoints.push({ lat, lng });
  });

  // 3. Disposal Yard
  mapMarkers.push({
    id: 'disposal',
    lat: disposal.lat,
    lng: disposal.lng,
    type: 'DISPOSAL',
    title: disposal.name,
    subtitle: 'Route Termination & Processing',
    address: 'Composting & Material Recovery'
  });
  routePoints.push({ lat: disposal.lat, lng: disposal.lng });

  // 4. Vehicle marker
  const vehicleLat = routeMapData?.driver?.current_lat || 28.5340;
  const vehicleLng = routeMapData?.driver?.current_lng || 77.3895;
  mapMarkers.push({
    id: 'my-vehicle',
    lat: vehicleLat,
    lng: vehicleLng,
    type: 'VEHICLE',
    title: `My Vehicle (${routeMapData?.driver?.vehicle_number || 'GP-Sanitation'})`,
    subtitle: routeMapData?.driver?.name || 'Driver',
    address: activeStop ? `Headed toward ${activeStop.request_code}` : 'On Route',
    status: 'ACTIVE'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Route Summary KPI Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Stops
            </span>
            <Route size={20} color="#6b21a8" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
            {totalStops}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 600 }}>
            Assigned Waypoints
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #b45309' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Pending Stops
            </span>
            <Clock size={20} color="#b45309" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#b45309', margin: '0.25rem 0' }}>
            {pendingStops}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
            Awaiting Collection
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Completed
            </span>
            <CheckCircle2 size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
            {completedStops}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
            Disposed & Verified
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Est. Distance
            </span>
            <TrendingUp size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7', margin: '0.25rem 0' }}>
            {routeMapData?.totalDistanceKm || (totalStops > 0 ? '5.8' : '0.0')} km
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Estimated prototype distance
          </div>
        </div>
      </div>

      {/* Mandatory Honesty Notice */}
      <div style={{
        backgroundColor: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <AlertCircle size={18} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.4 }}>
          <strong>Prototype GPS:</strong> Location shown is simulated and not live vehicle telemetry. Coordinates and optimized routing are calculated from Gram Panchayat ward maps using nearest-neighbor sequencing.
        </div>
      </div>

      {/* Active Navigation Callout Bar */}
      {activeStop && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Navigation size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e3a8a' }}>
                  Next Stop: {activeStop.request_code}
                </span>
                <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  {activeStop.assignment_status}
                </span>
              </div>
              <div style={{ fontSize: '0.83rem', color: '#3b82f6', marginTop: '0.15rem' }}>
                {activeStop.citizen_name} &bull; {activeStop.address}, Ward {activeStop.ward_number}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleSimulateMove}
              disabled={simulatingGps}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#2563eb' }}
            >
              <Radio size={14} className={simulatingGps ? 'spin' : ''} />
              <span>{simulatingGps ? 'Pinging GPS...' : 'Simulate GPS Arrival'}</span>
            </button>
            <button
              onClick={() => handleOpenStop(activeStop)}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ffffff' }}
            >
              <Eye size={14} />
              <span>Open Stop Details</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Map Section */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={18} color="#6b21a8" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Live Route Navigation Map
            </h3>
          </div>
          <button
            onClick={fetchRoute}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh Route</span>
          </button>
        </div>

        <InteractiveMap
          markers={mapMarkers}
          routePoints={routePoints}
          centerLat={vehicleLat}
          centerLng={vehicleLng}
          zoom={14}
          height="420px"
        />
      </div>

      {/* Sequenced Stops Timeline */}
      {loading ? (
        <LoadingState message="Calculating and loading today's route sequence..." />
      ) : stops.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No Stops Scheduled"
          message="Your route has no assigned collection stops for today."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0.5rem 0 0.25rem' }}>
            Collection Sequence Stops ({stops.length})
          </h3>

          {stops.map((stop, index) => {
            const isCompleted = stop.assignment_status === 'COMPLETED';
            const isActive = ['EN_ROUTE', 'ARRIVED', 'PICKED_UP'].includes(stop.assignment_status);

            return (
              <div
                key={stop.assignment_id || stop.pickup_id || index}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  borderLeft: `5px solid ${isCompleted ? '#16a34a' : isActive ? '#6b21a8' : '#cbd5e1'}`,
                  backgroundColor: isCompleted ? '#fcfdfc' : '#ffffff'
                }}
              >
                {/* Stop Number Circle */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#dcfce7' : isActive ? '#f3e8ff' : '#f1f5f9',
                  color: isCompleted ? '#16a34a' : isActive ? '#6b21a8' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}>
                  {isCompleted ? <CheckCircle2 size={24} /> : `#${stop.sequence_order || index + 1}`}
                </div>

                {/* Stop Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#6b21a8' }}>
                      {stop.request_code}
                    </span>
                    <span className={`badge ${isCompleted ? 'badge-success' : isActive ? 'badge-warning' : 'badge-info'}`}>
                      {stop.assignment_status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Ward {stop.ward_number} &bull; {stop.village_name || 'Gram Panchayat'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                    {stop.waste_type_label || stop.waste_type} &bull; {stop.citizen_name}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569', fontSize: '0.82rem' }}>
                    <MapPin size={13} color="#dc2626" />
                    <span>{stop.address} {stop.landmark ? `(Near ${stop.landmark})` : ''}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <span>Slot: <strong>{stop.preferred_time || 'Morning'}</strong></span>
                    <span>Coordinates: <strong style={{ fontFamily: 'monospace' }}>{stop.gps_lat || '28.5355'}, {stop.gps_lng || '77.3910'}</strong></span>
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  <button
                    onClick={() => handleOpenStop(stop)}
                    className="btn btn-sm btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={14} />
                    <span>{isCompleted ? 'View Proof' : 'Open Stop'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <DriverPickupDetailsModal
        isOpen={modalOpen}
        pickup={selectedPickup}
        onClose={() => {
          setModalOpen(false);
          setSelectedPickup(null);
        }}
        onActionSuccess={(updated) => {
          setSelectedPickup(updated);
          fetchRoute();
        }}
      />
    </div>
  );
}

