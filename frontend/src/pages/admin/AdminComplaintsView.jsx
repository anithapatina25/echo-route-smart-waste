import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  User, 
  Phone, 
  MapPin, 
  MessageSquare, 
  FileText,
  Send,
  X
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

export function AdminComplaintsView() {
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Resolution Modal State
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('RESOLVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await authApi.getAdminComplaints();
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to load complaints registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleOpenModal = (complaint) => {
    setActiveComplaint(complaint);
    setNewStatus(complaint.status === 'SUBMITTED' ? 'RESOLVED' : complaint.status);
    setAdminNotes(complaint.admin_notes || '');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setActiveComplaint(null);
    setModalOpen(false);
    setAdminNotes('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;

    try {
      setIsSubmitting(true);
      const res = await authApi.updateComplaint(activeComplaint.id, {
        status: newStatus,
        admin_notes: adminNotes
      });

      if (res.success) {
        showToast(
          'Grievance Updated',
          `Token #${activeComplaint.id} status updated to ${newStatus}. Citizen notified.`,
          'success'
        );
        handleCloseModal();
        fetchComplaints();
      }
    } catch (err) {
      showToast('Update Failed', err.message || 'Could not update complaint', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    // Status filter
    if (statusFilter !== 'ALL' && c.status !== statusFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchToken = String(c.id).includes(q) || `cmp-${c.id}`.includes(q);
      const matchName = c.citizen_name?.toLowerCase().includes(q);
      const matchPhone = c.citizen_phone?.toLowerCase().includes(q);
      const matchSubject = c.subject?.toLowerCase().includes(q);
      const matchCategory = c.category?.toLowerCase().includes(q);
      const matchWard = String(c.ward_number || '').includes(q);
      const matchVillage = c.village_name?.toLowerCase().includes(q);
      const matchRequest = c.request_code?.toLowerCase().includes(q);
      return matchToken || matchName || matchPhone || matchSubject || matchCategory || matchWard || matchVillage || matchRequest;
    }
    return true;
  });

  const submittedCount = complaints.filter((c) => c.status === 'SUBMITTED').length;
  const inReviewCount = complaints.filter((c) => c.status === 'IN_REVIEW').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;
  const rejectedCount = complaints.filter((c) => c.status === 'REJECTED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> New / Submitted</span>;
      case 'IN_REVIEW':
        return <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> Under Review</span>;
      case 'RESOLVED':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={12} /> Resolved</span>;
      case 'REJECTED':
        return <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Metrics Bar */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #b45309' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Pending Review
            </span>
            <Clock size={20} color="#b45309" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#b45309', margin: '0.25rem 0' }}>
            {submittedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
            Awaiting Official Action
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Under Investigation
            </span>
            <AlertTriangle size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7', margin: '0.25rem 0' }}>
            {inReviewCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
            Ward Supervisor Reviewing
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Successfully Resolved
            </span>
            <CheckCircle2 size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
            Grievances Addressed
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Complaints
            </span>
            <FileText size={20} color="#6b21a8" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
            {complaints.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 600 }}>
            All Recorded Grievances
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '420px' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
            />
            <input
              type="text"
              placeholder="Search token #, resident, subject, ward, request code..."
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

          {/* Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All (${complaints.length})` },
              { id: 'SUBMITTED', label: `New (${submittedCount})` },
              { id: 'IN_REVIEW', label: `In Review (${inReviewCount})` },
              { id: 'RESOLVED', label: `Resolved (${resolvedCount})` },
              { id: 'REJECTED', label: `Rejected (${rejectedCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: statusFilter === tab.id ? '#6b21a8' : '#e2e8f0',
                  backgroundColor: statusFilter === tab.id ? '#6b21a8' : '#ffffff',
                  color: statusFilter === tab.id ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={fetchComplaints}
              className="btn btn-outline btn-sm"
              title="Refresh Complaints"
              style={{ padding: '0.45rem 0.65rem', marginLeft: '0.25rem' }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <LoadingState message="Loading complaints registry..." />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No Grievances Found"
          message={
            searchQuery.trim()
              ? `No complaints match your query "${searchQuery}".`
              : 'There are no citizen complaints matching this status filter.'
          }
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Token & Date</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Citizen / Location</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Category & Subject</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Admin Resolution Note</th>
                  <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf5ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Token & Date */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          color: '#6b21a8'
                        }}>
                          #CMP-{String(c.id).padStart(4, '0')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                        </span>
                        {c.request_code && (
                          <span style={{ fontSize: '0.72rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: '4px', alignSelf: 'flex-start', fontFamily: 'monospace' }}>
                            Req: {c.request_code}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Citizen / Location */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <strong style={{ color: '#0f172a' }}>{c.citizen_name}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {c.citizen_phone}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#3730a3' }}>
                          Ward {c.ward_number || '-'} &bull; {c.village_name || 'Gram Panchayat'}
                        </span>
                      </div>
                    </td>

                    {/* Category & Subject */}
                    <td style={{ padding: '1rem 1rem', maxWidth: '280px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#b45309',
                          backgroundColor: '#fef3c7',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          alignSelf: 'flex-start'
                        }}>
                          {c.category?.replace(/_/g, ' ')}
                        </span>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                          {c.subject}
                        </div>
                        <p style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {c.description}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem 1rem' }}>
                      {getStatusBadge(c.status)}
                    </td>

                    {/* Admin Resolution Note */}
                    <td style={{ padding: '1rem 1rem', maxWidth: '220px' }}>
                      {c.admin_notes ? (
                        <div style={{ fontSize: '0.8rem', color: '#1b4332', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                          &ldquo;{c.admin_notes}&rdquo;
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No administrative notes yet
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenModal(c)}
                        className="btn btn-sm btn-primary"
                        style={{ backgroundColor: '#6b21a8' }}
                      >
                        <MessageSquare size={14} />
                        <span>Action</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grievance Action / Resolution Modal */}
      {modalOpen && activeComplaint && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#faf5ff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#f3e8ff',
                  color: '#6b21a8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Resolve Grievance #CMP-{String(activeComplaint.id).padStart(4, '0')}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Official Panchayat Redressal & Citizen Notification
                  </p>
                </div>
              </div>
              <button onClick={handleCloseModal} style={{ color: '#94a3b8', padding: '0.35rem', borderRadius: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleUpdateStatus} style={{ padding: '1.5rem' }}>
              {/* Complaint Summary Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase' }}>
                      {activeComplaint.category?.replace(/_/g, ' ')}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0' }}>
                      {activeComplaint.subject}
                    </h4>
                  </div>
                  {getStatusBadge(activeComplaint.status)}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0.5rem 0', lineHeight: 1.5 }}>
                  {activeComplaint.description}
                </p>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span>Raised by: <strong>{activeComplaint.citizen_name}</strong> ({activeComplaint.citizen_phone})</span>
                  <span>Ward {activeComplaint.ward_number || '-'}, {activeComplaint.village_name || 'Village'}</span>
                </div>
              </div>

              {/* Status Select */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Update Grievance Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontWeight: 600,
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="IN_REVIEW">Under Investigation / In Review</option>
                  <option value="RESOLVED">Resolved / Redressed</option>
                  <option value="REJECTED">Rejected / Invalid</option>
                </select>
              </div>

              {/* Administrative Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Official Resolution Notes & Feedback to Citizen
                </label>
                <textarea
                  rows={4}
                  required
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Sanitation tractor dispatched to clear overflow. Route supervisor verified the spot on-site. Issue resolved."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.88rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                  This official note will be logged in the database and sent as an in-app notification to the citizen.
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#6b21a8' }}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Saving...' : 'Submit Resolution'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
