import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Package, 
  Phone, 
  Info,
  RefreshCw,
  Compass,
  TrendingUp
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { InteractiveMap } from '../../components/InteractiveMap';

export function TrackPickupView({ pickupId = null, onBookNew }) {
  const [pickup, setPickup] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrackData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.getTrackPickup(pickupId);
      if (res.success && res.data) {
        setPickup(res.data);
        // Also fetch live GIS map data for this pickup
        try {
          const mapRes = await authApi.getCitizenTrackMap(res.data.id);
          if (mapRes.success && mapRes.data) {
            setMapData(mapRes.data);
          }
        } catch (mErr) {
          console.warn('Map telemetry unavailable:', mErr);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load live tracking information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackData();
  }, [pickupId]);

  if (loading) return <LoadingState message="Connecting to Gram Panchayat dispatch network..." />;

  if (error) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={32} color="#dc2626" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.5rem' }}>Unable to Track Pickup</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchTrackData} className="btn btn-primary btn-sm">
          <RefreshCw size={14} />
          <span>Retry Tracking</span>
        </button>
      </div>
    );
  }

  if (!pickup) {
    return (
      <EmptyState
        title="No Active Pickup in Transit"
        message="You currently do not have an ongoing pickup request. Book a pickup to begin tracking."
        actionLabel="Book a New Pickup"
        onAction={onBookNew}
        icon={Navigation}
      />
    );
  }

  const timelineStages = [
    { id: 'REQUESTED', label: 'Requested', desc: 'Pickup request submitted successfully' },
    { id: 'VERIFIED', label: 'Verified', desc: 'Admin verified pickup details' },
    { id: 'DRIVER_ASSIGNED', label: 'Driver Assigned', desc: 'Sanitation vehicle assigned to stop' },
    { id: 'DRIVER_ON_THE_WAY', label: 'Driver On The Way', desc: 'Vehicle traveling to your location' },
    { id: 'ARRIVED', label: 'Arrived', desc: 'Driver arrived at your doorstep' },
    { id: 'PICKED_UP', label: 'Picked Up', desc: 'Waste collected by sanitation vehicle' },
    { id: 'COMPLETED', label: 'Completed', desc: 'Collection verified with photo proof' }
  ];

  const currentStageIndex = timelineStages.findIndex(s => s.id === pickup.timelineStage);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  // Build InteractiveMap markers & route
  const householdLat = Number(pickup.gps_lat) || Number(mapData?.pickup?.latitude) || 28.5355;
  const householdLng = Number(pickup.gps_lng) || Number(mapData?.pickup?.longitude) || 77.3910;

  const markers = [
    {
      id: 'household-stop',
      lat: householdLat,
      lng: householdLng,
      type: 'CURRENT_STOP',
      title: 'Your Household Collection Stop',
      subtitle: `${pickup.request_code} • ${pickup.waste_type_label || pickup.waste_type}`,
      address: `${pickup.address}, Ward ${pickup.ward_number}`
    }
  ];

  const routePoints = [];

  if (mapData?.driver) {
    markers.push({
      id: `driver-${mapData.driver.id}`,
      lat: mapData.driver.latitude,
      lng: mapData.driver.longitude,
      type: 'VEHICLE',
      title: `Sanitation Vehicle (${mapData.driver.vehicle_number})`,
      subtitle: `Driver: ${mapData.driver.name}`,
      address: `Vehicle: ${mapData.driver.vehicle_type}`
    });

    // Connecting route line
    routePoints.push({ lat: mapData.driver.latitude, lng: mapData.driver.longitude });
    routePoints.push({ lat: householdLat, lng: householdLng });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Navigation size={12} />
              <span>Live Tracking</span>
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#1b4332' }}>
              {pickup.request_code || `#REQ-${pickup.id}`}
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {pickup.waste_type_label || pickup.waste_type} Pickup Tracker
          </h2>
        </div>

        <button onClick={fetchTrackData} className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <RefreshCw size={13} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* 7-Step Progress Stepper */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem' }}>
          Real-Time Progress Stepper
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {timelineStages.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isPending = idx > activeIndex;

            return (
              <div 
                key={stage.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  opacity: isPending ? 0.45 : 1
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isCurrent ? '#16a34a' : (isCompleted ? '#dcfce7' : '#f1f5f9'),
                  color: isCurrent ? '#ffffff' : (isCompleted ? '#16a34a' : '#94a3b8'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  boxShadow: isCurrent ? '0 0 0 4px rgba(22, 163, 74, 0.2)' : 'none'
                }}>
                  {isCompleted ? <CheckCircle2 size={18} /> : (idx + 1)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.92rem', color: isCurrent ? '#166534' : '#0f172a' }}>
                      {stage.label}
                    </strong>
                    {isCurrent && (
                      <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                        In Progress
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {stage.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Driver Information & Interactive Map */}
      <div className="grid-2">
        {/* Driver & Assignment Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={18} color="#b45309" />
            <span>Assigned Fleet & Driver</span>
          </h3>

          {pickup.driver_name ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Assigned Driver</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{pickup.driver_name}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Vehicle Registration</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{pickup.vehicle_number}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Vehicle Model & Capacity</div>
                <div style={{ color: '#334155' }}>{pickup.vehicle_type} (~{pickup.capacity_kg || 1000} kg payload)</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Contact Driver</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 600 }}>
                  <Phone size={14} />
                  <span>{pickup.driver_phone || 'Panchayat Fleet Dispatch'}</span>
                </div>
              </div>
              {mapData?.estimatedDistanceKm && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700 }}>
                    <TrendingUp size={16} />
                    <span>Est. Distance: {mapData.estimatedDistanceKm} km</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#15803d', fontStyle: 'italic' }}>
                    Estimated prototype distance
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <Clock size={24} color="#64748b" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>Awaiting Driver Assignment</div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.35rem 0 0 0' }}>
                The Panchayat Development Officer is currently assigning collection tippers to this ward route.
              </p>
            </div>
          )}

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
            <div><strong>Pickup Point:</strong> {pickup.address}</div>
            <div><strong>Scheduled Slot:</strong> {pickup.preferred_time || 'Morning'}</div>
          </div>
        </div>

        {/* Live Interactive GIS Map Card */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="#16a34a" />
              <span>Telemetry & Vehicle Positioning</span>
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
              Ward {pickup.ward_number}
            </span>
          </div>

          <InteractiveMap
            markers={markers}
            routePoints={routePoints}
            centerLat={householdLat}
            centerLng={householdLng}
            zoom={14}
            height="260px"
          />

          {/* Mandatory GPS Transparency Notice */}
          <div style={{
            marginTop: '1rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: '#1e40af'
          }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Prototype GPS / Simulated Location:</strong> Vehicle coordinates and route lines are simulated for functional demonstration. Distances are estimated based on rural road network approximations.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

