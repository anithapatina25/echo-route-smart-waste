import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  RefreshCw, 
  Filter, 
  Clock, 
  Navigation, 
  Warehouse, 
  Phone,
  Eye,
  AlertCircle
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { InteractiveMap } from '../../components/InteractiveMap';

export function AdminLiveTrackingView() {
  const { showToast } = useToast();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showVehicles, setShowVehicles] = useState(true);
  const [showActiveStops, setShowActiveStops] = useState(true);
  const [showCompletedStops, setShowCompletedStops] = useState(true);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const res = await authApi.getAdminTracking();
      if (res.success) {
        setTrackingData(res.data);
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to fetch live tracking telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, []);

  if (loading && !trackingData) {
    return <LoadingState message="Connecting to Panchayat GIS telemetry feed..." />;
  }

  const vehicles = trackingData?.vehicles || [];
  const activePickups = trackingData?.activePickups || [];
  const completedPickups = trackingData?.completedPickups || [];
  const depot = trackingData?.depot || { lat: 28.5320, lng: 77.3880, name: 'Gram Panchayat Depot' };

  // Prepare map markers
  const mapMarkers = [
    {
      id: 'depot-main',
      lat: depot.lat,
      lng: depot.lng,
      type: 'DEPOT',
      title: depot.name,
      subtitle: 'Central Fleet Operations Yard',
      address: 'Panchayat Solid Waste Facility'
    }
  ];

  if (showVehicles) {
    vehicles.forEach((v) => {
      mapMarkers.push({
        id: `vehicle-${v.driver_id}`,
        lat: v.latitude,
        lng: v.longitude,
        type: 'VEHICLE',
        title: `Vehicle: ${v.vehicle_number}`,
        subtitle: `Driver: ${v.driver_name} (${v.vehicle_type})`,
        status: v.status,
        address: v.active_request_code ? `En Route to ${v.active_request_code}` : 'On Duty (Patrol)'
      });
    });
  }

  if (showActiveStops) {
    activePickups.forEach((p, idx) => {
      mapMarkers.push({
        id: `pickup-${p.id}`,
        lat: p.latitude,
        lng: p.longitude,
        type: p.type || 'PICKUP',
        sequence: p.sequence_order || idx + 1,
        title: `${p.request_code} - ${p.waste_type}`,
        subtitle: `Resident: ${p.citizen_name} (${p.ward_number})`,
        address: p.address,
        status: p.assignment_status || p.status
      });
    });
  }

  if (showCompletedStops) {
    completedPickups.forEach((c) => {
      mapMarkers.push({
        id: `completed-${c.id}`,
        lat: c.latitude,
        lng: c.longitude,
        type: 'COMPLETED',
        title: `${c.request_code} (Completed)`,
        subtitle: `Resident: ${c.citizen_name}`,
        address: c.address,
        status: 'COMPLETED'
      });
    });
  }

  // Draw simulated route lines connecting depot to active stops
  const polylines = [];
  if (activePickups.length > 0) {
    const routePoints = [
      [depot.lat, depot.lng],
      ...activePickups.map(p => [p.latitude, p.longitude])
    ];
    polylines.push(routePoints);
  }

  return (
    <div>
      {/* 4 Summary Telemetry Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Active Vehicles
            </span>
            <Truck size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
            {trackingData?.totalActiveVehicles || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
            Fleet Units on Ward Duty
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #b45309' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Pending & Active Stops
            </span>
            <MapPin size={20} color="#b45309" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#b45309', margin: '0.25rem 0' }}>
            {trackingData?.totalActiveStops || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
            In Dispatch Pipeline
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #2d6a4f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Completed Pickups
            </span>
            <CheckCircle2 size={20} color="#2d6a4f" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2d6a4f', margin: '0.25rem 0' }}>
            {trackingData?.totalCompletedToday || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2d6a4f', fontWeight: 600 }}>
            Photo Proof Verified
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Base Location
            </span>
            <Warehouse size={20} color="#6b21a8" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0.25rem' }}>
            Panchayat Yard
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b21a8', fontFamily: 'monospace' }}>
            {depot.lat}° N, {depot.lng}° E
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
              Map Layers:
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={showVehicles}
                onChange={(e) => setShowVehicles(e.target.checked)}
              />
              <span>Vehicles ({vehicles.length})</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={showActiveStops}
                onChange={(e) => setShowActiveStops(e.target.checked)}
              />
              <span>Active Stops ({activePickups.length})</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={showCompletedStops}
                onChange={(e) => setShowCompletedStops(e.target.checked)}
              />
              <span>Completed ({completedPickups.length})</span>
            </label>
          </div>

          <button
            onClick={fetchTracking}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Fleet Telemetry Status Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Interactive Map */}
        <div>
          <InteractiveMap
            center={[depot.lat, depot.lng]}
            zoom={14}
            markers={mapMarkers}
            polylines={polylines}
            height="520px"
            showLegend={true}
            prototypeNotice={trackingData?.prototypeNotice}
          />
        </div>

        {/* Fleet Vehicles Status Sidebar */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <Truck size={18} color="#6b21a8" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Fleet Telemetry Roster
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {vehicles.map((v) => (
              <div
                key={v.driver_id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.85rem',
                  backgroundColor: v.is_on_duty ? '#ffffff' : '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{v.driver_name}</strong>
                  <span className={`badge ${v.is_on_duty ? 'badge-success' : ''}`} style={{ backgroundColor: v.is_on_duty ? undefined : '#f1f5f9', color: v.is_on_duty ? undefined : '#64748b', fontSize: '0.7rem' }}>
                    {v.is_on_duty ? 'On Duty' : 'Off Duty'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    backgroundColor: '#f1f5f9',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px'
                  }}>
                    {v.vehicle_number}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {v.vehicle_type}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  GPS: <strong style={{ fontFamily: 'monospace' }}>{Number(v.latitude).toFixed(4)}° N, {Number(v.longitude).toFixed(4)}° E</strong>
                </div>

                {v.active_request_code && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                    Active Stop: {v.active_request_code}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
