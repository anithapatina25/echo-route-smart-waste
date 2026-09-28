import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Package, 
  AlertTriangle, 
  RefreshCw,
  Home,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

export function AdminCitizensView() {
  const { showToast } = useToast();
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState('ALL');

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      const res = await authApi.getAdminCitizens();
      if (res.success) {
        setCitizens(res.data);
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to load citizen directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizens();
  }, []);

  // Extract unique wards for filter
  const wards = Array.from(new Set(citizens.map((c) => c.ward_number).filter(Boolean))).sort();

  const filteredCitizens = citizens.filter((c) => {
    // Ward filter
    if (selectedWard !== 'ALL' && c.ward_number !== selectedWard) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.citizen_name?.toLowerCase().includes(q);
      const matchPhone = c.citizen_phone?.toLowerCase().includes(q);
      const matchEmail = c.citizen_email?.toLowerCase().includes(q);
      const matchVillage = c.village_name?.toLowerCase().includes(q);
      const matchAddress = c.house_details?.toLowerCase().includes(q) || c.landmark?.toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchVillage || matchAddress;
    }
    return true;
  });

  const totalRequestsAcrossAll = citizens.reduce((sum, c) => sum + (Number(c.total_requests_count) || 0), 0);
  const totalCompletedAcrossAll = citizens.reduce((sum, c) => sum + (Number(c.completed_requests_count) || 0), 0);
  const totalComplaintsAcrossAll = citizens.reduce((sum, c) => sum + (Number(c.complaints_count) || 0), 0);

  return (
    <div>
      {/* Citizens Summary Header Cards */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Enrolled Citizens
            </span>
            <Users size={20} color="#6b21a8" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
            {citizens.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 600 }}>
            Gram Sabha Residents
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #2d6a4f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Citizen Pickups
            </span>
            <Package size={20} color="#2d6a4f" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2d6a4f', margin: '0.25rem 0' }}>
            {totalRequestsAcrossAll}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2d6a4f', fontWeight: 600 }}>
            Bookings Submitted
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Completed Disposals
            </span>
            <CheckCircle2 size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
            {totalCompletedAcrossAll}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
            Successfully Collected
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Grievances Logged
            </span>
            <AlertTriangle size={20} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706', margin: '0.25rem 0' }}>
            {totalComplaintsAcrossAll}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
            Citizen Feedback & Issues
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
              placeholder="Search resident name, phone, email, village, address..."
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

          {/* Ward Selector & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} color="#64748b" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Filter Ward:</span>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  outline: 'none'
                }}
              >
                <option value="ALL">All Wards ({citizens.length})</option>
                {wards.map((w) => (
                  <option key={w} value={w}>
                    Ward {w}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchCitizens}
              className="btn btn-outline btn-sm"
              title="Refresh Directory"
              style={{ padding: '0.45rem 0.65rem' }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Citizens Directory Table */}
      {loading ? (
        <LoadingState message="Loading registered citizens directory..." />
      ) : filteredCitizens.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Citizens Found"
          message={
            searchQuery.trim()
              ? `No citizen records match "${searchQuery}".`
              : 'No citizens registered under the selected ward criteria.'
          }
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Citizen Resident</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Contact Info</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Ward & Village</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Residential Details</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Waste Requests</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredCitizens.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf5ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Citizen Resident */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: '#f3e8ff',
                          color: '#6b21a8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}>
                          {c.citizen_name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {c.citizen_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Citizen ID: CTZ-{String(c.id).padStart(3, '0')}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#334155' }}>
                          <Phone size={13} color="#64748b" />
                          {c.citizen_phone || 'N/A'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.78rem' }}>
                          <Mail size={13} color="#94a3b8" />
                          {c.citizen_email}
                        </span>
                      </div>
                    </td>

                    {/* Ward & Village */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#3730a3', alignSelf: 'flex-start', fontSize: '0.75rem' }}>
                          Ward {c.ward_number || '1'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                          {c.village_name || 'Gram Panchayat Center'}
                        </span>
                      </div>
                    </td>

                    {/* Residential Details */}
                    <td style={{ padding: '1rem 1rem', maxWidth: '240px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.82rem' }}>
                          {c.house_details || 'Residential Premise'}
                        </span>
                        {c.landmark && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={12} color="#94a3b8" />
                            Near {c.landmark}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Waste Requests */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{
                            backgroundColor: '#d8f3dc',
                            color: '#1b4332',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}>
                            {c.total_requests_count || 0} raised
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                            {c.completed_requests_count || 0} done
                          </span>
                        </div>
                        {c.complaints_count > 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                            &bull; {c.complaints_count} grievance{c.complaints_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} color="#94a3b8" />
                        {c.joined_date ? new Date(c.joined_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified Resident'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
