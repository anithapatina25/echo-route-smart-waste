import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Filter, 
  RefreshCw, 
  Power, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  PackageCheck,
  Clock,
  Car,
  Plus
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { AdminAddDriverModal } from './AdminAddDriverModal';

export function AdminDriversView() {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDuty, setFilterDuty] = useState('ALL'); // ALL, ON_DUTY, OFF_DUTY
  const [togglingId, setTogglingId] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await authApi.getAdminDrivers();
      if (res.success) {
        setDrivers(res.data);
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to load driver roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleToggleDuty = async (driver) => {
    try {
      setTogglingId(driver.id);
      const res = await authApi.toggleDriverDuty(driver.id);
      if (res.success) {
        const newDuty = res.data.is_on_duty === 1;
        showToast(
          'Duty Status Updated',
          `${driver.driver_name} is now ${newDuty ? 'ON DUTY (Active)' : 'OFF DUTY'}.`,
          newDuty ? 'success' : 'info'
        );
        // Refresh local driver list
        setDrivers((prev) =>
          prev.map((d) => (d.id === driver.id ? { ...d, is_on_duty: res.data.is_on_duty } : d))
        );
      }
    } catch (err) {
      showToast('Toggle Failed', err.message || 'Could not change driver duty status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    // Duty filter
    if (filterDuty === 'ON_DUTY' && d.is_on_duty !== 1) return false;
    if (filterDuty === 'OFF_DUTY' && d.is_on_duty === 1) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = d.driver_name?.toLowerCase().includes(q);
      const matchPhone = d.driver_phone?.toLowerCase().includes(q);
      const matchVehicle = d.vehicle_number?.toLowerCase().includes(q);
      const matchType = d.vehicle_type?.toLowerCase().includes(q);
      return matchName || matchPhone || matchVehicle || matchType;
    }
    return true;
  });

  const onDutyCount = drivers.filter((d) => d.is_on_duty === 1).length;
  const offDutyCount = drivers.length - onDutyCount;
  const totalCapacity = drivers.reduce((sum, d) => sum + (Number(d.capacity_kg) || 0), 0);

  return (
    <div>
      {/* Fleet Summary Header Cards */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Registered Fleet
            </span>
            <Truck size={20} color="#6b21a8" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
            {drivers.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 600 }}>
            Panchayat Enrolled Drivers
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              On Duty (Active)
            </span>
            <CheckCircle2 size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
            {onDutyCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
            Available for Dispatches
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #94a3b8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Off Duty
            </span>
            <Power size={20} color="#64748b" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#64748b', margin: '0.25rem 0' }}>
            {offDutyCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
            Standby / Shift Ended
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Fleet Total Capacity
            </span>
            <Car size={20} color="#2d6a4f" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2d6a4f', margin: '0.25rem 0' }}>
            {totalCapacity} kg
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2d6a4f', fontWeight: 600 }}>
            Cumulative Waste Payload
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Duty Filters */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '450px' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
            />
            <input
              type="text"
              placeholder="Search driver name, phone, vehicle no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                fontSize: '0.88rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginRight: '0.25rem' }}>
              Duty Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Drivers' },
              { id: 'ON_DUTY', label: `On Duty (${onDutyCount})` },
              { id: 'OFF_DUTY', label: `Off Duty (${offDutyCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterDuty(tab.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: filterDuty === tab.id ? '#6b21a8' : '#e2e8f0',
                  backgroundColor: filterDuty === tab.id ? '#6b21a8' : '#ffffff',
                  color: filterDuty === tab.id ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={fetchDrivers}
              className="btn btn-outline btn-sm"
              title="Refresh Roster"
              style={{ padding: '0.45rem 0.65rem' }}
            >
              <RefreshCw size={15} />
            </button>

            <button
              onClick={() => setAddModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{
                backgroundColor: '#6b21a8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem'
              }}
              title="Enroll New Fleet Driver"
            >
              <Plus size={15} />
              <span>Add Driver</span>
            </button>
          </div>
        </div>
      </div>

      {/* Driver Fleet Table */}
      {loading ? (
        <LoadingState message="Loading driver fleet records..." />
      ) : filteredDrivers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Drivers Found"
          message={
            searchQuery.trim()
              ? `No driver profiles matched "${searchQuery}". Try clearing search filters.`
              : 'No drivers registered in the fleet for this duty criteria.'
          }
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Driver Name & ID</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Contact Info</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Vehicle Profile</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Duty Status</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Active Stops</th>
                  <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Duty Switch</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => {
                  const isOnDuty = driver.is_on_duty === 1;
                  const isToggling = togglingId === driver.id;

                  return (
                    <tr
                      key={driver.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf5ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Driver Name & ID */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: isOnDuty ? '#dcfce7' : '#f1f5f9',
                            color: isOnDuty ? '#16a34a' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem'
                          }}>
                            {driver.driver_name?.charAt(0)?.toUpperCase() || 'D'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {driver.driver_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Fleet ID: DRV-{String(driver.id).padStart(3, '0')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#334155' }}>
                            <Phone size={13} color="#64748b" />
                            {driver.driver_phone || 'No phone'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.78rem' }}>
                            <Mail size={13} color="#94a3b8" />
                            {driver.email}
                          </span>
                        </div>
                      </td>

                      {/* Vehicle Profile */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              color: '#0f172a'
                            }}>
                              {driver.vehicle_number || 'N/A'}
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                              {driver.vehicle_type || 'Waste Carrier'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Cap: <strong style={{ color: '#0f172a' }}>{driver.capacity_kg || 500} kg</strong> &bull; Lic: {driver.license_number || 'Registered'}
                          </div>
                        </div>
                      </td>

                      {/* Duty Status */}
                      <td style={{ padding: '1rem 1rem' }}>
                        {isOnDuty ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                            On Duty (Ready)
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                            Off Duty
                          </span>
                        )}
                      </td>

                      {/* Active Workload */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            backgroundColor: driver.active_assignments_count > 0 ? '#fef3c7' : '#f1f5f9',
                            color: driver.active_assignments_count > 0 ? '#b45309' : '#64748b',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}>
                            {driver.active_assignments_count || 0} active
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            ({driver.completed_assignments_count || 0} done)
                          </span>
                        </div>
                      </td>

                      {/* Duty Toggle Switch */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleDuty(driver)}
                          disabled={isToggling}
                          className={`btn btn-sm ${isOnDuty ? 'btn-outline' : 'btn-primary'}`}
                          style={{
                            minWidth: '110px',
                            borderColor: isOnDuty ? '#dc2626' : '#16a34a',
                            color: isOnDuty ? '#dc2626' : '#ffffff',
                            backgroundColor: isOnDuty ? '#ffffff' : '#16a34a'
                          }}
                        >
                          <Power size={14} />
                          <span>{isToggling ? 'Updating...' : isOnDuty ? 'Set Off Duty' : 'Set On Duty'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enroll Driver Modal */}
      <AdminAddDriverModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => fetchDrivers()}
      />
    </div>
  );
}
