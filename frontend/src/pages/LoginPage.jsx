import React, { useState } from 'react';
import { Users, Truck, ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [portalRole, setPortalRole] = useState('CITIZEN'); // CITIZEN, DRIVER, ADMIN
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Demo accounts specification
  const demoAccounts = {
    CITIZEN: {
      email: 'citizen@echoroute.gov.in',
      password: 'citizen123',
      label: 'Citizen Demo',
      name: 'Ramesh Patel (Ward 4 Resident)',
      badge: 'Mobile-First Portal'
    },
    DRIVER: {
      email: 'driver@echoroute.gov.in',
      password: 'driver123',
      label: 'Driver Demo',
      name: 'Suresh Kumar (Tata Ace Tipper GP-04-E-1024)',
      badge: 'Vehicle Routing Portal'
    },
    ADMIN: {
      email: 'admin@echoroute.gov.in',
      password: 'admin123',
      label: 'Admin Demo',
      name: 'Officer Anil Sharma (Admin)',
      badge: 'Command Center'
    }
  };

  const handleFillDemo = (roleKey) => {
    setPortalRole(roleKey);
    setEmail(demoAccounts[roleKey].email);
    setPassword(demoAccounts[roleKey].password);
    setFormErrors({});
    setServerError('');
  };

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email or username is required';
    } else if (!email.includes('@') && email.length < 3) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const user = await login(email, password, portalRole);
      showToast('Authentication Successful', `Welcome, ${user.fullName} (${user.role})`, 'success');

      // Role-specific redirect
      if (user.role === 'CITIZEN') {
        onNavigate('/citizen');
      } else if (user.role === 'DRIVER') {
        onNavigate('/driver');
      } else if (user.role === 'ADMIN') {
        onNavigate('/admin');
      } else {
        onNavigate('/');
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please verify credentials.');
      showToast('Login Failed', err.message || 'Check your credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getPortalTheme = () => {
    switch (portalRole) {
      case 'CITIZEN':
        return {
          title: 'Citizen Portal',
          subtitle: 'Schedule domestic waste pickups, upload photos, and track collection.',
          accent: '#16a34a',
          bgLight: '#f0fdf4',
          icon: <Users size={22} color="#16a34a" />
        };
      case 'DRIVER':
        return {
          title: 'Driver Portal',
          subtitle: 'Access sequenced route stops, update statuses, and submit photo proof.',
          accent: '#b45309',
          bgLight: '#fffbeb',
          icon: <Truck size={22} color="#b45309" />
        };
      case 'ADMIN':
        return {
          title: 'Admin Portal',
          subtitle: 'Manage pickup queue, assign driver fleet, inspect completion records.',
          accent: '#6b21a8',
          bgLight: '#faf5ff',
          icon: <ShieldCheck size={22} color="#6b21a8" />
        };
      default:
        return { title: 'Portal Login', accent: '#1b4332', bgLight: '#f8fafc', icon: null };
    }
  };

  const theme = getPortalTheme();

  return (
    <div style={{ padding: '3rem 0', minHeight: 'calc(100vh - 180px)' }}>
      <div className="container-narrow">
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>Central Access Portal</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#122b20' }}>
            ECHO ROUTE SMART WASTE
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Select your assigned role to access your dedicated workspace.
          </p>
        </div>

        {/* 1. Three Visible Portal Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          backgroundColor: '#e2e8f0',
          padding: '0.4rem',
          borderRadius: '12px',
          marginBottom: '1.75rem'
        }}>
          {[
            { key: 'CITIZEN', label: 'CITIZEN', icon: <Users size={16} /> },
            { key: 'DRIVER', label: 'DRIVER', icon: <Truck size={16} /> },
            { key: 'ADMIN', label: 'ADMIN', icon: <ShieldCheck size={16} /> }
          ].map((item) => {
            const isSelected = portalRole === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setPortalRole(item.key);
                  setServerError('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  backgroundColor: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#0f172a' : '#64748b',
                  boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: isSelected ? '1px solid #cbd5e1' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Login Card */}
        <div className="card" style={{ borderTop: `4px solid ${theme.accent}` }}>
          <div className="card-header" style={{ backgroundColor: theme.bgLight }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {theme.icon}
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                  {theme.title}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  {theme.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="card-body">
            {serverError && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                color: '#b91c1c',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Authentication Failed:</strong> {serverError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email / Official Username
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="email"
                    type="text"
                    className={`form-input ${formErrors.email ? 'error' : ''}`}
                    placeholder={`e.g. ${demoAccounts[portalRole].email}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                {formErrors.email && (
                  <div className="form-error">
                    <AlertCircle size={14} />
                    <span>{formErrors.email}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type="password"
                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                {formErrors.password && (
                  <div className="form-error">
                    <AlertCircle size={14} />
                    <span>{formErrors.password}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={isLoading}
                style={{ backgroundColor: theme.accent }}
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Log In to {portalRole} Workspace</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 1-Click Demo Credentials Panel */}
        <div className="card" style={{ marginTop: '1.75rem', backgroundColor: '#f8fafc' }}>
          <div className="card-header" style={{ backgroundColor: '#f1f5f9' }}>
            <span className="card-title" style={{ fontSize: '0.95rem' }}>
              🔑 Prototype Demo Credentials (1-Click Fill)
            </span>
            <span className="badge badge-info">For Testing</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              Click any role box below to automatically populate test credentials into the login form:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {Object.keys(demoAccounts).map((roleKey) => {
                const acc = demoAccounts[roleKey];
                const isCurrent = portalRole === roleKey;
                return (
                  <div
                    key={roleKey}
                    onClick={() => handleFillDemo(roleKey)}
                    style={{
                      border: isCurrent ? '2px solid #2d6a4f' : '1px solid #cbd5e1',
                      backgroundColor: isCurrent ? '#ebf7ee' : '#ffffff',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{acc.label}</strong>
                      {isCurrent && <CheckCircle2 size={16} color="#2d6a4f" />}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.2rem' }}>
                      <strong>User:</strong> <span style={{ fontFamily: 'monospace' }}>{acc.email}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.4rem' }}>
                      <strong>Pass:</strong> <span style={{ fontFamily: 'monospace' }}>{acc.password}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {acc.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
