import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Camera, 
  CheckCircle2, 
  LogOut, 
  Info, 
  Clock, 
  Route, 
  Package, 
  User, 
  RefreshCw, 
  ArrowRight,
  Power,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth.api';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { NotificationCenter } from '../components/NotificationCenter';

// Driver Views
import { DriverAssignmentsView } from './driver/DriverAssignmentsView';
import { DriverRouteView } from './driver/DriverRouteView';
import { DriverCompletedView } from './driver/DriverCompletedView';
import { DriverProfileView } from './driver/DriverProfileView';
import { DriverPickupDetailsModal } from './driver/DriverPickupDetailsModal';

export function DriverDashboard({ onNavigate }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Modal for quick stop action from overview
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.getDriverDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load driver telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
  }, []);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    showToast('Logged Out', 'You have securely signed out of Driver Portal.', 'info');
    onNavigate('/login');
  };

  const handleOpenDetails = (pickup) => {
    setSelectedPickup(pickup);
    setModalOpen(true);
  };

  if (loading && !dashboardData) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <LoadingState message="Loading Driver Fleet Cockpit..." />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <ErrorState
          message={error}
          onRetry={loadDriverData}
          onBack={() => onNavigate('/')}
        />
      </div>
    );
  }

  const profile = dashboardData?.profile || {};
  const metrics = dashboardData?.metrics || {
    todaysAssignments: 0,
    pendingPickups: 0,
    activePickups: 0,
    completedPickups: 0,
    currentActivePickup: null
  };
  const recentAssignments = dashboardData?.recentAssignments || [];
  const currentActive = metrics.currentActivePickup;
  const isOnDuty = profile.is_on_duty === 1;

  const navTabs = [
    { id: 'overview', label: 'Cockpit', icon: Truck },
    { 
      id: 'assignments', 
      label: 'My Assignments', 
      icon: Package,
      badge: metrics.pendingPickups > 0 ? metrics.pendingPickups : null,
      badgeColor: '#b45309'
    },
    { 
      id: 'route', 
      label: "Today's Route", 
      icon: Route,
      badge: metrics.todaysAssignments > 0 ? metrics.todaysAssignments : null,
      badgeColor: '#6b21a8'
    },
    { 
      id: 'completed', 
      label: 'Completed Pickups', 
      icon: CheckCircle2,
      badge: metrics.completedPickups > 0 ? metrics.completedPickups : null,
      badgeColor: '#16a34a'
    },
    { id: 'profile', label: 'Driver Profile', icon: User }
  ];

  return (
    <div style={{ padding: '1.5rem 0 4rem' }}>
      <div className="container">
        {/* Top Header Card */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className={`badge ${isOnDuty ? 'badge-success' : ''}`} style={{ backgroundColor: isOnDuty ? undefined : '#f1f5f9', color: isOnDuty ? undefined : '#64748b' }}>
                {isOnDuty ? 'Vehicle On Duty' : 'Vehicle Off Duty'}
              </span>
              <span style={{
                fontFamily: 'monospace',
                backgroundColor: '#f1f5f9',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#0f172a'
              }}>
                {profile.vehicle_number || 'GP-04-E-1024'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {profile.vehicle_type || 'Tipper'} &bull; Cap: {profile.capacity_kg || 1200} kg
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Driver Cockpit: {user?.fullName || 'Driver'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0' }}>
              Gram Panchayat Sanitation Fleet &bull; Real-time Daily Waste Dispatch Operations
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NotificationCenter
              role="DRIVER"
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <button
              onClick={() => {
                loadDriverData();
                showToast('Refreshed', 'Telemetry synced with database.', 'info');
              }}
              className="btn btn-outline btn-sm"
              title="Refresh Cockpit"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={15} />
              <span>Sync</span>
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.75rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 700 : 600,
                  whiteSpace: 'nowrap',
                  borderRadius: '8px 8px 0 0',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #6b21a8' : '3px solid transparent',
                  backgroundColor: isActive ? '#faf5ff' : 'transparent',
                  color: isActive ? '#6b21a8' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={isActive ? '#6b21a8' : '#64748b'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    backgroundColor: tab.badgeColor || '#6b21a8',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    marginLeft: '0.2rem'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview Cockpit */}
        {activeTab === 'overview' && (
          <div>
            {/* 4 Dynamic Metric Cards (Live SQLite Queries) */}
            <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
              {/* Card 1: Today's Assignments */}
              <div 
                className="card" 
                style={{ padding: '1.25rem', borderLeft: '4px solid #6b21a8', cursor: 'pointer' }}
                onClick={() => setActiveTab('route')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Today's Assignments
                  </span>
                  <Calendar size={18} color="#6b21a8" />
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0.1rem' }}>
                  {metrics.todaysAssignments}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 600 }}>
                  Scheduled Collection Stops
                </div>
              </div>

              {/* Card 2: Pending Pickups */}
              <div 
                className="card" 
                style={{ 
                  padding: '1.25rem', 
                  borderLeft: '4px solid #b45309', 
                  cursor: 'pointer',
                  backgroundColor: metrics.pendingPickups > 0 ? '#fffbeb' : '#ffffff'
                }}
                onClick={() => setActiveTab('assignments')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                    Pending Pickups
                  </span>
                  <Clock size={18} color="#b45309" />
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#b45309', margin: '0.3rem 0 0.1rem' }}>
                  {metrics.pendingPickups}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                  Assigned / Awaiting Trip
                </div>
              </div>

              {/* Card 3: Active Pickup */}
              <div 
                className="card" 
                style={{ 
                  padding: '1.25rem', 
                  borderLeft: '4px solid #0284c7', 
                  cursor: 'pointer',
                  backgroundColor: metrics.activePickups > 0 ? '#f0f9ff' : '#ffffff'
                }}
                onClick={() => {
                  if (currentActive) handleOpenDetails(currentActive);
                  else setActiveTab('assignments');
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                    Active Pickup
                  </span>
                  <Navigation size={18} color="#0284c7" />
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0284c7', margin: '0.3rem 0 0.1rem' }}>
                  {metrics.activePickups}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                  {currentActive ? `${currentActive.request_code || 'In Progress'}` : 'Trip En Route / Arrived'}
                </div>
              </div>

              {/* Card 4: Completed Pickups */}
              <div 
                className="card" 
                style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a', cursor: 'pointer' }}
                onClick={() => setActiveTab('completed')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                    Completed Pickups
                  </span>
                  <CheckCircle2 size={18} color="#16a34a" />
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0.1rem' }}>
                  {metrics.completedPickups}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                  Photo Proof Verified
                </div>
              </div>
            </div>

            {/* In-Progress Active Stop Banner */}
            {currentActive && (
              <div style={{
                backgroundColor: '#faf5ff',
                border: '1.5px solid #c084fc',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 2px 8px rgba(107, 33, 168, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: '#6b21a8',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Navigation size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge" style={{ backgroundColor: '#6b21a8', color: '#ffffff', fontWeight: 700 }}>
                        Active Trip: {currentActive.assignment_status}
                      </span>
                      <strong style={{ fontFamily: 'monospace', color: '#6b21a8' }}>
                        {currentActive.request_code}
                      </strong>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                      {currentActive.waste_type} &bull; {currentActive.citizen_name} ({currentActive.address})
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#6b21a8', margin: 0 }}>
                      Ward {currentActive.ward_number} &bull; Destination reached or en route
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleOpenDetails(currentActive)}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#6b21a8', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>Execute Stop Workflow</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Action Shortcuts */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Driver Quick Dispatch Actions
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                    Access your assigned itinerary or check completed photographic proofs
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className="btn btn-sm btn-primary"
                    style={{ backgroundColor: '#6b21a8' }}
                  >
                    <Package size={14} />
                    <span>View Assignments ({metrics.pendingPickups + metrics.activePickups})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('route')}
                    className="btn btn-sm btn-outline"
                    style={{ borderColor: '#2d6a4f', color: '#2d6a4f' }}
                  >
                    <Route size={14} />
                    <span>Today's Route ({metrics.todaysAssignments} Stops)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className="btn btn-sm btn-outline"
                  >
                    <CheckCircle2 size={14} />
                    <span>Completed History ({metrics.completedPickups})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Assigned Pickups Preview */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    Assigned Pickup Stops (Preview)
                  </span>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Pickup requests assigned directly to your vehicle by Panchayat dispatch
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="btn btn-sm btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <span>View All</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="card-body" style={{ padding: '0.75rem' }}>
                {recentAssignments.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                    No pickup requests assigned to your vehicle currently.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {recentAssignments.map((p) => {
                      const isCompleted = p.assignment_status === 'COMPLETED';
                      const isAssigned = p.assignment_status === 'ASSIGNED';

                      return (
                        <div
                          key={p.assignment_id || p.pickup_id}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', color: '#6b21a8' }}>
                                {p.request_code}
                              </span>
                              <span className={`badge ${isCompleted ? 'badge-success' : isAssigned ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                                {p.assignment_status}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Ward {p.ward_number}
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                              {p.waste_type_label || p.waste_type} &bull; {p.citizen_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {p.address} ({p.village_name || 'Village'})
                            </div>
                          </div>

                          <div>
                            <button
                              onClick={() => handleOpenDetails(p)}
                              className="btn btn-sm btn-outline"
                              style={{ fontSize: '0.75rem' }}
                            >
                              {isCompleted ? 'View Proof' : 'Open Stop'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My Assignments */}
        {activeTab === 'assignments' && (
          <DriverAssignmentsView />
        )}

        {/* Tab 3: Today's Route */}
        {activeTab === 'route' && (
          <DriverRouteView />
        )}

        {/* Tab 4: Completed Pickups */}
        {activeTab === 'completed' && (
          <DriverCompletedView />
        )}

        {/* Tab 5: Driver Profile */}
        {activeTab === 'profile' && (
          <DriverProfileView />
        )}
      </div>

      {/* Details & Workflow Modal */}
      <DriverPickupDetailsModal
        isOpen={modalOpen}
        pickup={selectedPickup}
        onClose={() => {
          setModalOpen(false);
          setSelectedPickup(null);
        }}
        onActionSuccess={(updated) => {
          setSelectedPickup(updated);
          loadDriverData();
        }}
      />

      {/* Logout Dialog */}
      <ConfirmationDialog
        isOpen={showLogoutConfirm}
        title="Sign Out of Driver Cockpit?"
        message="Are you sure you want to end your driver shift session?"
        confirmLabel="Sign Out"
        isDanger={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
