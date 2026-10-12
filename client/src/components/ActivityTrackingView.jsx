import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  FileSpreadsheet,
  PhoneCall,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Search
} from 'lucide-react';
import { misApi } from '../services/api';

export default function ActivityTrackingView({ mode, onSelectCandidate, showToast }) {
  // mode can be 'interviews', 'followups', 'submissions', 'activities'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchData();
  }, [mode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let res;
      if (mode === 'interviews') {
        res = await misApi.getInterviews();
      } else if (mode === 'followups') {
        res = await misApi.getFollowUps();
      } else if (mode === 'submissions') {
        res = await misApi.getSubmissions();
      } else {
        res = await misApi.getActivities();
      }
      setData(res.data || []);
    } catch (err) {
      showToast('Error loading tracking data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter(item => {
    if (!filterText) return true;
    const txt = filterText.toLowerCase();
    const candName = (item.candidate_name || item.name || '').toLowerCase();
    const pos = (item.position_title || '').toLowerCase();
    const cli = (item.client_name || '').toLowerCase();
    return candName.includes(txt) || pos.includes(txt) || cli.includes(txt);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Toolbar */}
      <div className="table-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {mode === 'interviews' ? <CalendarCheck size={20} color="#A855F7" /> :
             mode === 'followups' ? <Clock size={20} color="#F59E0B" /> :
             <FileSpreadsheet size={20} color="#10B981" />}
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {mode === 'interviews' ? 'Interview Schedule & Pipeline' :
                 mode === 'followups' ? 'Pending Candidate Follow-ups' :
                 'Candidate Submissions & Client Feedback'}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {filtered.length} active records tracked
              </div>
            </div>
          </div>

          <div className="search-input-box" style={{ minWidth: '220px' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter by candidate, client, position..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Loading records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="table-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No records found for this tracking category.
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                {mode === 'interviews' ? (
                  <tr>
                    <th>Candidate</th>
                    <th>Position Title</th>
                    <th>Client Account</th>
                    <th>Interview Date/Time</th>
                    <th>Stage Status</th>
                    <th>Feedback / Evaluation</th>
                    <th>Recruiter</th>
                    <th>Action</th>
                  </tr>
                ) : mode === 'followups' ? (
                  <tr>
                    <th>Candidate</th>
                    <th>Position & Client</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Pending Remarks</th>
                    <th>Recruiter</th>
                    <th>Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Candidate</th>
                    <th>Position & Client</th>
                    <th>Experience / CTC</th>
                    <th>Notice Period</th>
                    <th>Submission Status</th>
                    <th>Client SPOC Feedback</th>
                    <th>Recruiter</th>
                    <th>Action</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const statusClass = (item.candidate_status || item.current_status || item.status || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{item.candidate_name || item.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.candidate_phone || item.phone}</div>
                      </td>

                      {mode === 'interviews' ? (
                        <>
                          <td style={{ fontWeight: 600 }}>{item.position_title}</td>
                          <td>{item.client_name}</td>
                          <td style={{ color: '#A855F7', fontWeight: 600 }}>{item.interview_date || 'Date TBD'}</td>
                          <td><span className={`badge-status ${statusClass}`}>{item.candidate_status}</span></td>
                          <td>{item.feedback || 'Awaiting feedback'}</td>
                          <td>{item.recruiter_name}</td>
                        </>
                      ) : mode === 'followups' ? (
                        <>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.position_title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.client_name}</div>
                          </td>
                          <td>{item.candidate_phone}</td>
                          <td><span className={`badge-status ${statusClass}`}>{item.candidate_status}</span></td>
                          <td style={{ color: '#F59E0B' }}>{item.remarks || 'Follow-up pending'}</td>
                          <td>{item.recruiter_name}</td>
                        </>
                      ) : (
                        <>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.position_title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.client_name}</div>
                          </td>
                          <td>
                            <div>{item.experience}y exp</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.current_ctc}/{item.expected_ctc} LPA</div>
                          </td>
                          <td>{item.notice_period}</td>
                          <td><span className={`badge-status ${statusClass}`}>{item.current_status}</span></td>
                          <td>{item.client_feedback || 'Under evaluation by hiring manager'}</td>
                          <td>{item.recruiter_name}</td>
                        </>
                      )}

                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          onClick={() => onSelectCandidate(item.candidate_id || item.id)}
                        >
                          View
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
    </div>
  );
}
