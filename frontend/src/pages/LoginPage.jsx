import React, { useState } from 'react';
import { Users, Truck, ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, UserPlus, Phone, Home, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage({ onNavigate }) {
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [portalRole, setPortalRole] = useState('CITIZEN'); // CITIZEN, DRIVER, ADMIN
  const [isRegistering, setIsRegistering] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWardNumber, setRegWardNumber] = useState('Ward 4');
  const [regHouseNumber, setRegHouseNumber] = useState('');
  const [regLandmark, setRegLandmark] = useState('');

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

  const handleRoleChange = (roleKey) => {
    setPortalRole(roleKey);
    if (roleKey !== 'CITIZEN') {
      setIsRegistering(false);
    }
    setFormErrors({});
    setServerError('');
  };

  const handleFillDemo = (roleKey) => {
    setPortalRole(roleKey);
    setIsRegistering(false);
    setEmail(demoAccounts[roleKey].email);
    setPassword(demoAccounts[roleKey].password);
    setFormErrors({});
    setServerError('');
  };

  const validateLogin = () => {
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

  const validateRegister = () => {
    const errors = {};
    if (!regFullName.trim()) {
      errors.regFullName = 'Full Name is required';
    }
    if (!regEmail.trim()) {
      errors.regEmail = 'Email address is required';
    } else if (!regEmail.includes('@') || regEmail.length < 5) {
      errors.regEmail = 'Please enter a valid email address';
    }
    if (!regPassword) {
      errors.regPassword = 'Password is required';
    } else if (regPassword.length < 4) {
      errors.regPassword = 'Password must be at least 4 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const user = await login(email, password, portalRole);
      showToast('Authentication Successful', `Welcome, ${user.fullName} (${user.role})`, 'success');

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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateRegister()) return;

    setIsLoading(true);
    try {
      const newUser = await register({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        phone: regPhone,
        wardNumber: regWardNumber,
        houseNumber: regHouseNumber,
        landmark: regLandmark
      });

      showToast('Registration Successful', `Welcome to Echo Route, ${newUser.fullName}!`, 'success');
      onNavigate('/citizen');
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check details.');
      showToast('Registration Failed', err.message || 'Check your details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getPortalTheme = () => {
    switch (portalRole) {
      case 'CITIZEN':
        return {
          title: isRegistering ? 'Resident Account Registration' : 'Citizen Portal',
          subtitle: isRegistering
            ? 'Create a new citizen account to schedule pickups and track collection.'
            : 'Schedule domestic waste pickups, upload photos, and track collection.',
          accent: '#16a34a',
          bgLight: '#f0fdf4',
          icon: isRegistering ? <UserPlus size={22} color="#16a34a" /> : <Users size={22} color="#16a34a" />
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
                onClick={() => handleRoleChange(item.key)}
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

        {/* Card */}
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
            {/* Citizen Portal Sub-Toggle: Login vs Register */}
            {portalRole === 'CITIZEN' && (
              <div style={{
                display: 'flex',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                padding: '0.25rem',
                marginBottom: '1.25rem'
              }}>
                <button
                  type="button"
                  onClick={() => { setIsRegistering(false); setServerError(''); setFormErrors({}); }}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    borderRadius: '6px',
                    fontWeight: !isRegistering ? 700 : 500,
                    fontSize: '0.85rem',
                    backgroundColor: !isRegistering ? '#ffffff' : 'transparent',
                    color: !isRegistering ? '#16a34a' : '#64748b',
                    border: 'none',
                    boxShadow: !isRegistering ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Log In to Existing Account
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); setServerError(''); setFormErrors({}); }}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    borderRadius: '6px',
                    fontWeight: isRegistering ? 700 : 500,
                    fontSize: '0.85rem',
                    backgroundColor: isRegistering ? '#ffffff' : 'transparent',
                    color: isRegistering ? '#16a34a' : '#64748b',
                    border: 'none',
                    boxShadow: isRegistering ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Create New Account
                </button>
              </div>
            )}

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
                  <strong>Action Failed:</strong> {serverError}
                </div>
              </div>
            )}

            {!isRegistering ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit}>
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
            ) : (
              /* CITIZEN REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="regFullName">
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="regFullName"
                    type="text"
                    className={`form-input ${formErrors.regFullName ? 'error' : ''}`}
                    placeholder="e.g. Anish Kumar"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    disabled={isLoading}
                  />
                  {formErrors.regFullName && (
                    <div className="form-error">
                      <AlertCircle size={14} />
                      <span>{formErrors.regFullName}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="regEmail">
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="regEmail"
                    type="email"
                    className={`form-input ${formErrors.regEmail ? 'error' : ''}`}
                    placeholder="e.g. resident@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  {formErrors.regEmail && (
                    <div className="form-error">
                      <AlertCircle size={14} />
                      <span>{formErrors.regEmail}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="regPassword">
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="regPassword"
                    type="password"
                    className={`form-input ${formErrors.regPassword ? 'error' : ''}`}
                    placeholder="Create a password (min. 4 characters)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {formErrors.regPassword && (
                    <div className="form-error">
                      <AlertCircle size={14} />
                      <span>{formErrors.regPassword}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="regPhone">
                    Phone Number
                  </label>
                  <input
                    id="regPhone"
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="regWardNumber">
                      Ward Number
                    </label>
                    <select
                      id="regWardNumber"
                      className="form-input"
                      value={regWardNumber}
                      onChange={(e) => setRegWardNumber(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="Ward 1">Ward 1</option>
                      <option value="Ward 2">Ward 2</option>
                      <option value="Ward 3">Ward 3</option>
                      <option value="Ward 4">Ward 4</option>
                      <option value="Ward 5">Ward 5</option>
                      <option value="Ward 6">Ward 6</option>
                      <option value="Ward 7">Ward 7</option>
                      <option value="Ward 8">Ward 8</option>
                      <option value="Ward 9">Ward 9</option>
                      <option value="Ward 10">Ward 10</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="regHouseNumber">
                      House / Flat No
                    </label>
                    <input
                      id="regHouseNumber"
                      type="text"
                      className="form-input"
                      placeholder="e.g. B-402, Green Avenue"
                      value={regHouseNumber}
                      onChange={(e) => setRegHouseNumber(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="regLandmark">
                    Landmark / Locality Details
                  </label>
                  <input
                    id="regLandmark"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Near Primary Health Center"
                    value={regLandmark}
                    onChange={(e) => setRegLandmark(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={isLoading}
                  style={{ backgroundColor: theme.accent, marginTop: '0.5rem' }}
                >
                  {isLoading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Register & Access Citizen Dashboard</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
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
