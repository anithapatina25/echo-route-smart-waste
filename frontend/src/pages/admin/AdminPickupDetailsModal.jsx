import React, { useState } from 'react';
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
  Check,
  ShieldCheck,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

export function AdminPickupDetailsModal({ 
  pickup, 
  isOpen, 
  onClose, 
  onVerify, 
  onAssign, 
  drivers = [] 
}) {
  if (!isOpen || !pickup) return null;

  const [selectedDriverId, setSelectedDriverId] = useState(pickup.assigned_driver_id || '');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const timelineStages = pickup.timelineStages || [
    { id: 'REQUESTED', label: 'Requested', order: 1 },
    { id: 'VERIFIED', label: 'Verified', order: 2 },
    { id: 'DRIVER_ASSIGNED', label: 'Driver Assigned', order: 3 },
    { id: 'DRIVER_ON_THE_WAY', label: 'Driver On The Way', order: 4 },
    { id: 'ARRIVED', label: 'Arrived', order: 5 },
    { id: 'PICKED_UP', label: 'Picked Up', order: 6 },
    { id: 'COMPLETED', label: 'Completed', order: 7 }
  ];

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      if (onVerify) await onVerify(pickup.id);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    setIsAssigning(true);
    try {
      if (onAssign) await onAssign(pickup.id, selectedDriverId);
    } finally {
      setIsAssigning(false);
    }
  };

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
        return <span className="badge badge-neutral">Requested (Pending)</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div className="card-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fff' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#1b4332' }}>
                {pickup.request_code || `#REQ-${pickup.id}`}
              </span>
              {getStatusBadge(pickup.status)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
              Registered: {new Date(pickup.created_at).toLocaleString()} &bull; {pickup.ward_number}
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
          {/* Quick Admin Verification Banner if Pending */}
          {pickup.status === 'PENDING' && (
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1.5px solid #f59e0b',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#92400e', display: 'block' }}>
                  Awaiting Administrative Verification
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#78350f' }}>
                  Inspect citizen waste photos and quantity before approving for driver route dispatch.
                </span>
              </div>
              <button
                onClick={handleVerify}
                className="btn btn-sm btn-primary"
                disabled={isVerifying}
                style={{ backgroundColor: '#16a34a' }}
              >
                <Check size={14} />
                <span>{isVerifying ? 'Verifying...' : 'Verify Request'}</span>
              </button>
            </div>
          )}

          {/* Citizen Details Card */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <h5 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={15} />
              <span>Citizen Contact & Location Details</span>
            </h5>
            <div className="grid-2" style={{ fontSize: '0.85rem' }}>
              <div>
                <div><strong>Citizen Name:</strong> {pickup.citizen_name}</div>
                <div><strong>Contact Phone:</strong> {pickup.citizen_phone || 'Not provided'}</div>
                <div><strong>Email:</strong> {pickup.citizen_email}</div>
              </div>
              <div>
                <div><strong>Village / GP:</strong> {pickup.village_name || 'Gram Panchayat'}</div>
                <div><strong>Ward:</strong> {pickup.ward_number}</div>
                <div><strong>Address:</strong> {pickup.address}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                  Coordinates: {pickup.gps_lat}, {pickup.gps_lng}
                </div>
              </div>
            </div>
          </div>

          {/* Waste Info Card */}
          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h5 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Waste Parameters
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                <div><strong>Waste Category:</strong> {pickup.waste_type_label || pickup.waste_type}</div>
                <div><strong>Volume Estimate:</strong> ~{pickup.estimated_volume_bags} Bags</div>
                <div><strong>Pickup Schedule:</strong> {pickup.scheduled_date}</div>
                <div><strong>Preferred Slot:</strong> {pickup.preferred_time || 'Morning'}</div>
                {pickup.description && <div><strong>Citizen Note:</strong> <em>"{pickup.description}"</em></div>}
              </div>
            </div>

            {/* Driver Assignment Widget */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h5 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Truck size={15} />
                <span>Driver & Fleet Dispatch</span>
              </h5>

              {pickup.driver_name ? (
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div><strong>Assigned Driver:</strong> {pickup.driver_name}</div>
                  <div><strong>Driver Phone:</strong> {pickup.driver_phone || 'Dispatch Radio'}</div>
                  <div><strong>Vehicle:</strong> <span style={{ fontFamily: 'monospace' }}>{pickup.vehicle_number}</span> ({pickup.vehicle_type})</div>
                  <div><strong>Payload Limit:</strong> {pickup.capacity_kg || 1000} kg</div>
                </div>
              ) : (
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    Select On-Duty Driver:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      disabled={isAssigning}
                    >
                      <option value="">-- Choose Driver --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.driver_name} ({d.vehicle_number} - {d.vehicle_type}) {d.is_on_duty ? '✓ On Duty' : '○ Off Duty'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedDriverId || isAssigning}
                      className="btn btn-sm btn-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {isAssigning ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Citizen Uploaded Waste Photo */}
          {pickup.photos && pickup.photos.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h5 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Citizen Waste Site Inspection Photos ({pickup.photos.length})
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
                      alt="Waste Site"
                      style={{ width: '130px', height: '95px', objectFit: 'cover' }}
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
                      Click to Enlarge
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 7-Step Timeline Stepper */}
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h5 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Lifecycle Status Breakdown
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {timelineStages.map((stage) => {
                const isCurrent = stage.isCurrent;
                const isCompleted = stage.isCompleted;

                return (
                  <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: isCompleted || isCurrent ? 1 : 0.45 }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#16a34a' : (isCompleted ? '#dcfce7' : '#e2e8f0'),
                      color: isCurrent ? '#fff' : (isCompleted ? '#16a34a' : '#94a3b8'),
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isCompleted && !isCurrent ? <Check size={12} /> : stage.order}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#166534' : '#334155' }}>
                      {stage.label}
                    </span>
                    {isCurrent && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Active Stage</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
