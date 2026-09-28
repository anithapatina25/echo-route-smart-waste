import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  Package, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Navigation, 
  Truck, 
  FileText, 
  Upload, 
  Trash2, 
  Check, 
  ArrowRight,
  Eye,
  Info
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';

export function DriverPickupDetailsModal({ isOpen, pickup, onClose, onActionSuccess }) {
  const { showToast } = useToast();

  const [loadingAction, setLoadingAction] = useState(false);
  const [proofPhotoData, setProofPhotoData] = useState(null);
  const [proofPhotoPreview, setProofPhotoPreview] = useState(null);
  const [driverNotes, setDriverNotes] = useState('');
  const [collectedWeight, setCollectedWeight] = useState('');
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  if (!isOpen || !pickup) return null;

  const assignmentStatus = pickup.assignment_status || 'ASSIGNED';
  const pickupStatus = pickup.pickup_status || pickup.status || 'PENDING';
  const isCompleted = assignmentStatus === 'COMPLETED' || pickupStatus === 'COMPLETED';
  const pickupId = pickup.pickup_id || pickup.id;

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Please select a photo smaller than 5MB.', 'error');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showToast('Unsupported Format', 'Please upload a JPG, PNG, or WebP photo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProofPhotoData(event.target.result);
      setProofPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProofPhotoData(null);
    setProofPhotoPreview(null);
  };

  const handleAccept = async () => {
    try {
      setLoadingAction(true);
      const res = await authApi.acceptDriverAssignment(pickupId);
      if (res.success) {
        showToast('Assignment Accepted', 'You have accepted this pickup. Citizen has been notified.', 'success');
        onActionSuccess && onActionSuccess(res.data);
      }
    } catch (err) {
      showToast('Accept Failed', err.message || 'Could not accept assignment', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStatusTransition = async (action, successMsg) => {
    try {
      setLoadingAction(true);
      const res = await authApi.updateDriverPickupStatus(pickupId, action);
      if (res.success) {
        showToast('Status Updated', successMsg, 'success');
        onActionSuccess && onActionSuccess(res.data);
      }
    } catch (err) {
      showToast('Update Failed', err.message || 'Could not update status', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCompletePickup = async (e) => {
    e.preventDefault();
    if (!proofPhotoData && !pickup.proof_photo_url) {
      showToast('Proof Photo Required', 'You must capture or upload a completion proof photo.', 'error');
      return;
    }

    try {
      setLoadingAction(true);
      const res = await authApi.completeDriverPickup(pickupId, {
        photo_data: proofPhotoData,
        driver_notes: driverNotes,
        collected_weight_kg: collectedWeight ? parseFloat(collectedWeight) : null
      });

      if (res.success) {
        showToast('Pickup Completed', 'Waste pickup verified and closed. Citizen notified.', 'success');
        setProofPhotoData(null);
        setProofPhotoPreview(null);
        onActionSuccess && onActionSuccess(res.data);
      }
    } catch (err) {
      showToast('Completion Failed', err.message || 'Could not complete pickup', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const openLightbox = (url) => {
    setLightboxSrc(url);
    setShowPhotoLightbox(true);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 1000
    }}>
      <div className="card" style={{ maxWidth: '780px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: 0 }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#faf5ff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#f3e8ff',
              color: '#6b21a8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Pickup Stop: {pickup.request_code || `REQ-#${pickupId}`}
                </h3>
                <span className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`}>
                  {assignmentStatus}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Ward {pickup.ward_number || '1'} &bull; {pickup.village_name || 'Gram Panchayat'}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ color: '#94a3b8', padding: '0.35rem', borderRadius: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* 7-Step Lifecycle Timeline */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
              Pickup Lifecycle Stage
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', gap: '0.5rem', paddingBottom: '0.25rem' }}>
              {(pickup.timelineStages || [
                { id: 'REQUESTED', label: 'Requested' },
                { id: 'VERIFIED', label: 'Verified' },
                { id: 'DRIVER_ASSIGNED', label: 'Assigned' },
                { id: 'DRIVER_ON_THE_WAY', label: 'On The Way' },
                { id: 'ARRIVED', label: 'Arrived' },
                { id: 'PICKED_UP', label: 'Picked Up' },
                { id: 'COMPLETED', label: 'Completed' }
              ]).map((st, idx) => {
                const isCurrent = st.isCurrent || st.id === pickup.timelineStage;
                const isCompletedStep = st.isCompleted;

                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#6b21a8' : isCompletedStep ? '#16a34a' : '#e2e8f0',
                      color: isCurrent || isCompletedStep ? '#ffffff' : '#64748b',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isCompletedStep ? <Check size={13} /> : idx + 1}
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? '#6b21a8' : isCompletedStep ? '#16a34a' : '#64748b'
                    }}>
                      {st.label}
                    </span>
                    {idx < 6 && (
                      <span style={{ color: '#cbd5e1', fontSize: '0.8rem', marginLeft: '0.25rem' }}>&rarr;</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dual Grid: Citizen & Location / Waste Details */}
          <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Citizen Details */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1.25rem'
            }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Citizen & Location Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.86rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Citizen Resident:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{pickup.citizen_name || 'Resident'}</div>
                </div>

                {pickup.citizen_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} color="#6b21a8" />
                    <a href={`tel:${pickup.citizen_phone}`} style={{ color: '#6b21a8', fontWeight: 700 }}>
                      {pickup.citizen_phone}
                    </a>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <MapPin size={16} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{pickup.address}</div>
                    {pickup.landmark && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Landmark: Near {pickup.landmark}
                      </div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Ward {pickup.ward_number}, {pickup.village_name || 'Gram Panchayat'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Waste Specifications */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1.25rem'
            }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Waste Specifications
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.86rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Waste Category:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {pickup.waste_type_label || pickup.waste_type}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Est. Volume:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {pickup.estimated_volume_bags || 1} Bags
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Preferred Slot:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                      {pickup.preferred_time || 'Morning'}
                    </div>
                  </div>
                </div>

                {pickup.description && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Resident Instructions:</span>
                    <div style={{ fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                      &ldquo;{pickup.description}&rdquo;
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Citizen Waste Photo Section */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Citizen Waste Photo Evidence
            </h4>

            {pickup.citizen_photo_url || (pickup.photos && pickup.photos.length > 0) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <img
                  src={pickup.citizen_photo_url || pickup.photos[0].photo_url}
                  alt="Citizen Waste Upload"
                  style={{
                    width: '140px',
                    height: '105px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                  onClick={() => openLightbox(pickup.citizen_photo_url || pickup.photos[0].photo_url)}
                />
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                    Citizen Uploaded Photo
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0.5rem' }}>
                    Uploaded at pickup booking for visual quantity verification.
                  </div>
                  <button
                    type="button"
                    onClick={() => openLightbox(pickup.citizen_photo_url || pickup.photos[0].photo_url)}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <Eye size={13} />
                    <span>Enlarge Photo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '1.25rem',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.85rem'
              }}>
                <Camera size={24} color="#94a3b8" style={{ marginBottom: '0.35rem' }} />
                <div style={{ fontWeight: 600 }}>Photo unavailable</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Citizen did not attach a photograph during booking.
                </div>
              </div>
            )}
          </div>

          {/* Prototype Map / Location Card */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Navigation size={22} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, color: '#14532d', fontSize: '0.9rem' }}>
                  Ward Destination Coordinates (Prototype Display)
                </div>
                <div style={{ fontSize: '0.8rem', color: '#166534', margin: '0.25rem 0' }}>
                  Target GPS: <strong style={{ fontFamily: 'monospace' }}>{pickup.gps_lat || 28.5355}&deg; N, {pickup.gps_lng || 77.3910}&deg; E</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                  Notice: Real-time driver telemetry & live turn-by-turn routing stream will be connected in Stage 6.
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Actions & Completion Section */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem'
          }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Driver Operational Workflow
            </h4>

            {/* State 1: ASSIGNED -> Accept Assignment */}
            {assignmentStatus === 'ASSIGNED' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                    Step 1: Acknowledge & Accept Assignment
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Accepting this assignment confirms you are taking responsibility for this pickup stop.
                  </div>
                </div>
                <button
                  onClick={handleAccept}
                  disabled={loadingAction}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#6b21a8' }}
                >
                  <Check size={16} />
                  <span>{loadingAction ? 'Accepting...' : 'Accept Assignment'}</span>
                </button>
              </div>
            )}

            {/* State 2: ACCEPTED -> Start Pickup / On The Way */}
            {assignmentStatus === 'ACCEPTED' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                    Step 2: Start Trip to Location
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Notify citizen and Panchayat dispatcher that your vehicle is en route to the household.
                  </div>
                </div>
                <button
                  onClick={() => handleStatusTransition('START', 'Marked On The Way. Citizen notified.')}
                  disabled={loadingAction}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#2d6a4f' }}
                >
                  <Navigation size={16} />
                  <span>{loadingAction ? 'Updating...' : 'Start Pickup (On The Way)'}</span>
                </button>
              </div>
            )}

            {/* State 3: EN_ROUTE -> Arrived */}
            {assignmentStatus === 'EN_ROUTE' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                    Step 3: Vehicle Arrived at Stop
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Mark arrival when vehicle pulls up at citizen doorstep/bin location.
                  </div>
                </div>
                <button
                  onClick={() => handleStatusTransition('ARRIVED', 'Arrival logged. Citizen notified.')}
                  disabled={loadingAction}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#b45309' }}
                >
                  <MapPin size={16} />
                  <span>{loadingAction ? 'Updating...' : 'Mark Arrived at Stop'}</span>
                </button>
              </div>
            )}

            {/* State 4: ARRIVED -> Picked Up */}
            {assignmentStatus === 'ARRIVED' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                    Step 4: Load Waste into Vehicle
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Confirm waste bags have been collected and loaded into your sanitation vehicle.
                  </div>
                </div>
                <button
                  onClick={() => handleStatusTransition('PICKED_UP', 'Waste marked as collected.')}
                  disabled={loadingAction}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#0284c7' }}
                >
                  <Package size={16} />
                  <span>{loadingAction ? 'Updating...' : 'Confirm Picked Up'}</span>
                </button>
              </div>
            )}

            {/* State 5: PICKED_UP -> Mandatory Completion Proof Upload */}
            {(assignmentStatus === 'PICKED_UP' || (assignmentStatus !== 'COMPLETED' && pickup.picked_up_at)) && (
              <form onSubmit={handleCompletePickup} style={{ marginTop: '0.5rem' }}>
                <div style={{
                  backgroundColor: '#faf5ff',
                  border: '1.5px solid #d8b4fe',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Camera size={18} color="#6b21a8" />
                    <span style={{ fontWeight: 800, color: '#581c87', fontSize: '0.88rem' }}>
                      Step 5: Upload Mandatory Photographic Completion Proof
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#6b21a8', margin: 0 }}>
                    Per Panchayat Swachh Bharat compliance rules, drivers must photograph the cleared premises or loaded waste before finalizing the pickup.
                  </p>
                </div>

                {/* Photo Upload & Preview */}
                <div style={{ marginBottom: '1.25rem' }}>
                  {proofPhotoPreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img
                        src={proofPhotoPreview}
                        alt="Proof Preview"
                        style={{
                          width: '120px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #16a34a'
                        }}
                      />
                      <div>
                        <span className="badge badge-success" style={{ marginBottom: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle2 size={12} /> Photo Proof Ready
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="btn btn-sm btn-secondary"
                            style={{ color: '#dc2626', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Trash2 size={13} />
                            <span>Remove / Retake</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        cursor: 'pointer',
                        backgroundColor: '#f8fafc'
                      }}>
                        <Camera size={28} color="#6b21a8" style={{ marginBottom: '0.5rem' }} />
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                          Capture / Upload Completion Photo
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                          Supports JPEG, PNG, WebP (Max 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="environment"
                          onChange={handlePhotoSelect}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Optional Driver Notes & Collected Weight */}
                <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Driver Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cleared thoroughly, doorstep swept"
                      value={driverNotes}
                      onChange={(e) => setDriverNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Collected Weight (kg, Optional)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 15.0"
                      value={collectedWeight}
                      onChange={(e) => setCollectedWeight(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Complete Button */}
                <button
                  type="submit"
                  disabled={loadingAction || !proofPhotoData}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    backgroundColor: proofPhotoData ? '#16a34a' : '#94a3b8',
                    cursor: proofPhotoData ? 'pointer' : 'not-allowed',
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{loadingAction ? 'Finalizing Pickup...' : 'Complete Pickup & File Proof'}</span>
                </button>
              </form>
            )}

            {/* State 6: COMPLETED -> Read-only confirmation with proof view */}
            {isCompleted && (
              <div>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <CheckCircle2 size={24} color="#16a34a" />
                  <div>
                    <div style={{ fontWeight: 800, color: '#14532d', fontSize: '0.95rem' }}>
                      Pickup Successfully Completed
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                      Closed at {pickup.completed_at || pickup.proof_completed_at || 'Recorded'}. Proof logged into Panchayat records.
                    </div>
                  </div>
                </div>

                {pickup.proof_photo_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={pickup.proof_photo_url}
                      alt="Completion Proof"
                      style={{
                        width: '120px',
                        height: '90px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                      onClick={() => openLightbox(pickup.proof_photo_url)}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                        Filed Completion Proof Photo
                      </div>
                      {pickup.collected_weight_kg && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Payload Weight: <strong>{pickup.collected_weight_kg} kg</strong>
                        </div>
                      )}
                      {pickup.driver_notes && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem' }}>
                          &ldquo;{pickup.driver_notes}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showPhotoLightbox && lightboxSrc && (
        <div 
          onClick={() => setShowPhotoLightbox(false)}
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
            alt="Enlarged View"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
