import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck, 
  User, 
  Calendar, 
  Package, 
  FileText, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export function PickupDetailsModal({ pickup, isOpen, onClose, onTrack }) {
  if (!isOpen || !pickup) return null;

  const timelineStages = pickup.timelineStages || [
    { id: 'REQUESTED', label: 'Requested', order: 1 },
    { id: 'VERIFIED', label: 'Verified', order: 2 },
    { id: 'DRIVER_ASSIGNED', label: 'Driver Assigned', order: 3 },
    { id: 'DRIVER_ON_THE_WAY', label: 'Driver On The Way', order: 4 },
    { id: 'ARRIVED', label: 'Arrived', order: 5 },
    { id: 'PICKED_UP', label: 'Picked Up', order: 6 },
    { id: 'COMPLETED', label: 'Completed', order: 7 }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-success">Completed</span>;
      case 'COLLECTED':
      case 'IN_TRANSIT':
        return <span className="badge badge-info">Active Collection</span>;
      case 'ASSIGNED':
        return <span className="badge badge-warning">Driver Assigned</span>;
      case 'VERIFIED':
        return <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>Verified</span>;
      default:
        return <span className="badge badge-warning">Requested</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="card-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fff' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', color: '#166534' }}>
                {pickup.request_code || `#REQ-${pickup.id}`}
              </span>
              {getStatusBadge(pickup.status)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
              Created: {new Date(pickup.created_at).toLocaleString()}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="toast-close"
            style={{ padding: '0.35rem', borderRadius: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="card-body">
          {/* Visual 7-Step Timeline */}
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '1rem', letterSpacing: '0.04em' }}>
              Pickup Status Progression
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {timelineStages.map((stage, idx) => {
                const isCurrent = stage.isCurrent;
                const isCompleted = stage.isCompleted;

                return (
                  <div 
                    key={stage.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem',
                      opacity: isCompleted || isCurrent ? 1 : 0.45
                    }}
                  >
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#16a34a' : (isCompleted ? '#dcfce7' : '#e2e8f0'),
                      color: isCurrent ? '#fff' : (isCompleted ? '#16a34a' : '#94a3b8'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      border: isCurrent ? '2px solid #bbf7d0' : 'none'
                    }}>
                      {isCompleted && !isCurrent ? <CheckCircle2 size={16} /> : stage.order}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          fontSize: '0.88rem', 
                          fontWeight: isCurrent ? 800 : (isCompleted ? 600 : 500),
                          color: isCurrent ? '#166534' : (isCompleted ? '#0f172a' : '#64748b')
                        }}>
                          {stage.label}
                        </span>
                        {isCurrent && (
                          <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waste Details Card */}
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h5 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Waste Specifications
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <div><strong>Waste Type:</strong> {pickup.waste_type_label || pickup.waste_type}</div>
                <div><strong>Estimated Bags:</strong> ~{pickup.estimated_volume_bags} standard bags</div>
                <div><strong>Scheduled Date:</strong> {pickup.scheduled_date || 'Today'}</div>
                <div><strong>Preferred Time:</strong> {pickup.preferred_time || 'Morning'}</div>
                {pickup.description && <div><strong>Notes:</strong> <em>"{pickup.description}"</em></div>}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h5 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Location & Collection Point
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <div><strong>Ward:</strong> {pickup.ward_number}</div>
                <div><strong>Address:</strong> {pickup.address}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>
                  GPS: {pickup.gps_lat}, {pickup.gps_lng}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Driver & Vehicle Cockpit (Read-Only) */}
          <div style={{ 
            backgroundColor: pickup.driver_name ? '#fffbeb' : '#f1f5f9', 
            padding: '1rem', 
            borderRadius: '8px', 
            border: pickup.driver_name ? '1px solid #fde68a' : '1px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Truck size={18} color={pickup.driver_name ? '#b45309' : '#64748b'} />
              <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: pickup.driver_name ? '#92400e' : '#475569', margin: 0 }}>
                {pickup.driver_name ? 'Assigned Sanitation Vehicle & Driver' : 'Driver Assignment Pending'}
              </h5>
            </div>

            {pickup.driver_name ? (
              <div className="grid-2" style={{ fontSize: '0.85rem' }}>
                <div>
                  <div><strong>Assigned Driver:</strong> {pickup.driver_name}</div>
                  <div><strong>Driver Contact:</strong> {pickup.driver_phone || 'Gram Panchayat Dispatch'}</div>
                </div>
                <div>
                  <div><strong>Vehicle Registration:</strong> <span style={{ fontFamily: 'monospace' }}>{pickup.vehicle_number}</span></div>
                  <div><strong>Vehicle Type:</strong> {pickup.vehicle_type} (Capacity: {pickup.capacity_kg || 1000} kg)</div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Admin will assign the nearest Ward vehicle once requests are verified and scheduled.
              </p>
            )}
          </div>

          {/* Uploaded Waste Photos */}
          {pickup.photos && pickup.photos.length > 0 && (
            <div>
              <h5 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Citizen Uploaded Waste Photos ({pickup.photos.length})
              </h5>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {pickup.photos.map((photo) => (
                  <a 
                    key={photo.id} 
                    href={photo.photo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ position: 'relative', display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}
                  >
                    <img 
                      src={photo.photo_url} 
                      alt="Waste Initial" 
                      style={{ width: '120px', height: '90px', objectFit: 'cover' }} 
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      padding: '0.15rem 0.35rem',
                      textAlign: 'center'
                    }}>
                      Click to View
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onTrack && (
            <button 
              onClick={() => { onClose(); onTrack(pickup.id); }} 
              className="btn btn-primary btn-sm"
            >
              <span>Open Live Tracker</span>
              <ExternalLink size={14} />
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
