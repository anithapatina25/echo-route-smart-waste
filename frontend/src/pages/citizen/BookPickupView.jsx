import React, { useState } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Upload, 
  Camera, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  ArrowRight,
  Info
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';

export function BookPickupView({ profile, onSuccess, onCancel }) {
  const { showToast } = useToast();

  const [wasteType, setWasteType] = useState('Household Waste');
  const [quantity, setQuantity] = useState(1);
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [preferredTime, setPreferredTime] = useState('Morning (08:00 - 11:00 AM)');
  const [address, setAddress] = useState(
    profile ? `${profile.house_number ? profile.house_number + ', ' : ''}${profile.landmark || 'Mandir Chowk'}, ${profile.village_name || 'Gram Panchayat'}` : ''
  );
  const [description, setDescription] = useState('');
  const [gpsLat, setGpsLat] = useState(profile?.gps_lat || 28.5355);
  const [gpsLng, setGpsLng] = useState(profile?.gps_lng || 77.3910);
  const [gpsDetecting, setGpsDetecting] = useState(false);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  const [photoError, setPhotoError] = useState(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const wasteTypes = [
    { id: 'Household Waste', label: 'Household Waste', desc: 'General segregated kitchen & domestic solid waste', icon: '🏠' },
    { id: 'Plastic Waste', label: 'Plastic Waste', desc: 'Bottles, rigid containers, wraps, recyclable dry plastics', icon: '🧴' },
    { id: 'E-Waste', label: 'E-Waste', desc: 'Old batteries, electrical cables, broken mobile phones, chargers', icon: '⚡' },
    { id: 'Bulky Waste', label: 'Bulky Waste', desc: 'Worn furniture, broken cots, tree branches, heavy debris', icon: '📦' },
    { id: 'Other', label: 'Other Waste', desc: 'Mixed organic/garden waste or non-hazardous miscellaneous', icon: '♻️' }
  ];

  const timeSlots = [
    'Morning (08:00 - 11:00 AM)',
    'Afternoon (12:00 - 03:00 PM)',
    'Evening (04:00 - 06:00 PM)'
  ];

  const handlePhotoSelect = (e) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoError('Invalid image type. Please select a JPG, PNG, or WebP photo.');
      return;
    }

    // Validate size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const base64 = loadEvt.target.result;
      setPhotoPreview(base64);
      setPhotoData(base64);
    };
    reader.onerror = () => {
      setPhotoError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoData(null);
    setPhotoError(null);
  };

  const detectGps = () => {
    if (!navigator.geolocation) {
      showToast('GPS Error', 'Geolocation is not supported by your browser.', 'error');
      return;
    }

    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(parseFloat(pos.coords.latitude.toFixed(5)));
        setGpsLng(parseFloat(pos.coords.longitude.toFixed(5)));
        setGpsDetecting(false);
        showToast('Location Detected', `Coordinates updated: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, 'success');
      },
      (err) => {
        setGpsDetecting(false);
        showToast('GPS Detection Failed', err.message || 'Unable to retrieve location. Using default village coordinates.', 'warning');
      },
      { timeout: 8000 }
    );
  };

  const validate = () => {
    const errs = {};
    if (!wasteType) errs.wasteType = 'Please select a waste type category.';
    if (!quantity || parseInt(quantity, 10) < 1) errs.quantity = 'Quantity must be at least 1 bag or unit.';
    if (!pickupDate) errs.pickupDate = 'Pickup date is required.';
    if (!preferredTime) errs.preferredTime = 'Preferred time slot is required.';
    if (!address.trim()) errs.address = 'Pickup address / landmark is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Incomplete Form', 'Please review required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        waste_type: wasteType,
        estimated_volume_bags: parseInt(quantity, 10),
        scheduled_date: pickupDate,
        preferred_time: preferredTime,
        address: address.trim(),
        description: description.trim(),
        ward_number: profile?.ward_number || 'Ward 4',
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        photo_data: photoData || null
      };

      const res = await authApi.createPickupRequest(payload);
      if (res.success) {
        showToast('Pickup Scheduled!', `Request ${res.data.request_code} registered. Admin notified.`, 'success');
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      showToast('Booking Failed', err.message || 'Could not schedule pickup request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ backgroundColor: '#f0fdf4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ color: '#166534' }}>
            <PlusCircle size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534', margin: 0 }}>
              Book Solid Waste Pickup
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Schedule doorstep collection for Gram Panchayat sanitation vehicles.
            </p>
          </div>
        </div>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* 1. Waste Type Selector */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              1. Select Waste Type <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
              {wasteTypes.map((type) => {
                const isSelected = wasteType === type.id;
                return (
                  <div
                    key={type.id}
                    onClick={() => setWasteType(type.id)}
                    style={{
                      border: isSelected ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{type.icon}</span>
                      <strong style={{ fontSize: '0.88rem', color: isSelected ? '#166534' : '#0f172a' }}>
                        {type.label}
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: '1.3' }}>
                      {type.desc}
                    </p>
                  </div>
                );
              })}
            </div>
            {errors.wasteType && <div className="form-error"><AlertCircle size={14} /><span>{errors.wasteType}</span></div>}
          </div>

          {/* 2. Quantity & Date Row */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="quantity">
                2. Estimated Quantity (Bags / Units) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max="50"
                  className={`form-input ${errors.quantity ? 'error' : ''}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isSubmitting}
                />
                <span style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  Standard Bags
                </span>
              </div>
              {errors.quantity && <div className="form-error"><AlertCircle size={14} /><span>{errors.quantity}</span></div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pickupDate">
                3. Preferred Pickup Date <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="pickupDate"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  className={`form-input ${errors.pickupDate ? 'error' : ''}`}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {errors.pickupDate && <div className="form-error"><AlertCircle size={14} /><span>{errors.pickupDate}</span></div>}
            </div>
          </div>

          {/* 3. Preferred Time Slot */}
          <div className="form-group">
            <label className="form-label">
              4. Preferred Time Slot <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem' }}>
              {timeSlots.map((slot) => {
                const isSelected = preferredTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPreferredTime(slot)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: isSelected ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#ebf7ee' : '#ffffff',
                      color: isSelected ? '#166534' : '#475569'
                    }}
                  >
                    <Clock size={15} color={isSelected ? '#166534' : '#64748b'} />
                    <span>{slot}</span>
                  </button>
                );
              })}
            </div>
            {errors.preferredTime && <div className="form-error"><AlertCircle size={14} /><span>{errors.preferredTime}</span></div>}
          </div>

          {/* 4. Address & Location Coordinates */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" htmlFor="address" style={{ margin: 0 }}>
                5. Collection Address & Landmark <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <button
                type="button"
                onClick={detectGps}
                disabled={gpsDetecting || isSubmitting}
                className="btn btn-sm btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
              >
                <MapPin size={13} />
                <span>{gpsDetecting ? 'Locating...' : 'Use Device GPS'}</span>
              </button>
            </div>
            <textarea
              id="address"
              rows={2}
              className={`form-textarea ${errors.address ? 'error' : ''}`}
              placeholder="House Number, Street Name, Nearby Temple/School/Chowk"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSubmitting}
            />
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              📍 GPS Coordinates: <span style={{ fontFamily: 'monospace' }}>{gpsLat}, {gpsLng}</span> &bull; Ward: {profile?.ward_number || 'Ward 4'}
            </div>
            {errors.address && <div className="form-error"><AlertCircle size={14} /><span>{errors.address}</span></div>}
          </div>

          {/* 5. Waste Photo Upload */}
          <div className="form-group">
            <label className="form-label">
              6. Waste Photo Upload (Optional but Recommended)
            </label>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
              Helps Panchayat drivers bring the right equipment and gauge vehicle payload space.
            </p>

            {photoPreview ? (
              <div style={{
                position: 'relative',
                display: 'inline-block',
                border: '2px solid #16a34a',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#000'
              }}>
                <img
                  src={photoPreview}
                  alt="Waste Pile Preview"
                  style={{ maxHeight: '180px', display: 'block', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(220, 38, 38, 0.9)',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Remove Photo"
                >
                  <Trash2 size={15} />
                </button>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(22, 101, 52, 0.85)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <CheckCircle2 size={13} />
                  <span>Photo Ready For Submission</span>
                </div>
              </div>
            ) : (
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}>
                <Camera size={26} color="#64748b" style={{ marginBottom: '0.35rem' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                  Click to Take Photo or Upload Image
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  JPG, PNG, WebP up to 5MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                  disabled={isSubmitting}
                />
              </label>
            )}

            {photoError && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{photoError}</span>
              </div>
            )}
          </div>

          {/* 6. Additional Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              7. Additional Instructions for Sanitation Staff (Optional)
            </label>
            <input
              id="description"
              type="text"
              className="form-input"
              placeholder="e.g. Bags kept near the rear gate; gate latch is open"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <span>Submit Pickup Request</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
