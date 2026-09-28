import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  CreditCard, 
  Scale, 
  Check, 
  AlertCircle,
  Car
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';

export function AdminAddDriverModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    vehicleNumber: '',
    vehicleType: 'Tata Ace Tipper',
    licenseNumber: '',
    capacityKg: '1200',
    isOnDuty: true
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Valid email required';
    }

    if (!formData.password) {
      newErrors.password = 'Initial password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle registration number is required (e.g. GP-04-E-1025)';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'Driver license number is required';
    }

    if (!formData.capacityKg || isNaN(Number(formData.capacityKg)) || Number(formData.capacityKg) <= 0) {
      newErrors.capacityKg = 'Valid positive vehicle capacity (kg) required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const res = await authApi.createAdminDriver({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        vehicleType: formData.vehicleType,
        licenseNumber: formData.licenseNumber.trim().toUpperCase(),
        capacityKg: Number(formData.capacityKg),
        isOnDuty: formData.isOnDuty ? 1 : 0
      });

      if (res && res.success) {
        showToast(
          'Driver Enrolled',
          `Driver ${res.data.driver_name} successfully registered with vehicle ${res.data.vehicle_number}.`,
          'success'
        );
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      showToast('Registration Failed', err.message || 'Could not enroll driver', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#faf5ff',
          borderBottom: '1px solid #e9d5ff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#6b21a8',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#581c87', margin: 0 }}>
                Enroll New Fleet Driver
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#7e22ce', margin: '0.1rem 0 0' }}>
                Register driver account & sanitation vehicle into dispatch roster
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '0.35rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {/* Driver Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Driver Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="e.g. Mukesh Yadav"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: `1px solid ${errors.fullName ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none'
                  }}
                />
              </div>
              {errors.fullName && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.fullName}</span>}
            </div>

            {/* Email Address (Login) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Email (Portal Login) *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  placeholder="driver2@echoroute.gov.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: `1px solid ${errors.email ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none'
                  }}
                />
              </div>
              {errors.email && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.email}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {/* Initial Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Initial Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: `1px solid ${errors.password ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none'
                  }}
                />
              </div>
              {errors.password && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.password}</span>}
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="tel"
                  placeholder="+91-98765-00004"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vehicle & Sanitation Credentials
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {/* Vehicle Registration Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Vehicle Number *
              </label>
              <div style={{ position: 'relative' }}>
                <Car size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="e.g. GP-04-E-1025"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: `1px solid ${errors.vehicleNumber ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none'
                  }}
                />
              </div>
              {errors.vehicleNumber && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.vehicleNumber}</span>}
            </div>

            {/* Vehicle Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Vehicle Type *
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="Tata Ace Tipper">Tata Ace Tipper</option>
                <option value="Mini Compactor">Mini Compactor</option>
                <option value="Electric Auto Tipper">Electric Auto Tipper</option>
                <option value="Tractor Trolley">Tractor Trolley</option>
                <option value="Flatbed Carrier">Flatbed Carrier</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Driving License Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Driving License No. *
              </label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="e.g. DL-1420110099"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: `1px solid ${errors.licenseNumber ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none'
                  }}
                />
              </div>
              {errors.licenseNumber && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.licenseNumber}</span>}
            </div>

            {/* Capacity in KG */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Capacity (KG) *
              </label>
              <div style={{ position: 'relative' }}>
                <Scale size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="number"
                  placeholder="1200"
                  value={formData.capacityKg}
                  onChange={(e) => setFormData({ ...formData, capacityKg: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: `1px solid ${errors.capacityKg ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none'
                  }}
                />
              </div>
              {errors.capacityKg && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.capacityKg}</span>}
            </div>
          </div>

          {/* Initial Duty Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}>
            <input
              type="checkbox"
              id="initialOnDuty"
              checked={formData.isOnDuty}
              onChange={(e) => setFormData({ ...formData, isOnDuty: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="initialOnDuty" style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
              Mark as <strong>On Duty (Active)</strong> immediately upon registration
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ backgroundColor: '#6b21a8' }}
              disabled={submitting}
            >
              {submitting ? 'Registering Driver...' : 'Register Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
