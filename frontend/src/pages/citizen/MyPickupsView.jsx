import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Filter, 
  Clock, 
  MapPin, 
  Truck, 
  Eye, 
  Navigation, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { PickupDetailsModal } from './PickupDetailsModal';

export function MyPickupsView({ onBookNew, onTrackPickup }) {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPickups = async (filterKey) => {
    try {
      setLoading(true);
      const res = await authApi.getCitizenPickups(filterKey);
      if (res.success) {
        setPickups(res.data);
      }
    } catch (err) {
      console.error('Failed to load citizen pickups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups(filter);
  }, [filter]);

  const handleOpenDetails = async (pickupId) => {
    try {
      const res = await authApi.getCitizenPickupById(pickupId);
      if (res.success) {
        setSelectedPickup(res.data);
        setModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to get pickup details:', err);
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All Requests' },
    { key: 'requested', label: 'Requested' },
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
        return <span className="badge badge-warning">Assigned</span>;
      case 'VERIFIED':
        return <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>Verified</span>;
      default:
        return <span className="badge badge-neutral">Requested</span>;
    }
  };

  return (
    <div>
      {/* Header & New Booking Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            My Pickup Requests
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Track and manage all scheduled waste collections for your household.
          </p>
        </div>
        <button onClick={onBookNew} className="btn btn-primary btn-sm">
          <PlusCircle size={15} />
          <span>Book New Pickup</span>
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

      {/* Content */}
      {loading ? (
        <LoadingState message="Fetching pickup records..." />
      ) : pickups.length === 0 ? (
        <EmptyState
          title="No Pickup Records Found"
          message={`No requests match the "${filter}" filter. Book a new waste pickup to get started.`}
          actionLabel="Book a Waste Pickup"
          onAction={onBookNew}
          icon={Package}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pickups.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderLeft: p.status === 'COMPLETED' ? '4px solid #16a34a' : '4px solid #b45309'
              }}
            >
              {/* Left Details */}
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: '#1b4332' }}>
                    {p.request_code || `#REQ-${p.id}`}
                  </span>
                  {getStatusBadge(p.status)}
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                    {p.waste_type_label || p.waste_type}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {p.address}
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                  <span>📅 <strong>Scheduled:</strong> {p.scheduled_date}</span>
                  <span>⏰ <strong>Time:</strong> {p.preferred_time || 'Morning'}</span>
                  <span>📦 <strong>Volume:</strong> ~{p.estimated_volume_bags} Bags</span>
                </div>

                {p.driver_name && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Truck size={14} />
                    <span><strong>Driver:</strong> {p.driver_name} ({p.vehicle_number})</span>
                  </div>
                )}
              </div>

              {/* Right Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => handleOpenDetails(p.id)}
                  className="btn btn-sm btn-outline"
                >
                  <Eye size={14} />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => onTrackPickup(p.id)}
                  className="btn btn-sm btn-primary"
                >
                  <Navigation size={14} />
                  <span>Track</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <PickupDetailsModal
        pickup={selectedPickup}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTrack={onTrackPickup}
      />
    </div>
  );
}
