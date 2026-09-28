import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Check, 
  Truck, 
  Eye, 
  Filter, 
  RefreshCw, 
  Clock, 
  MapPin, 
  User, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { AdminPickupDetailsModal } from './AdminPickupDetailsModal';

export function AdminPickupRequestsView() {
  const { showToast } = useToast();

  const [pickups, setPickups] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [selectedPickup, setSelectedPickup] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Quick Driver Assign State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetPickup, setAssignTargetPickup] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchPickups = async (filterKey) => {
    try {
      setLoading(true);
      const res = await authApi.getAdminPickups(filterKey);
      if (res.success) {
        setPickups(res.data);
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to fetch pickup requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await authApi.getAdminDrivers();
      if (res.success) {
        setDrivers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch drivers list:', err);
    }
  };

  useEffect(() => {
    fetchPickups(filter);
    fetchDrivers();
  }, [filter]);

  const handleVerify = async (pickupId) => {
    try {
      const res = await authApi.verifyPickup(pickupId);
      if (res.success) {
        showToast('Request Verified', `Pickup request ${res.data.request_code} has been verified and queued for dispatch.`, 'success');
        fetchPickups(filter);
        if (selectedPickup && selectedPickup.id === pickupId) {
          setSelectedPickup(res.data);
        }
      }
    } catch (err) {
      showToast('Verification Failed', err.message || 'Could not verify request', 'error');
    }
  };

  const handleAssignDriver = async (pickupId, driverId) => {
    try {
      const res = await authApi.assignDriverToPickup(pickupId, driverId);
      if (res.success) {
        showToast('Driver Assigned', `Assigned driver to request ${res.data.request_code}.`, 'success');
        setAssignModalOpen(false);
        setAssignTargetPickup(null);
        setSelectedDriverId('');
        fetchPickups(filter);
        if (selectedPickup && selectedPickup.id === pickupId) {
          setSelectedPickup(res.data);
        }
      }
    } catch (err) {
      showToast('Assignment Failed', err.message || 'Could not assign driver', 'error');
    }
  };

  const handleOpenDetails = async (pickupId) => {
    try {
      const res = await authApi.getAdminPickupById(pickupId);
      if (res.success) {
        setSelectedPickup(res.data);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      showToast('Error', 'Unable to retrieve pickup details', 'error');
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All Requests' },
    { key: 'pending', label: 'Requested (Pending)' },
    { key: 'verified', label: 'Verified' },
    { key: 'assigned', label: 'Driver Assigned' },
    { key: 'active', label: 'In Progress' },
    { key: 'completed', label: 'Completed' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-success">Completed</span>;
      case 'COLLECTED':
      case 'IN_TRANSIT':
        return <span className="badge badge-info">In Transit</span>;
      case 'ASSIGNED':
        return <span className="badge badge-warning">Driver Assigned</span>;
      case 'VERIFIED':
        return <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>Verified</span>;
      default:
        return <span className="badge badge-neutral">Requested</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Pickup Requests Management
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Verify incoming citizen requests, assign Gram Panchayat collection tippers, and inspect photographic records.
          </p>
        </div>

        <button onClick={() => fetchPickups(filter)} className="btn btn-sm btn-secondary">
          <RefreshCw size={14} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {filterTabs.map((tab) => {
          const isSelected = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                border: isSelected ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                backgroundColor: isSelected ? '#dcfce7' : '#ffffff',
                color: isSelected ? '#166534' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table Content */}
      {loading ? (
        <LoadingState message="Loading operational pickup queue..." />
      ) : pickups.length === 0 ? (
        <EmptyState
          title="No Requests Match Filter"
          message={`There are currently no pickup requests categorized under "${filter}".`}
          icon={Package}
        />
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1rem' }}>Request Code</th>
                <th style={{ padding: '0.85rem 1rem' }}>Citizen / Ward</th>
                <th style={{ padding: '0.85rem 1rem' }}>Waste Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Quantity</th>
                <th style={{ padding: '0.85rem 1rem' }}>Schedule & Slot</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Assigned Fleet</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.1s ease' }}>
                  {/* Request Code */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#166534' }}>
                      {p.request_code || `#REQ-${p.id}`}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Citizen */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <strong style={{ color: '#0f172a', display: 'block' }}>{p.citizen_name}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {p.ward_number} &bull; {p.citizen_phone || 'No phone'}
                    </span>
                  </td>

                  {/* Waste Type */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                      {p.waste_type_label || p.waste_type}
                    </span>
                    {p.photo_count > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '0.15rem' }}>
                        📷 Photo Attached
                      </div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: 600 }}>
                    ~{p.estimated_volume_bags} Bags
                  </td>

                  {/* Schedule */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.scheduled_date}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.preferred_time || 'Morning'}</div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {getStatusBadge(p.status)}
                  </td>

                  {/* Assigned Driver */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {p.driver_name ? (
                      <div>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{p.driver_name}</strong>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#92400e' }}>
                          {p.vehicle_number}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                      {p.status === 'PENDING' && (
                        <button
                          onClick={() => handleVerify(p.id)}
                          className="btn btn-sm btn-primary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', backgroundColor: '#16a34a' }}
                          title="Verify Pickup Request"
                        >
                          <Check size={13} />
                          <span>Verify</span>
                        </button>
                      )}

                      {(p.status === 'VERIFIED' || (p.status === 'PENDING' && !p.driver_name)) && (
                        <button
                          onClick={() => {
                            setAssignTargetPickup(p);
                            setSelectedDriverId(p.assigned_driver_id || '');
                            setAssignModalOpen(true);
                          }}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                          title="Assign Collection Driver"
                        >
                          <Truck size={13} />
                          <span>Assign</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenDetails(p.id)}
                        className="btn btn-sm btn-outline"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                        title="View Full Details & Photos"
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      <AdminPickupDetailsModal
        pickup={selectedPickup}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onVerify={handleVerify}
        onAssign={handleAssignDriver}
        drivers={drivers}
      />

      {/* Quick Assign Driver Dialog */}
      {assignModalOpen && assignTargetPickup && (
        <div className="modal-overlay" onClick={() => setAssignModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '1rem' }}>
                Assign Driver & Vehicle to {assignTargetPickup.request_code}
              </span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                Stop: <strong>{assignTargetPickup.address}</strong> ({assignTargetPickup.ward_number}) &bull; Waste: {assignTargetPickup.waste_type}
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="quickDriverSelect">Select Panchayat Sanitation Driver:</label>
                <select
                  id="quickDriverSelect"
                  className="form-select"
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                >
                  <option value="">-- Choose On-Duty Fleet Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.driver_name} - {d.vehicle_number} ({d.vehicle_type}, {d.capacity_kg}kg) {d.is_on_duty ? '✓ On Duty' : '○ Off Duty'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setAssignModalOpen(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={() => handleAssignDriver(assignTargetPickup.id, selectedDriverId)}
                disabled={!selectedDriverId || isAssigning}
                className="btn btn-primary btn-sm"
              >
                {isAssigning ? 'Dispatching...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
