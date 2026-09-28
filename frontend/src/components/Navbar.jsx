import React from 'react';
import { Leaf, Shield, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onNavigate, currentPath }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const getRoleDashboardPath = (role) => {
    switch (role) {
      case 'CITIZEN': return '/citizen';
      case 'DRIVER': return '/driver';
      case 'ADMIN': return '/admin';
      default: return '/';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'CITIZEN': return <span className="badge badge-info">Citizen</span>;
      case 'DRIVER': return <span className="badge badge-warning">Driver</span>;
      case 'ADMIN': return <span className="badge badge-purple" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}>Admin</span>;
      default: return null;
    }
  };

  return (
    <>
      {/* Top Civic Ribbon */}
      <div className="gov-ribbon">
        <div className="container gov-ribbon-content">
          <span>Gram Panchayat Solid Waste Management Initiative | Swachh Bharat Mission (Grameen)</span>
          <span>Helpline: 1800-GP-WASTE</span>
        </div>
      </div>

      <header className="navbar">
        <div className="container navbar-inner">
          <div className="brand" onClick={() => onNavigate('/')} style={{ cursor: 'pointer' }}>
            <div className="brand-logo-crest">
              <Leaf size={24} strokeWidth={2.5} />
            </div>
            <div className="brand-text">
              <h1>ECHO ROUTE SMART WASTE</h1>
              <p>Smarter Routes. Cleaner Communities.</p>
            </div>
          </div>

          <nav className="nav-actions" style={{ display: 'none', md: 'flex' }}>
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  onClick={() => onNavigate(getRoleDashboardPath(user.role))}
                  className={`btn btn-sm ${currentPath.startsWith(getRoleDashboardPath(user.role)) ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <User size={15} />
                  <span>{user.fullName || user.email}</span>
                  {getRoleBadge(user.role)}
                </button>
                <button 
                  onClick={logout} 
                  className="btn btn-sm btn-secondary" 
                  title="Log out"
                  style={{ color: '#b91c1c' }}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('/login')} 
                className="btn btn-primary"
              >
                <Shield size={16} />
                <span>Portal Login</span>
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isAuthenticated && user && (
              <button 
                onClick={() => onNavigate(getRoleDashboardPath(user.role))}
                className="btn btn-sm btn-secondary"
                style={{ display: 'inline-flex' }}
              >
                {getRoleBadge(user.role)}
              </button>
            )}
            <button 
              onClick={() => onNavigate(isAuthenticated ? getRoleDashboardPath(user.role) : '/login')}
              className="btn btn-sm btn-primary"
            >
              {isAuthenticated ? 'Dashboard' : 'Login'}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
