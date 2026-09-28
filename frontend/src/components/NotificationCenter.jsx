import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  X, 
  RefreshCw, 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Info
} from 'lucide-react';
import { authApi } from '../api/auth.api';

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
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getNotificationVisuals(item) {
  const type = item.notification_type || item.type || '';

  if (type.includes('COMPLAINT')) {
    return {
      icon: AlertTriangle,
      color: '#dc2626',
      bgColor: '#fef2f2',
      badgeBg: '#fee2e2'
    };
  }

  if (type === 'PICKUP_COMPLETED') {
    return {
      icon: CheckCircle2,
      color: '#16a34a',
      bgColor: '#f0fdf4',
      badgeBg: '#dcfce7'
    };
  }

  if (type === 'NEW_ASSIGNMENT' || type === 'DRIVER_ASSIGNED' || type === 'DRIVER_ACCEPTED') {
    return {
      icon: Truck,
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      badgeBg: '#ede9fe'
    };
  }

  if (type === 'DRIVER_EN_ROUTE' || type === 'DRIVER_ARRIVED' || type === 'PICKUP_COLLECTED') {
    return {
      icon: MapPin,
      color: '#0284c7',
      bgColor: '#f0f9ff',
      badgeBg: '#e0f2fe'
    };
  }

  if (type === 'PICKUP_SUBMITTED' || type === 'NEW_PICKUP_REQUEST' || type === 'PICKUP_VERIFIED') {
    return {
      icon: Package,
      color: '#d97706',
      bgColor: '#fffbeb',
      badgeBg: '#fef3c7'
    };
  }

  return {
    icon: Info,
    color: '#475569',
    bgColor: '#f8fafc',
    badgeBg: '#f1f5f9'
  };
}

export function NotificationCenter({ role, onNavigate, onSelectPickup }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('all'); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const panelRef = useRef(null);

  // Fetch unread count lightweight
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await authApi.getUnreadNotificationCount();
      if (res && res.success && typeof res.data?.unreadCount === 'number') {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.warn('Silent unread count poll failed:', err?.message);
    }
  }, []);

  // Fetch full notifications
  const fetchNotifications = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const res = await authApi.getNotifications({ limit: 40 });
      if (res && res.success) {
        const list = res.data || [];
        setNotifications(list);
        const unread = list.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load & lightweight unread count polling (every 20s)
  useEffect(() => {
    fetchUnreadCount();
    const countInterval = setInterval(() => {
      fetchUnreadCount();
    }, 20000);

    return () => clearInterval(countInterval);
  }, [fetchUnreadCount]);

  // When panel opens, fetch immediately and poll every 15s
  useEffect(() => {
    if (!isOpen) return;

    fetchNotifications();
    const openInterval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => clearInterval(openInterval);
  }, [isOpen, fetchNotifications]);

  // Click outside to close panel
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleMarkAsRead = async (notif, e) => {
    if (e) e.stopPropagation();
    if (notif.is_read) return;

    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === notif.id ? { ...n, is_read: 1, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await authApi.markNotificationRead(notif.id);
    } catch (err) {
      console.warn('Failed to mark read:', err?.message);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1, read_at: new Date().toISOString() })));
    setUnreadCount(0);

    try {
      await authApi.markAllNotificationsRead();
    } catch (err) {
      console.warn('Failed to mark all read:', err?.message);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();

    const target = notifications.find(n => n.id === id);
    const wasUnread = target && !target.is_read;

    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await authApi.deleteNotification(id);
    } catch (err) {
      console.warn('Failed to delete notification:', err?.message);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif);
    }

    // Role-based navigation dispatch
    const type = notif.notification_type || notif.type || '';
    const pickupId = notif.related_pickup_id;

    if (role === 'CITIZEN') {
      if (type.includes('COMPLAINT')) {
        if (onNavigate) onNavigate('report');
      } else if (pickupId && onSelectPickup) {
        onSelectPickup(pickupId);
      } else if (onNavigate) {
        onNavigate('track');
      }
    } else if (role === 'DRIVER') {
      if (type === 'NEW_ASSIGNMENT' || type === 'DRIVER_ASSIGNED') {
        if (onNavigate) onNavigate('assignments');
      } else if (type === 'DRIVER_EN_ROUTE' || type === 'DRIVER_ARRIVED') {
        if (onNavigate) onNavigate('route');
      } else if (type === 'PICKUP_COMPLETED') {
        if (onNavigate) onNavigate('completed');
      } else if (onNavigate) {
        onNavigate('assignments');
      }
    } else if (role === 'ADMIN') {
      if (type.includes('COMPLAINT')) {
        if (onNavigate) onNavigate('complaints');
      } else if (type === 'DRIVER_STATUS_UPDATE') {
        if (onNavigate) onNavigate('drivers');
      } else if (onNavigate) {
        onNavigate('pickups');
      }
    }

    setIsOpen(false);
  };

  const filteredNotifications = tab === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-sm btn-secondary"
        style={{
          position: 'relative',
          padding: '0.45rem 0.65rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isOpen ? '#e2e8f0' : undefined
        }}
        title="Notifications Center"
        aria-label="Toggle notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            borderRadius: '999px',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            fontSize: '0.65rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            border: '2px solid #ffffff'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: '380px',
          maxWidth: '90vw',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Notifications
              </strong>
              {unreadCount > 0 && (
                <span style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px'
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={() => fetchNotifications(true)}
                className="btn btn-sm btn-outline"
                style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                title="Refresh notifications"
                disabled={refreshing}
              >
                <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>Mark all</span>
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: '#94a3b8',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 0.5rem'
          }}>
            <button
              onClick={() => setTab('all')}
              style={{
                flex: 1,
                padding: '0.55rem 0.5rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: tab === 'all' ? 700 : 500,
                color: tab === 'all' ? '#0f172a' : '#64748b',
                borderBottom: tab === 'all' ? '2px solid #2563eb' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <span>All</span>
              <span style={{
                fontSize: '0.68rem',
                padding: '0.05rem 0.35rem',
                borderRadius: '999px',
                backgroundColor: tab === 'all' ? '#e2e8f0' : '#f1f5f9',
                color: '#475569'
              }}>
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setTab('unread')}
              style={{
                flex: 1,
                padding: '0.55rem 0.5rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: tab === 'unread' ? 700 : 500,
                color: tab === 'unread' ? '#0f172a' : '#64748b',
                borderBottom: tab === 'unread' ? '2px solid #2563eb' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: '0.68rem',
                  padding: '0.05rem 0.35rem',
                  borderRadius: '999px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  fontWeight: 700
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* List Content */}
          <div style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '0.5rem',
            backgroundColor: '#f8fafc'
          }}>
            {loading ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                <RefreshCw size={18} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: '#94a3b8' }} />
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: '#64748b'
                }}>
                  <CheckCircle2 size={22} color="#16a34a" />
                </div>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.2rem' }}>
                  {tab === 'unread' ? 'All caught up!' : 'No notifications'}
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  {tab === 'unread' 
                    ? 'You have addressed all pending alerts.'
                    : 'System activity and workflow updates will appear here.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {filteredNotifications.map((n) => {
                  const visuals = getNotificationVisuals(n);
                  const Icon = visuals.icon;
                  const isUnread = !n.is_read;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        backgroundColor: isUnread ? '#ffffff' : '#f8fafc',
                        border: isUnread ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                        boxShadow: isUnread ? '0 2px 4px rgba(37,99,235,0.06)' : 'none',
                        display: 'flex',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isUnread ? '#f8fafc' : '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isUnread ? '#ffffff' : '#f8fafc';
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: visuals.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: visuals.color
                      }}>
                        <Icon size={16} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.15rem' }}>
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: isUnread ? 700 : 600,
                            color: isUnread ? '#0f172a' : '#334155',
                            lineHeight: 1.25
                          }}>
                            {n.title}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            color: '#94a3b8',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}>
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          margin: '0 0 0.4rem',
                          lineHeight: 1.35
                        }}>
                          {n.message}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          {n.related_pickup_id ? (
                            <span style={{
                              fontSize: '0.65rem',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              backgroundColor: visuals.badgeBg,
                              color: visuals.color,
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px'
                            }}>
                              Pickup #{n.related_pickup_id}
                            </span>
                          ) : <span />}

                          {/* Quick Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {isUnread && (
                              <button
                                onClick={(e) => handleMarkAsRead(n, e)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0.2rem',
                                  color: '#2563eb',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title="Mark read"
                              >
                                <Check size={13} />
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDelete(n.id, e)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                color: '#94a3b8',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Delete notification"
                              onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
