import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  LogOut, 
  Info, 
  BarChart3,
  Package,
  Layers,
  MapPin,
  RefreshCw,
  Eye,
  Check,
  Compass,
  Route,
  FileSpreadsheet,
  Settings,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth.api';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { NotificationCenter } from '../components/NotificationCenter';

// Admin Sub-Views
import { AdminPickupRequestsView } from './admin/AdminPickupRequestsView';
import { AdminDriversView } from './admin/AdminDriversView';
import { AdminCitizensView } from './admin/AdminCitizensView';
import { AdminComplaintsView } from './admin/AdminComplaintsView';
import { AdminLiveTrackingView } from './admin/AdminLiveTrackingView';
import { AdminRoutesView } from './admin/AdminRoutesView';
import { AdminPlaceholdersView } from './admin/AdminPlaceholdersView';
import { AdminPickupDetailsModal } from './admin/AdminPickupDetailsModal';
import { AdminActivityFeed } from './admin/AdminActivityFeed';

export function AdminDashboard({ onNavigate }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Quick Details Modal from Overview tab
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [driversList, setDriversList] = useState([]);

  const loadAdminDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.getAdminDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load Admin Command Center data');
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const res = await authApi.getAdminDrivers();
      if (res.success) {
        setDriversList(res.data);
      }
    } catch (err) {
      console.error('Failed to load drivers:', err);
    }
  };

  useEffect(() => {
    loadAdminDashboard();
    loadDrivers();
  }, []);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    showToast('Logged Out', 'You have signed out of Admin Command Center.', 'info');
    onNavigate('/login');
  };

  const handleOpenDetails = (pickup) => {
    setSelectedPickup(pickup);
    setDetailsModalOpen(true);
  };

  const handleInspectPickupById = async (pickupId) => {
    try {
      const res = await authApi.getAdminPickupById(pickupId);
      if (res.success && res.data) {
        setSelectedPickup(res.data);
        setDetailsModalOpen(true);
      } else {
        setActiveTab('pickups');
      }
    } catch (e) {
      setActiveTab('pickups');
    }
  };

  const handleQuickVerify = async (pickupId) => {
    try {
      const res = await authApi.verifyPickup(pickupId);
      if (res.success) {
        showToast('Request Verified', `Pickup request ${res.data.request_code} has been verified and marked ready for driver assignment.`, 'success');
        loadAdminDashboard();
      }
    } catch (err) {
      showToast('Verification Failed', err.message || 'Could not verify request', 'error');
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <LoadingState message="Loading Admin Operational Command Center..." />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <ErrorState
          message={error}
          onRetry={loadAdminDashboard}
          onBack={() => onNavigate('/')}
        />
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {
    totalCitizens: 0,
    registeredDrivers: 0,
    totalPickups: 0,
    pendingRequests: 0,
    verifiedRequests: 0,
    activePickups: 0,
    completedPickups: 0,
    openComplaints: 0
  };

  const recentPickups = dashboardData?.recentPickups || [];
  const driversRoster = dashboardData?.drivers || [];

  const navTabs = [
    { id: 'overview', label: 'Command Overview', icon: ShieldCheck },
    { 
      id: 'pickups', 
      label: 'Pickup Queue', 
      icon: Package, 
      badge: metrics.pendingRequests > 0 ? metrics.pendingRequests : null,
      badgeColor: '#b45309'
    },
    { 
      id: 'drivers', 
      label: 'Fleet Drivers', 
      icon: Truck,
      badge: metrics.registeredDrivers > 0 ? metrics.registeredDrivers : null,
      badgeColor: '#16a34a'
    },
    { id: 'citizens', label: 'Citizens Directory', icon: Users },
    { 
      id: 'complaints', 
      label: 'Grievance Redressal', 
      icon: AlertTriangle,
      badge: metrics.openComplaints > 0 ? metrics.openComplaints : null,
      badgeColor: '#dc2626'
    },
    { id: 'tracking', label: 'Live Tracking', icon: Compass, isPlaceholder: true },
    { id: 'routes', label: 'Routes & Clusters', icon: Route, isPlaceholder: true },
    { id: 'reports', label: 'Swachh Reports', icon: FileSpreadsheet, isPlaceholder: true },
    { id: 'settings', label: 'Admin Settings', icon: Settings, isPlaceholder: true }
  ];

  return (
    <div style={{ padding: '1.5rem 0 4rem' }}>
      <div className="container">
        {/* Top Operational Header */}
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
              <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', fontWeight: 700 }}>
                Admin Operations
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Rural & Gram Panchayat Waste Command
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {user?.fullName || 'Admin Officer'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0' }}>
              Supervising Ward Solid Waste Collections, Sanitation Fleet Dispatch, and Citizen Grievances
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NotificationCenter
              role="ADMIN"
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectPickup={handleInspectPickupById}
            />

            <button
              onClick={() => {
                loadAdminDashboard();
                loadDrivers();
                showToast('Refreshed', 'Command center telemetry refreshed from database.', 'info');
              }}
              className="btn btn-outline btn-sm"
              title="Refresh Data"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
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

        {/* Tab Content Rendering */}
        {activeTab === 'overview' && (
          <div>
            {/* 8 Dynamic Metric Cards (SQLite Live Queries) */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Operational Key Indicators (Live Telemetry)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                  Database Synchronized
                </span>
              </div>

              <div className="grid-4" style={{ gap: '1rem' }}>
                {/* 1. Total Citizens */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6b21a8', cursor: 'pointer' }} onClick={() => setActiveTab('citizens')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      1. Enrolled Citizens
                    </span>
                    <Users size={18} color="#6b21a8" />
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0.1rem' }}>
                    {metrics.totalCitizens}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 600 }}>
                    Registered Residents
                  </div>
                </div>

                {/* 2. Registered Drivers */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a', cursor: 'pointer' }} onClick={() => setActiveTab('drivers')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      2. Fleet Drivers
                    </span>
                    <Truck size={18} color="#16a34a" />
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0.1rem' }}>
                    {metrics.registeredDrivers}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                    Sanitation Vehicles
                  </div>
                </div>

                {/* 3. Total Pickups */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284c7', cursor: 'pointer' }} onClick={() => setActiveTab('pickups')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      3. Total Pickups
                    </span>
                    <Package size={18} color="#0284c7" />
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0.1rem' }}>
                    {metrics.totalPickups}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                    Cumulative Bookings
                  </div>
                </div>

                {/* 4. Pending Requests */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #b45309', cursor: 'pointer', backgroundColor: metrics.pendingRequests > 0 ? '#fffbeb' : '#ffffff' }} onClick={() => setActiveTab('pickups')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                      4. Pending Verification
                    </span>
                    <Clock size={18} color="#b45309" />
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#b45309', margin: '0.3rem 0 0.1rem' }}>
                    {metrics.pendingRequests}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                    Awaiting Official Review
                  </div>
                </div>

                {/* 5. Verified Requests */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6', cursor: 'pointer' }} onClick={() => setActiveTab('pickups')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      5. Verified / Queue
                    </span>
                    <CheckCircle2 size={18} color="#3b82f6" />
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0.1rem' }}>
                    {metrics.verifiedRequests}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
                    Ready for Driver Dispatch
                  </div>
                </div>

                {/* 6. Active Pickups */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6', cursor: 'pointer' }} onClick={() => setActiveTab('pickups')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      6. Active Pickups
                    </span>
                    <Truck size={18} color="#8b5cf6" />
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0.1rem' }}>
                    {metrics.activePickups}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>
                    Assigned & In Progress
                  </div>
                </div>

                {/* 7. Completed Pickups */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981', cursor: 'pointer' }} onClick={() => setActiveTab('pickups')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      7. Completed Pickups
                    </span>
                    <CheckCircle2 size={18} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0.1rem' }}>
                    {metrics.completedPickups}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    Successfully Disposed
                  </div>
                </div>

                {/* 8. Open Complaints */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #dc2626', cursor: 'pointer', backgroundColor: metrics.openComplaints > 0 ? '#fff1f2' : '#ffffff' }} onClick={() => setActiveTab('complaints')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                      8. Open Complaints
                    </span>
                    <AlertTriangle size={18} color="#dc2626" />
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#dc2626', margin: '0.3rem 0 0.1rem' }}>
                    {metrics.openComplaints}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                    Citizen Grievances
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Operational Shortcuts Bar */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#581c87', margin: 0 }}>
                    Admin Quick Dispatch Shortcuts
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b21a8', margin: '0.15rem 0 0' }}>
                    Execute administrative actions directly across operational queues
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('pickups')}
                    className="btn btn-sm btn-primary"
                    style={{ backgroundColor: '#6b21a8' }}
                  >
                    <Package size={14} />
                    <span>Review Pickups ({metrics.pendingRequests} Pending)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('drivers')}
                    className="btn btn-sm btn-outline"
                    style={{ borderColor: '#6b21a8', color: '#6b21a8' }}
                  >
                    <Truck size={14} />
                    <span>Manage Fleet ({metrics.registeredDrivers} Drivers)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('complaints')}
                    className="btn btn-sm btn-secondary"
                    style={{ color: '#dc2626' }}
                  >
                    <AlertTriangle size={14} />
                    <span>Resolve Complaints ({metrics.openComplaints} Open)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dual Grid: Recent Pickups Queue & Fleet Status Snapshot */}
            <div className="grid-2" style={{ gap: '1.5rem' }}>
              {/* Recent Pickups Queue */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      Recent Pickup Queue
                    </span>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                      Latest requests submitted by village residents
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('pickups')}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>View All</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="card-body" style={{ padding: '0.75rem' }}>
                  {recentPickups.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                      No recent pickup requests in queue.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {recentPickups.slice(0, 5).map((p) => {
                        const isPending = p.status === 'PENDING';
                        return (
                          <div
                            key={p.id}
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
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  color: '#6b21a8'
                                }}>
                                  {p.request_code}
                                </span>
                                <span className={`badge ${isPending ? 'badge-warning' : p.status === 'VERIFIED' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '0.68rem' }}>
                                  {p.status}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  Ward {p.ward_number || '-'}
                                </span>
                              </div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                {p.waste_type} &bull; {p.citizen_name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {p.address || 'Address provided'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {isPending && (
                                <button
                                  onClick={() => handleQuickVerify(p.id)}
                                  className="btn btn-sm btn-primary"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#2d6a4f' }}
                                  title="Verify Request"
                                >
                                  <Check size={13} />
                                  <span>Verify</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenDetails(p)}
                                className="btn btn-sm btn-outline"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                title="Inspect Details"
                              >
                                <Eye size={13} />
                                <span>Details</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Fleet Snapshot */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      Driver Fleet Duty Snapshot
                    </span>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                      Current availability of registered sanitation vehicles
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('drivers')}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>Manage Fleet</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="card-body" style={{ padding: '0.75rem' }}>
                  {driversRoster.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                      No drivers registered in fleet yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {driversRoster.slice(0, 5).map((d) => {
                        const isOnDuty = d.is_on_duty === 1;
                        return (
                          <div
                            key={d.id}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                backgroundColor: isOnDuty ? '#dcfce7' : '#f1f5f9',
                                color: isOnDuty ? '#16a34a' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.82rem'
                              }}>
                                {d.full_name?.charAt(0) || 'D'}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{d.full_name}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  {d.phone || d.email} &bull; <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{d.vehicle_number || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              {isOnDuty ? (
                                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                                  On Duty
                                </span>
                              ) : (
                                <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.72rem' }}>
                                  Off Duty
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live System Activity Feed (Stage 7) */}
            <AdminActivityFeed
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onInspectPickup={handleInspectPickupById}
            />
          </div>
        )}

        {/* Pickups View */}
        {activeTab === 'pickups' && (
          <AdminPickupRequestsView />
        )}

        {/* Drivers View */}
        {activeTab === 'drivers' && (
          <AdminDriversView />
        )}

        {/* Citizens Directory View */}
        {activeTab === 'citizens' && (
          <AdminCitizensView />
        )}

        {/* Complaints / Grievance Redressal View */}
        {activeTab === 'complaints' && (
          <AdminComplaintsView />
        )}

        {/* Live GIS Tracking View */}
        {activeTab === 'tracking' && (
          <AdminLiveTrackingView />
        )}

        {/* Fleet Route Planning & Optimization View */}
        {activeTab === 'routes' && (
          <AdminRoutesView />
        )}

        {/* Placeholders (Reports, Settings) */}
        {['reports', 'settings'].includes(activeTab) && (
          <AdminPlaceholdersView
            activeTab={activeTab}
            onReturnToOverview={() => setActiveTab('overview')}
          />
        )}
      </div>

      {/* Details & Driver Assignment Modal for Overview quick actions */}
      <AdminPickupDetailsModal
        isOpen={detailsModalOpen}
        pickup={selectedPickup}
        drivers={driversList}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedPickup(null);
        }}
        onVerifySuccess={(updated) => {
          setSelectedPickup(updated);
          loadAdminDashboard();
        }}
        onAssignSuccess={(updated) => {
          setSelectedPickup(updated);
          loadAdminDashboard();
        }}
      />

      {/* Logout Dialog */}
      <ConfirmationDialog
        isOpen={showLogoutConfirm}
        title="Sign Out of Command Center?"
        message="Are you sure you want to end your administrative session as Panchayat Development Officer?"
        confirmLabel="Sign Out"
        isDanger={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
