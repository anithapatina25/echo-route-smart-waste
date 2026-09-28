import React, { useState, useEffect } from 'react';
import { 
  User, 
  Truck, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Power, 
  CheckCircle2, 
  Scale, 
  FileBadge, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';

export function DriverProfileView() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authApi.getDriverProfile();
      if (res.success) {
        setProfile(res.data);
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to load driver profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggleDuty = async () => {
    try {
      setToggling(true);
      const res = await authApi.toggleMyDriverDuty();
      if (res.success) {
        const isOnDuty = res.data.is_on_duty === 1;
        showToast(
          'Duty Status Changed',
          `You are now ${isOnDuty ? 'ON DUTY (Active Fleet)' : 'OFF DUTY (Shift Closed)'}.`,
          isOnDuty ? 'success' : 'info'
        );
        setProfile(prev => ({ ...prev, is_on_duty: res.data.is_on_duty }));
      }
    } catch (err) {
      showToast('Toggle Failed', err.message || 'Could not change duty status', 'error');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <LoadingState message="Loading driver profile..." />;
  if (!profile) return null;

  const isOnDuty = profile.is_on_duty === 1;

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Profile Header Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: isOnDuty ? '#dcfce7' : '#f1f5f9',
              color: isOnDuty ? '#16a34a' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.6rem',
              border: `2px solid ${isOnDuty ? '#16a34a' : '#cbd5e1'}`
            }}>
              {profile.driver_name?.charAt(0) || 'D'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {profile.driver_name}
                </h2>
                <span className={`badge ${isOnDuty ? 'badge-success' : ''}`} style={{ backgroundColor: isOnDuty ? undefined : '#f1f5f9', color: isOnDuty ? undefined : '#64748b' }}>
                  {isOnDuty ? 'On Duty' : 'Off Duty'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Gram Panchayat Sanitation Driver &bull; Fleet ID: DRV-{String(profile.id).padStart(3, '0')}
              </p>
            </div>
          </div>

          {/* Duty Status Switch */}
          <div>
            <button
              onClick={handleToggleDuty}
              disabled={toggling}
              className={`btn ${isOnDuty ? 'btn-outline' : 'btn-primary'}`}
              style={{
                borderColor: isOnDuty ? '#dc2626' : '#16a34a',
                color: isOnDuty ? '#dc2626' : '#ffffff',
                backgroundColor: isOnDuty ? '#ffffff' : '#16a34a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                fontSize: '0.9rem'
              }}
            >
              <Power size={16} />
              <span>{toggling ? 'Updating...' : isOnDuty ? 'Go Off Duty' : 'Go On Duty'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Vehicle Profile & Contact Credentials */}
      <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Vehicle Information */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Truck size={20} color="#6b21a8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Sanitation Vehicle Profile
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Vehicle Registration No:
              </span>
              <div style={{
                marginTop: '0.2rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#0f172a',
                display: 'inline-block'
              }}>
                {profile.vehicle_number || 'GP-04-E-1024'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Vehicle Type:
              </span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                {profile.vehicle_type || 'Tipper'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Payload Carrying Capacity:
              </span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                {profile.capacity_kg || 1200} kg
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Commercial Driving License:
              </span>
              <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569', marginTop: '0.15rem' }}>
                {profile.license_number || 'Registered'}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Service Statistics */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <User size={20} color="#6b21a8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Contact & Lifetime Service
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Mobile Contact:
              </span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={14} color="#6b21a8" />
                {profile.driver_phone || profile.phone || 'No phone'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Panchayat Email:
              </span>
              <div style={{ fontWeight: 600, color: '#475569', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={14} color="#64748b" />
                {profile.email}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Lifetime Collections Completed:
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.15rem' }}>
                {profile.totalCompleted || 0} Pickups
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Current Active Load:
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309', marginTop: '0.15rem' }}>
                {profile.activeAssignments || 0} Stops Pending
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
