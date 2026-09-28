import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Search, 
  RefreshCw, 
  Camera, 
  Calendar, 
  MapPin, 
  User, 
  Scale, 
  FileText,
  Eye,
  Package
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

export function DriverCompletedView() {
  const { showToast } = useToast();
  const [completedList, setCompletedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const fetchCompleted = async () => {
    try {
      setLoading(true);
      const res = await authApi.getDriverCompletedPickups();
      if (res.success) {
        setCompletedList(res.data);
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to load completed pickups', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, []);

  const filtered = completedList.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = p.request_code?.toLowerCase().includes(q) || String(p.pickup_id).includes(q);
      const matchCitizen = p.citizen_name?.toLowerCase().includes(q);
      const matchWaste = p.waste_type?.toLowerCase().includes(q) || p.waste_type_label?.toLowerCase().includes(q);
      const matchAddress = p.address?.toLowerCase().includes(q) || p.village_name?.toLowerCase().includes(q);
      const matchNotes = p.driver_notes?.toLowerCase().includes(q) || p.proof_notes?.toLowerCase().includes(q);
      return matchCode || matchCitizen || matchWaste || matchAddress || matchNotes;
    }
    return true;
  });

  return (
    <div>
      {/* Search & Refresh Header */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '420px' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
            />
            <input
              type="text"
              placeholder="Search request code, resident, address, notes..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
              Total Completed: <strong style={{ color: '#16a34a' }}>{completedList.length}</strong>
            </span>
            <button
              onClick={fetchCompleted}
              className="btn btn-outline btn-sm"
              title="Refresh Completed"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Completed Pickups Grid */}
      {loading ? (
        <LoadingState message="Loading completed pickups archive..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Completed Pickups"
          message={
            searchQuery.trim()
              ? `No completed records matched "${searchQuery}".`
              : 'You have not marked any pickups as completed yet.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((item) => (
            <div
              key={item.assignment_id || item.pickup_id}
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: '4px solid #16a34a'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}>
                {/* Proof Thumbnail */}
                <div style={{ flexShrink: 0 }}>
                  {item.proof_photo_url ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={item.proof_photo_url}
                        alt="Completion Proof"
                        style={{
                          width: '120px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer'
                        }}
                        onClick={() => setLightboxSrc(item.proof_photo_url)}
                      />
                      <button
                        type="button"
                        onClick={() => setLightboxSrc(item.proof_photo_url)}
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          color: '#ffffff',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        <Eye size={11} />
                        <span>View</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      width: '120px',
                      height: '90px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      fontSize: '0.75rem'
                    }}>
                      <Camera size={20} />
                      <span>No photo</span>
                    </div>
                  )}
                </div>

                {/* Main Information */}
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      color: '#6b21a8'
                    }}>
                      {item.request_code}
                    </span>
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={12} /> Closed & Completed
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Ward {item.ward_number} &bull; {item.village_name || 'Village'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                    {item.waste_type_label || item.waste_type} &bull; {item.estimated_volume_bags || 1} Bag(s)
                  </h4>

                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                    Citizen: <strong>{item.citizen_name}</strong> {item.citizen_phone ? `(${item.citizen_phone})` : ''}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                    <MapPin size={13} color="#dc2626" />
                    <span>{item.address}</span>
                  </div>

                  {(item.driver_notes || item.proof_notes) && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '0.4rem 0.65rem',
                      fontSize: '0.78rem',
                      color: '#334155',
                      fontStyle: 'italic',
                      marginTop: '0.5rem'
                    }}>
                      &ldquo;{item.driver_notes || item.proof_notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Audit & Metrics */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  color: '#64748b',
                  minWidth: '180px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={13} color="#16a34a" />
                    <span>Completed: <strong>{item.completed_at ? new Date(item.completed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Verified'}</strong></span>
                  </div>

                  {item.collected_weight_kg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', fontWeight: 600 }}>
                      <Scale size={13} color="#6b21a8" />
                      <span>Payload: {item.collected_weight_kg} kg</span>
                    </div>
                  )}

                  <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                    Locked record (non-editable)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Zoom Lightbox */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1.5rem',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={lightboxSrc}
            alt="Enlarged Proof"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
