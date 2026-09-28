import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';

export function ReportIssueView({ myPickups = [] }) {
  const { showToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [complaintType, setComplaintType] = useState('Missed Pickup');
  const [pickupId, setPickupId] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const issueCategories = [
    'Missed Pickup',
    'Delayed Collection',
    'Spillage / Waste Left Behind',
    'Driver / Worker Conduct',
    'Segregation Clarification',
    'Other Service Grievance'
  ];

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await authApi.getCitizenComplaints();
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const validate = () => {
    const errs = {};
    if (!subject.trim()) errs.subject = 'Grievance subject is required.';
    if (!description.trim()) errs.description = 'Please provide details about the issue.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await authApi.createComplaint({
        subject: subject.trim(),
        description: description.trim(),
        complaint_type: complaintType,
        pickup_request_id: pickupId ? parseInt(pickupId, 10) : null
      });

      if (res.success) {
        showToast('Grievance Submitted', 'Your report has been logged and assigned a tracking token.', 'success');
        setSubject('');
        setDescription('');
        setPickupId('');
        setFormErrors({});
        fetchComplaints();
      }
    } catch (err) {
      showToast('Submission Failed', err.message || 'Unable to record grievance.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="badge badge-success">Resolved</span>;
      case 'IN_REVIEW':
        return <span className="badge badge-info">In Review</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejected</span>;
      default:
        return <span className="badge badge-warning">Submitted</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Grievance Redressal & Support
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
          Report missed collections, service issues, or sanitation concerns directly to Admin.
        </p>
      </div>

      <div className="grid-2">
        {/* Form Card */}
        <div className="card">
          <div className="card-header" style={{ backgroundColor: '#fffbeb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309' }}>
              <AlertTriangle size={18} />
              <span className="card-title" style={{ fontSize: '1rem', color: '#92400e' }}>
                File a Service Grievance
              </span>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="complaintType">
                  Issue Category <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  id="complaintType"
                  className="form-select"
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  disabled={isSubmitting}
                >
                  {issueCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {myPickups.length > 0 && (
                <div className="form-group">
                  <label className="form-label" htmlFor="pickupId">
                    Associated Pickup Request (Optional)
                  </label>
                  <select
                    id="pickupId"
                    className="form-select"
                    value={pickupId}
                    onChange={(e) => setPickupId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">-- General Issue (Not linked to specific pickup) --</option>
                    {myPickups.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.request_code || `#REQ-${p.id}`} - {p.waste_type} ({p.scheduled_date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="subject">
                  Brief Subject / Title <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  className={`form-input ${formErrors.subject ? 'error' : ''}`}
                  placeholder="e.g. Morning pickup missed on Main Temple Road"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSubmitting}
                />
                {formErrors.subject && (
                  <div className="form-error">
                    <AlertCircle size={14} />
                    <span>{formErrors.subject}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Detailed Description <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  className={`form-textarea ${formErrors.description ? 'error' : ''}`}
                  placeholder="Please describe what occurred, the exact location, time, or driver details if known."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
                {formErrors.description && (
                  <div className="form-error">
                    <AlertCircle size={14} />
                    <span>{formErrors.description}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Recording Grievance...</span>
                ) : (
                  <>
                    <span>Submit Grievance to Panchayat</span>
                    <Send size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Complaints Log */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ fontSize: '1rem' }}>
              My Filed Grievances ({complaints.length})
            </span>
          </div>

          <div className="card-body">
            {loading ? (
              <LoadingState message="Loading complaints log..." />
            ) : complaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                <CheckCircle2 size={28} color="#16a34a" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ margin: 0, fontSize: '0.88rem' }}>No active grievances logged.</p>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Your sanitation service has no reported complaints.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                          Token #{c.id}
                        </span>
                        <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a' }}>
                          {c.subject}
                        </strong>
                      </div>
                      {getStatusBadge(c.status)}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0.3rem 0', lineHeight: '1.4' }}>
                      {c.description}
                    </p>

                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Category: {c.complaint_type} &bull; Logged: {new Date(c.created_at).toLocaleDateString()}
                    </div>

                    {c.admin_notes && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.4rem 0.6rem',
                        backgroundColor: '#f0fdf4',
                        borderLeft: '3px solid #16a34a',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#166534'
                      }}>
                        <strong>Admin Note:</strong> {c.admin_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
