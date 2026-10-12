import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Building2,
  UserCheck,
  Calendar,
  Clock,
  History,
  ShieldAlert,
  Save,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { misApi } from '../services/api';

const STATUS_OPTIONS = [
  'Sourced', 'Contacted', 'Connected', 'Interested', 'Not Interested',
  'Follow-up', 'Interview Scheduled', 'Interview Completed',
  'Selected', 'Rejected', 'Joined', 'Dropped', 'Pending'
];

export default function CandidateDetailDrawer({ candidateId, onClose, onUpdated, showToast }) {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [remarks, setRemarks] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [activeTab, setActiveTab] = useState('activities'); // 'activities' or 'audit'

  useEffect(() => {
    if (candidateId) {
      loadCandidate();
    }
  }, [candidateId]);

  const loadCandidate = async () => {
    try {
      setLoading(true);
      const res = await misApi.getCandidateById(candidateId);
      const data = res.data;
      setCandidate(data);
      setStatus(data.status);
      setFeedback(data.feedback || '');
      setRemarks(data.remarks || '');
      setInterviewDate(data.interview_date || '');
    } catch (err) {
      showToast('Error loading candidate profile: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!candidateId) return null;

  const handleUpdateStatus = async () => {
    try {
      await misApi.updateCandidateStatus(candidateId, {
        status,
        feedback,
        remarks,
        interview_date: interviewDate
      });
      showToast(`Updated status to ${status}`, 'success');
      loadCandidate();
      onUpdated();
    } catch (err) {
      showToast('Failed to update status: ' + err.message, 'error');
    }
  };

  const statusClass = (status || '').toLowerCase().replace(/[^a-z0-9]/g, '-');

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Candidate Profile</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ID: {candidateId}</div>
          </div>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loading || !candidate ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Sparkles size={28} style={{ animation: 'spin 2s linear infinite' }} />
            <p style={{ marginTop: '12px' }}>Loading candidate details...</p>
          </div>
        ) : (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Identity Card */}
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{candidate.name}</h2>
                <span className={`badge-status ${statusClass}`}>{candidate.status}</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={13} color="var(--brand-primary)" /> {candidate.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={13} color="var(--brand-primary)" /> {candidate.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={13} color="var(--brand-primary)" /> {candidate.location || 'India'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Position: </span>
                  <strong>{candidate.position_title}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Client: </span>
                  <strong>{candidate.client_name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Recruiter: </span>
                  <strong>{candidate.recruiter_name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Source: </span>
                  <strong>{candidate.source || 'Portal'}</strong>
                </div>
              </div>
            </div>

            {/* Compensation & Notice Period Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CURRENT CTC</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{candidate.current_ctc || 0} LPA</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>EXPECTED CTC</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{candidate.expected_ctc || 0} LPA</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>EXPERIENCE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{candidate.experience} Yrs</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>NOTICE PERIOD</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{candidate.notice_period || '30 Days'}</div>
              </div>
            </div>

            {/* Status Transition & Feedback Controls */}
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Transition Status & Update Feedback</div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Update Status</label>
                  <select
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Interview Date</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Client Feedback</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter latest evaluation or client feedback..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Recruiter Remarks</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Internal recruiter remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn btn-primary btn-sm" onClick={handleUpdateStatus} style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
                <Save size={14} />
                <span>Save Stage & Status Transition</span>
              </button>
            </div>

            {/* Activities & Audit Trail Tabs */}
            <div className="tabs-header">
              <button
                className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
                onClick={() => setActiveTab('activities')}
              >
                <Clock size={14} />
                <span>Touchpoints & Activities ({(candidate.activities || []).length})</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                <History size={14} />
                <span>Audit Change Log ({(candidate.auditHistory || []).length})</span>
              </button>
            </div>

            {activeTab === 'activities' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(candidate.activities || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px 0' }}>No touchpoints recorded.</div>
                ) : (
                  candidate.activities.map((act, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '3px solid var(--brand-primary)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{act.type}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{act.activity_date || act.created_at}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{act.notes}</div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(candidate.auditHistory || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px 0' }}>No audit history records.</div>
                ) : (
                  candidate.auditHistory.map((audit, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '3px solid #10B981',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>Action: {audit.action}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{audit.created_at}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{audit.details}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', marginTop: '2px' }}>
                        By: {audit.user_name || 'System'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
