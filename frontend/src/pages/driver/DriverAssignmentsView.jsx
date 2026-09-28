import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  Check, 
  Navigation, 
  Eye, 
  AlertCircle,
  Truck
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { DriverPickupDetailsModal } from './DriverPickupDetailsModal';

export function DriverAssignmentsView({ initialFilter = 'all' }) {
  const { showToast } = useToast();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Details Modal
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPickups = async (filterKey) => {
    try {
      setLoading(true);
      const res = await authApi.getDriverPickups(filterKey);
      if (res.success) {
        setPickups(res.data);
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to load driver assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups(filter);
  }, [filter]);

  const handleOpenDetails = (pickup) => {
    setSelectedPickup(pickup);
    setModalOpen(true);
  };

  const handleQuickAccept = async (pickupId) => {
    try {
      const res = await authApi.acceptDriverAssignment(pickupId);
      if (res.success) {
        showToast('Assignment Accepted', 'Pickup accepted. Citizen notified.', 'success');
        fetchPickups(filter);
      }
    } catch (err) {
      showToast('Accept Failed', err.message || 'Could not accept assignment', 'error');
    }
  };

  const handleQuickStart = async (pickupId) => {
    try {
      const res = await authApi.updateDriverPickupStatus(pickupId, 'START');
      if (res.success) {
        showToast('On The Way', 'Status updated to Driver On The Way. Citizen notified.', 'success');
        fetchPickups(filter);
      }
    } catch (err) {
      showToast('Update Failed', err.message || 'Could not update status', 'error');
    }
  };

  const filteredPickups = pickups.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = p.request_code?.toLowerCase().includes(q) || String(p.pickup_id).includes(q);
      const matchName = p.citizen_name?.toLowerCase().includes(q);
      const matchAddress = p.address?.toLowerCase().includes(q) || p.village_name?.toLowerCase().includes(q);
      const matchWaste = p.waste_type?.toLowerCase().includes(q) || p.waste_type_label?.toLowerCase().includes(q);
      const matchWard = String(p.ward_number || '').includes(q);
      return matchCode || matchName || matchAddress || matchWaste || matchWard;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return <span className="badge badge-warning">New Assignment</span>;
      case 'ACCEPTED':
        return <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>Accepted</span>;
      case 'EN_ROUTE':
        return <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>On The Way</span>;
      case 'ARRIVED':
        return <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Arrived</span>;
      case 'PICKED_UP':
        return <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}>Picked Up</span>;
      case 'COMPLETED':
        return <span className="badge badge-success">Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Control Bar: Filters & Search */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
            />
            <input
              type="text"
              placeholder="Search request code, citizen, address, ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                fontSize: '0.88rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Assigned' },
              { id: 'today', label: "Today's" },
              { id: 'pending', label: 'Pending' },
              { id: 'active', label: 'Active Stops' },
              { id: 'completed', label: 'Completed' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: filter === tab.id ? '#6b21a8' : '#e2e8f0',
                  backgroundColor: filter === tab.id ? '#6b21a8' : '#ffffff',
                  color: filter === tab.id ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={() => fetchPickups(filter)}
              className="btn btn-outline btn-sm"
              title="Refresh Assignments"
              style={{ padding: '0.45rem 0.65rem' }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <LoadingState message="Loading your assigned pickup stops..." />
      ) : filteredPickups.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Assigned Pickups Found"
          message={
            searchQuery.trim()
              ? `No assigned pickups matched "${searchQuery}".`
              : 'There are currently no pickups assigned to your vehicle under this filter.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredPickups.map((p) => {
            const isAssigned = p.assignment_status === 'ASSIGNED';
            const isAccepted = p.assignment_status === 'ACCEPTED';
            const isActive = ['EN_ROUTE', 'ARRIVED', 'PICKED_UP'].includes(p.assignment_status);
            const isCompleted = p.assignment_status === 'COMPLETED';

            return (
              <div
                key={p.assignment_id || p.pickup_id}
                className="card"
                style={{
                  padding: '1.25rem',
                  borderLeft: `4px solid ${
                    isCompleted ? '#16a34a' : isActive ? '#6b21a8' : isAccepted ? '#2563eb' : '#d97706'
                  }`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  {/* Left: Code, Citizen & Waste Details */}
                  <div style={{ flex: '1 1 340px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: '#6b21a8'
                      }}>
                        {p.request_code}
                      </span>
                      {getStatusBadge(p.assignment_status)}
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        Ward {p.ward_number}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                      {p.waste_type_label || p.waste_type} &bull; {p.estimated_volume_bags || 1} Bag(s)
                    </h4>

                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.35rem' }}>
                      Resident: <strong>{p.citizen_name}</strong>
                      {p.citizen_phone && (
                        <span style={{ marginLeft: '0.5rem', color: '#6b21a8' }}>
                          &bull; {p.citizen_phone}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.82rem', marginTop: '0.35rem' }}>
                      <MapPin size={14} color="#dc2626" />
                      <span>{p.address} ({p.village_name || 'Village'})</span>
                    </div>
                  </div>

                  {/* Middle: Schedule & Time */}
                  <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
                      <Calendar size={14} color="#6b21a8" />
                      <span>Date: <strong>{p.scheduled_date || 'Scheduled Today'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
                      <Clock size={14} color="#6b21a8" />
                      <span>Slot: {p.preferred_time || 'Morning'}</span>
                    </div>
                    {p.vehicle_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', marginTop: '0.2rem' }}>
                        <Truck size={14} color="#64748b" />
                        <span>Vehicle: <strong style={{ fontFamily: 'monospace' }}>{p.vehicle_number}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isAssigned && (
                      <button
                        onClick={() => handleQuickAccept(p.pickup_id)}
                        className="btn btn-sm btn-primary"
                        style={{ backgroundColor: '#6b21a8' }}
                      >
                        <Check size={14} />
                        <span>Accept</span>
                      </button>
                    )}

                    {isAccepted && (
                      <button
                        onClick={() => handleQuickStart(p.pickup_id)}
                        className="btn btn-sm btn-primary"
                        style={{ backgroundColor: '#2d6a4f' }}
                      >
                        <Navigation size={14} />
                        <span>Start Trip</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenDetails(p)}
                      className="btn btn-sm btn-outline"
                    >
                      <Eye size={14} />
                      <span>{isCompleted ? 'View Proof' : 'Details & Action'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details & Workflow Modal */}
      <DriverPickupDetailsModal
        isOpen={modalOpen}
        pickup={selectedPickup}
        onClose={() => {
          setModalOpen(false);
          setSelectedPickup(null);
        }}
        onActionSuccess={(updated) => {
          setSelectedPickup(updated);
          fetchPickups(filter);
        }}
      />
    </div>
  );
}
