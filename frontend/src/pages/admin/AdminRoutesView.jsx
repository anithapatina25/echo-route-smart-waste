import React, { useState, useEffect } from 'react';
import { 
  Route, 
  Truck, 
  MapPin, 
  Clock, 
  Compass, 
  RefreshCw, 
  Warehouse, 
  AlertCircle, 
  CheckCircle2, 
  RotateCw,
  TrendingUp,
  User,
  Calendar,
  Layers
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { InteractiveMap } from '../../components/InteractiveMap';

export function AdminRoutesView() {
  const { showToast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchRoutes = async (retainDriverId = null) => {
    try {
      setLoading(true);
      const res = await authApi.getAdminRoutes();
      if (res.success && res.data) {
        setRoutes(res.data);
        if (res.data.length > 0) {
          const targetId = retainDriverId || selectedDriverId || res.data[0].driver.driver_id;
          setSelectedDriverId(targetId);
        }
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to fetch collection routes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleRecalculate = async () => {
    if (!selectedDriverId) return;
    try {
      setRecalculating(true);
      const res = await authApi.recalculateDriverRoute(selectedDriverId);
      if (res.success) {
        showToast(
          'Route Recalculated',
          `Optimal pickup sequence recomputed (${res.data.totalDistanceKm} km, ~${res.data.estimatedDurationMins} mins).`,
          'success'
        );
        await fetchRoutes(selectedDriverId);
      }
    } catch (err) {
      showToast('Recalculation Failed', err.message || 'Could not optimize route', 'error');
    } finally {
      setRecalculating(false);
    }
  };

  if (loading && routes.length === 0) {
    return <LoadingState message="Computing Panchayat sanitation route matrices..." />;
  }

  const selectedRoute = routes.find((r) => r.driver.driver_id === selectedDriverId) || routes[0];

  // Prepare map markers and route coordinates
  const mapMarkers = [];
  const routePoints = [];

  if (selectedRoute) {
    // 1. Depot
    if (selectedRoute.depot) {
      mapMarkers.push({
        id: 'depot',
        lat: selectedRoute.depot.lat,
        lng: selectedRoute.depot.lng,
        type: 'DEPOT',
        title: selectedRoute.depot.name,
        subtitle: 'Start Point: Central Fleet Yard',
        address: 'Gram Panchayat Depot'
      });
      routePoints.push({ lat: selectedRoute.depot.lat, lng: selectedRoute.depot.lng });
    }

    // 2. Sequenced Stops
    if (selectedRoute.stops && selectedRoute.stops.length > 0) {
      selectedRoute.stops.forEach((stop, index) => {
        const lat = Number(stop.gps_lat) || 28.5350;
        const lng = Number(stop.gps_lng) || 77.3900;
        mapMarkers.push({
          id: `stop-${stop.pickup_id}`,
          lat: lat,
          lng: lng,
          type: stop.assignment_status === 'ARRIVED' || stop.assignment_status === 'EN_ROUTE' ? 'CURRENT_STOP' : 'PICKUP',
          sequence: stop.sequence_order || index + 1,
          title: `Stop ${stop.sequence_order || index + 1}: ${stop.request_code}`,
          subtitle: `${stop.citizen_name} - ${stop.waste_type}`,
          address: `${stop.address}, Ward ${stop.ward_number}`,
          status: stop.assignment_status
        });
        routePoints.push({ lat, lng });
      });
    }

    // 3. Disposal Center
    if (selectedRoute.disposalYard) {
      mapMarkers.push({
        id: 'disposal',
        lat: selectedRoute.disposalYard.lat,
        lng: selectedRoute.disposalYard.lng,
        type: 'DISPOSAL',
        title: selectedRoute.disposalYard.name,
        subtitle: 'End Point: Solid Waste Processing Yard',
        address: 'Panchayat Composting Facility'
      });
      routePoints.push({ lat: selectedRoute.disposalYard.lat, lng: selectedRoute.disposalYard.lng });
    }

    // 4. Vehicle location if on duty
    if (selectedRoute.driver) {
      mapMarkers.push({
        id: `vehicle-${selectedRoute.driver.driver_id}`,
        lat: 28.5340,
        lng: 77.3895,
        type: 'VEHICLE',
        title: `Vehicle: ${selectedRoute.driver.vehicle_number}`,
        subtitle: `Driver: ${selectedRoute.driver.driver_name}`,
        status: selectedRoute.driver.is_on_duty ? 'ON_DUTY' : 'OFF_DUTY',
        address: 'In Transit along Ward Route'
      });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* View Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#065f46', fontWeight: 700 }}>
              Route Sequencing & Optimization
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Nearest-Neighbor TSP Algorithm
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Sanitation Fleet Dispatch Routes
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0' }}>
            Multi-stop collection routes starting from Central Depot through sequenced ward households to Composting Facility.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => fetchRoutes(selectedDriverId)}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Routes</span>
          </button>
        </div>
      </div>

      {/* Honesty Banner: Prototype Route Planning */}
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
          <strong>Prototype Route Optimization:</strong> Total travel distances, turn-by-turn waypoints, and stop sequences are computed using a rural Nearest-Neighbor Traveling Salesperson heuristic with a 1.28x road curvature multiplier. Coordinates reflect Gram Panchayat GIS ward mock data for functional prototype demonstration.
        </div>
      </div>

      {/* Driver / Vehicle Selector Bar */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Truck size={20} color="#0284c7" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
            Select Fleet Driver:
          </span>
          <select
            value={selectedDriverId || ''}
            onChange={(e) => setSelectedDriverId(Number(e.target.value))}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#0f172a',
              cursor: 'pointer'
            }}
          >
            {routes.map((r) => (
              <option key={r.driver.driver_id} value={r.driver.driver_id}>
                {r.driver.driver_name} ({r.driver.vehicle_number} - {r.driver.vehicle_type}) [{r.totalStops} Stops]
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={recalculating || !selectedRoute || selectedRoute.totalStops === 0}
          className="btn btn-primary btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#0284c7',
            borderColor: '#0284c7'
          }}
        >
          <RotateCw size={14} className={recalculating ? 'spin' : ''} />
          <span>{recalculating ? 'Optimizing Sequence...' : 'Recalculate Route'}</span>
        </button>
      </div>

      {/* Selected Route Summary KPI Cards */}
      {selectedRoute && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Estimated Distance
              </span>
              <TrendingUp size={16} color="#0284c7" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {selectedRoute.totalDistanceKm} km
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Estimated prototype distance
            </span>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Estimated Duration
              </span>
              <Clock size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              ~{selectedRoute.estimatedDurationMins} mins
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Includes 8 min service time/stop
            </span>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Collection Stops
              </span>
              <MapPin size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {selectedRoute.totalStops} Stops
            </div>
            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
              {selectedRoute.status || 'ACTIVE'}
            </span>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Assigned Vehicle
              </span>
              <Truck size={16} color="#6366f1" />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              {selectedRoute.driver.vehicle_number}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {selectedRoute.driver.driver_name}
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Route Map + Sequenced Waypoints */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Route Map Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={18} color="#0284c7" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Sequenced Route Path
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
              Depot &rarr; Stops (1..{selectedRoute?.totalStops || 0}) &rarr; Composting Yard
            </span>
          </div>

          <InteractiveMap
            markers={mapMarkers}
            routePoints={routePoints}
            centerLat={28.5350}
            centerLng={77.3910}
            zoom={14}
            height="460px"
          />

          {/* Route Terminals Detail */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#334155' }}>
              <Warehouse size={16} color="#16a34a" />
              <div>
                <strong>Depot Origin:</strong> {selectedRoute?.depot?.name} (28.5320, 77.3880)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#334155' }}>
              <Warehouse size={16} color="#7c3aed" />
              <div>
                <strong>Disposal Yard:</strong> {selectedRoute?.disposalYard?.name} (28.5420, 77.4000)
              </div>
            </div>
          </div>
        </div>

        {/* Sequenced Waypoints & Stop Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Sequenced Stops ({selectedRoute?.totalStops || 0})
            </h3>
            <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
              Optimized Order
            </span>
          </div>

          {(!selectedRoute || !selectedRoute.stops || selectedRoute.stops.length === 0) ? (
            <div style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              color: '#64748b'
            }}>
              <Route size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>No collection stops assigned to this driver.</p>
              <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Assign verified pickup requests to build an optimized route.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto' }}>
              {/* Origin Terminal Node */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '0.5rem'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  0
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#14532d' }}>
                    {selectedRoute.depot?.name || 'Gram Panchayat Depot'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                    Route Departure Yard • 0.0 km
                  </div>
                </div>
              </div>

              {/* Waypoint Stops */}
              {selectedRoute.stops.map((stop, index) => (
                <div
                  key={stop.pickup_id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    borderLeft: '4px solid #0284c7'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    flexShrink: 0
                  }}>
                    {stop.sequence_order || index + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        {stop.request_code}
                      </span>
                      <span className="badge" style={{
                        backgroundColor: stop.assignment_status === 'COMPLETED' ? '#ecfdf5' : '#f0f9ff',
                        color: stop.assignment_status === 'COMPLETED' ? '#065f46' : '#0369a1',
                        fontSize: '0.7rem'
                      }}>
                        {stop.assignment_status || 'ASSIGNED'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.15rem' }}>
                      {stop.citizen_name} • Ward {stop.ward_number}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stop.address}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: '#475569', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>
                        {stop.waste_type}
                      </span>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>
                        {stop.estimated_volume_bags} Bags
                      </span>
                      {stop.preferred_time && (
                        <span style={{ backgroundColor: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>
                          {stop.preferred_time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Destination Terminal Node */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: '0.5rem'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  {selectedRoute.stops.length + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#581c87' }}>
                    {selectedRoute.disposalYard?.name || 'Gram Panchayat Composting Yard'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7e22ce' }}>
                    Disposal & Processing Destination
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
