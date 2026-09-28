import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  ArrowRight,
  ExternalLink,
  Shield,
  User,
  Radio
} from 'lucide-react';
import { authApi } from '../../api/auth.api';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getActivityBadge(item) {
  const type = item.notification_type || item.type || '';

  if (type.includes('COMPLAINT')) {
    return {
      label: 'Grievance',
      icon: AlertTriangle,
      color: '#dc2626',
      bg: '#fee2e2',
      border: '#fecaca'
    };
  }

  if (type === 'PICKUP_COMPLETED') {
    return {
      label: 'Completed',
      icon: CheckCircle2,
      color: '#16a34a',
      bg: '#dcfce7',
      border: '#bbf7d0'
    };
  }

  if (type === 'NEW_ASSIGNMENT' || type === 'DRIVER_ASSIGNED' || type === 'DRIVER_ACCEPTED') {
    return {
      label: 'Assignment',
      icon: Truck,
      color: '#7c3aed',
      bg: '#ede9fe',
      border: '#ddd6fe'
    };
  }

  if (type === 'DRIVER_EN_ROUTE' || type === 'DRIVER_ARRIVED' || type === 'PICKUP_COLLECTED') {
    return {
      label: 'Dispatch / Transit',
      icon: MapPin,
      color: '#0284c7',
      bg: '#e0f2fe',
      border: '#bae6fd'
    };
  }

  if (type === 'PICKUP_SUBMITTED' || type === 'NEW_PICKUP_REQUEST' || type === 'PICKUP_VERIFIED') {
    return {
      label: 'New Request',
      icon: Package,
      color: '#d97706',
      bg: '#fef3c7',
      border: '#fde68a'
    };
  }

  return {
    label: 'System Event',
    icon: Activity,
    color: '#475569',
    bg: '#f1f5f9',
    border: '#e2e8f0'
  };
}

export function AdminActivityFeed({ onNavigate, onInspectPickup }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const res = await authApi.getAdminActivity(15);
      if (res && res.success) {
        setActivities(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load admin activity feed:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(() => {
      fetchActivity(true);
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchActivity]);

  const handleActionClick = (act) => {
    const type = act.notification_type || act.type || '';
    if (type.includes('COMPLAINT')) {
      if (onNavigate) onNavigate('complaints');
    } else if (act.related_pickup_id && onInspectPickup) {
      onInspectPickup(act.related_pickup_id);
    } else if (onNavigate) {
      onNavigate('pickups');
    }
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* Header */}
      <div className="card-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#f3e8ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed'
          }}>
            <Activity size={17} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Live Admin Activity Stream
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#16a34a',
                backgroundColor: '#dcfce7',
                padding: '0.1rem 0.4rem',
                borderRadius: '999px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                Real-time
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.1rem 0 0' }}>
              Comprehensive operational log of bookings, driver dispatches, and resident actions
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => fetchActivity(true)}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            disabled={refreshing}
            title="Refresh stream"
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="card-body" style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
        {loading ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: '#94a3b8' }} />
            Loading real-time operational stream...
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <Activity size={28} style={{ margin: '0 auto 0.5rem', display: 'block', color: '#cbd5e1' }} />
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.2rem' }}>
              No recent activity recorded
            </strong>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              New pickup requests, driver movements, and grievance logs will stream here automatically.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {activities.map((act) => {
              const badge = getActivityBadge(act);
              const Icon = badge.icon;

              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    {/* Icon */}
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={16} />
                    </div>

                    {/* Text Details */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                          {act.title}
                        </strong>

                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          padding: '0.08rem 0.4rem',
                          borderRadius: '4px'
                        }}>
                          {badge.label}
                        </span>

                        {act.pickup_request_code && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            backgroundColor: '#f1f5f9',
                            color: '#0f172a',
                            padding: '0.08rem 0.4rem',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0'
                          }}>
                            {act.pickup_request_code}
                          </span>
                        )}

                        {act.recipient_role && (
                          <span style={{
                            fontSize: '0.65rem',
                            color: '#64748b',
                            backgroundColor: '#f8fafc',
                            padding: '0.08rem 0.35rem',
                            borderRadius: '4px'
                          }}>
                            Target: {act.recipient_role}
                          </span>
                        )}
                      </div>

                      <p style={{
                        fontSize: '0.78rem',
                        color: '#475569',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '550px'
                      }}>
                        {act.message}
                      </p>
                    </div>
                  </div>

                  {/* Meta & Navigation Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.72rem',
                      color: '#94a3b8',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatRelativeTime(act.created_at)}
                    </span>

                    <button
                      onClick={() => handleActionClick(act)}
                      className="btn btn-sm btn-outline"
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Inspect event"
                    >
                      <span>View</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
