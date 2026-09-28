import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  Navigation, 
  AlertTriangle, 
  User, 
  Bell, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth.api';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { NotificationCenter } from '../components/NotificationCenter';

import { BookPickupView } from './citizen/BookPickupView';
import { MyPickupsView } from './citizen/MyPickupsView';
import { TrackPickupView } from './citizen/TrackPickupView';
import { ReportIssueView } from './citizen/ReportIssueView';
import { ProfileView } from './citizen/ProfileView';

export function CitizenDashboard({ onNavigate }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, book, pickups, track, report, profile
  const [trackPickupId, setTrackPickupId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.getCitizenDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    showToast('Signed Out', 'You have securely signed out of Citizen Portal.', 'info');
    onNavigate('/login');
  };

  const handleTrackSpecific = (pickupId) => {
    setTrackPickupId(pickupId);
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingSuccess = (newPickup) => {
    fetchDashboard();
    setActiveTab('pickups');
  };

  if (loading && !dashboardData) {
    return (
      <div className="container" style={{ padding: '3.5rem 0' }}>
        <LoadingState message="Loading Citizen Portal..." />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="container" style={{ padding: '3.5rem 0' }}>
        <ErrorState message={error} onRetry={fetchDashboard} onBack={() => onNavigate('/')} />
      </div>
    );
  }

  const profile = dashboardData?.profile || {};
  const stats = dashboardData?.stats || { totalRequests: 0, pendingRequests: 0, scheduledPickups: 0, completedPickups: 0, activePickup: null };
  const recentPickups = dashboardData?.recentPickups || [];
  const notifications = dashboardData?.notifications || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navTabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { key: 'book', label: 'Book Pickup', icon: <PlusCircle size={17} /> },
    { key: 'pickups', label: 'My Pickups', icon: <Package size={17} /> },
    { key: 'track', label: 'Track Pickup', icon: <Navigation size={17} /> },
    { key: 'report', label: 'Report Issue', icon: <AlertTriangle size={17} /> },
    { key: 'profile', label: 'Profile', icon: <User size={17} /> }
  ];

  return (
    <div style={{ padding: '1.5rem 0 4rem' }}>
      <div className="container">
        {/* Top Citizen Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span className="badge badge-success">Citizen Portal</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {profile.village_name || 'Gram Panchayat'} &bull; {profile.ward_number || 'Ward 4'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Household Dashboard: {user?.fullName || 'Resident'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Notification Center */}
            <NotificationCenter
              role="CITIZEN"
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectPickup={handleTrackSpecific}
            />

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="btn btn-sm btn-secondary"
              style={{ color: '#dc2626' }}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Citizen Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e2e8f0'
        }}>
          {navTabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key !== 'track') setTrackPickupId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.1rem',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  borderBottom: isSelected ? '3px solid #16a34a' : '3px solid transparent',
                  backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                  color: isSelected ? '#166534' : '#64748b',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab View 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Active Pickup Card */}
            {stats.activePickup ? (
              <div className="card" style={{ marginBottom: '2rem', border: '1.5px solid #52b788', backgroundColor: '#f0fdf4' }}>
                <div className="card-header" style={{ backgroundColor: '#ebf7ee', borderBottom: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Navigation size={18} color="#166534" />
                    <span className="card-title" style={{ fontSize: '1rem', color: '#166534' }}>
                      Current Active Pickup: {stats.activePickup.request_code || `#REQ-${stats.activePickup.id}`}
                    </span>
                  </div>
                  <span className="badge badge-success">
                    Stage: {stats.activePickup.timelineInfo?.label || 'In Progress'}
                  </span>
                </div>

                <div className="card-body">
                  <div className="grid-2" style={{ alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 700, marginBottom: '0.25rem' }}>
                        {stats.activePickup.waste_type_label || stats.activePickup.waste_type} Pickup (~{stats.activePickup.estimated_volume_bags} Bags)
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 0.5rem 0' }}>
                        📍 {stats.activePickup.address}
                      </p>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        📅 Scheduled: {stats.activePickup.scheduled_date} ({stats.activePickup.preferred_time || 'Morning'})
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleTrackSpecific(stats.activePickup.id)}
                        className="btn btn-primary"
                      >
                        <Navigation size={16} />
                        <span>Track Live Progress</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                    Need a waste collection?
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    Schedule segregated dry, wet, or bulky waste for pickup by your Ward sanitation team.
                  </p>
                </div>
                <button onClick={() => setActiveTab('book')} className="btn btn-primary">
                  <PlusCircle size={16} />
                  <span>Book Pickup Now</span>
                </button>
              </div>
            )}

            {/* Quick Actions & Recent Requests Grid */}
            <div className="grid-3">
              {/* Quick Navigation Panel */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title" style={{ fontSize: '0.95rem' }}>Quick Citizen Actions</span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <button onClick={() => setActiveTab('book')} className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start' }}>
                    <PlusCircle size={16} />
                    <span>Book Household Pickup</span>
                  </button>
                  <button onClick={() => setActiveTab('pickups')} className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start' }}>
                    <Package size={16} />
                    <span>View Pickup History</span>
                  </button>
                  <button onClick={() => setActiveTab('track')} className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start' }}>
                    <Navigation size={16} />
                    <span>Live Collection Tracking</span>
                  </button>
                  <button onClick={() => setActiveTab('report')} className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start', color: '#92400e' }}>
                    <AlertTriangle size={16} />
                    <span>Report Sanitation Issue</span>
                  </button>
                </div>
              </div>

              {/* Recent Requests Table */}
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div className="card-header">
                  <span className="card-title" style={{ fontSize: '0.95rem' }}>Recent Pickup Activity</span>
                  <button onClick={() => setActiveTab('pickups')} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    View All ({recentPickups.length})
                  </button>
                </div>
                <div className="card-body">
                  {recentPickups.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No pickup requests logged yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {recentPickups.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.82rem'
                          }}
                        >
                          <div>
                            <strong style={{ fontFamily: 'monospace', color: '#166534' }}>
                              {p.request_code || `#REQ-${p.id}`}
                            </strong>
                            <span style={{ margin: '0 0.4rem', color: '#cbd5e1' }}>&bull;</span>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>
                              {p.waste_type_label || p.waste_type}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Date: {p.scheduled_date} ({p.preferred_time || 'Morning'})
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                              {p.status}
                            </span>
                            <button
                              onClick={() => handleTrackSpecific(p.id)}
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Track
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab View 2: BOOK PICKUP */}
        {activeTab === 'book' && (
          <BookPickupView
            profile={profile}
            onSuccess={handleBookingSuccess}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {/* Tab View 3: MY PICKUPS */}
        {activeTab === 'pickups' && (
          <MyPickupsView
            onBookNew={() => setActiveTab('book')}
            onTrackPickup={handleTrackSpecific}
          />
        )}

        {/* Tab View 4: TRACK PICKUP */}
        {activeTab === 'track' && (
          <TrackPickupView
            pickupId={trackPickupId}
            onBookNew={() => setActiveTab('book')}
          />
        )}

        {/* Tab View 5: REPORT ISSUE */}
        {activeTab === 'report' && (
          <ReportIssueView myPickups={recentPickups} />
        )}

        {/* Tab View 6: PROFILE */}
        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            profile={profile}
            onProfileUpdated={fetchDashboard}
          />
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showLogoutConfirm}
        title="Sign Out of Citizen Portal?"
        message="Are you sure you want to end your active resident session?"
        confirmLabel="Logout"
        isDanger={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
