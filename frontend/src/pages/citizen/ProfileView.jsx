import React, { useState } from 'react';
import { User, Phone, Home, MapPin, Save, CheckCircle2, Shield } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';

export function ProfileView({ user, profile, onProfileUpdated }) {
  const { showToast } = useToast();

  const [phone, setPhone] = useState(user?.phone || '');
  const [houseNumber, setHouseNumber] = useState(profile?.house_number || '');
  const [landmark, setLandmark] = useState(profile?.landmark || '');
  const [villageName, setVillageName] = useState(profile?.village_name || 'Sundarpur Gram Panchayat');
  const [wardNumber, setWardNumber] = useState(profile?.ward_number || 'Ward 4');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authApi.updateCitizenProfile({
        phone: phone.trim(),
        house_number: houseNumber.trim(),
        landmark: landmark.trim(),
        village_name: villageName.trim(),
        ward_number: wardNumber.trim()
      });

      if (res.success) {
        showToast('Profile Updated', 'Your household records have been saved.', 'success');
        if (onProfileUpdated) onProfileUpdated();
      }
    } catch (err) {
      showToast('Update Failed', err.message || 'Unable to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Household Citizen Profile
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
          Verified Gram Panchayat resident profile for waste collection scheduling.
        </p>
      </div>

      <div className="card">
        <div className="card-header" style={{ backgroundColor: '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ color: '#166534' }}>
              <Shield size={20} />
            </div>
            <div>
              <span className="card-title" style={{ fontSize: '1rem', color: '#166534' }}>
                Resident Identity & Ward Registration
              </span>
            </div>
          </div>
          <span className="badge badge-success">Verified Citizen</span>
        </div>

        <div className="card-body">
          <form onSubmit={handleSave}>
            {/* Read-Only Account Identity */}
            <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.fullName || ''}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Verified via Gram Sabha roster</span>
              </div>

              <div className="form-group">
                <label className="form-label">Official Email / Login</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Unique login identifier</span>
              </div>
            </div>

            {/* Editable Contact & Address */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Contact Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="phone"
                    type="text"
                    className="form-input"
                    placeholder="+91-98765-XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Used by driver for arrival coordination</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="wardNumber">Panchayat Ward</label>
                <input
                  id="wardNumber"
                  type="text"
                  className="form-input"
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="houseNumber">House / Holding Number</label>
                <input
                  id="houseNumber"
                  type="text"
                  className="form-input"
                  placeholder="e.g. House No. 42"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="landmark">Prominent Landmark</label>
                <input
                  id="landmark"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Near Shiv Mandir Chowk"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="villageName">Gram Panchayat Village Name</label>
              <input
                id="villageName"
                type="text"
                className="form-input"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Information'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
