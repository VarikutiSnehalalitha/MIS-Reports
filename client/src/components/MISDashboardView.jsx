import React, { useState } from 'react';
import {
  Users,
  PhoneCall,
  PhoneForwarded,
  ThumbsUp,
  Clock,
  CalendarCheck,
  CheckCircle2,
  Award,
  UserCheck,
  UserX,
  AlertCircle,
  Lock,
  Unlock,
  Briefcase,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function MISDashboardView({
  snapshot,
  selectedDate,
  onFreezeSnapshot,
  onSelectCandidate,
  onOpenDailyEntry
}) {
  const [activeTab, setActiveTab] = useState('positions');

  if (!snapshot) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
        <p style={{ marginTop: '12px' }}>Loading MIS data for {selectedDate}...</p>
      </div>
    );
  }

  const { metrics = {}, breakdown_positions = [], breakdown_clients = [], breakdown_recruiters = [], candidates = [] } = snapshot;

  const isFrozen = snapshot.is_frozen;
  const isLocked = snapshot.status === 'Locked';

  // KPI card configs
  const kpiItems = [
    { label: 'Sourced', value: metrics.sourced || 0, icon: Users, color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' },
    { label: 'Contacted', value: metrics.contacted || 0, icon: PhoneCall, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
    { label: 'Connected', value: metrics.connected || 0, icon: PhoneForwarded, color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.12)' },
    { label: 'Interested', value: metrics.interested || 0, icon: ThumbsUp, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    { label: 'Follow-up', value: metrics.follow_up || 0, icon: Clock, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    { label: 'Interview Scheduled', value: metrics.interview_scheduled || 0, icon: CalendarCheck, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' },
    { label: 'Interview Completed', value: metrics.interview_completed || 0, icon: CheckCircle2, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
    { label: 'Selected', value: metrics.selected || 0, icon: Award, color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' },
    { label: 'Joined', value: metrics.joined || 0, icon: UserCheck, color: '#059669', bg: 'rgba(5, 150, 105, 0.25)' },
    { label: 'Dropped', value: metrics.dropped || 0, icon: UserX, color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.12)' },
    { label: 'Pending', value: metrics.pending || 0, icon: AlertCircle, color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)' }
  ];

  // Funnel conversion percentages based on sourced
  const totalSourced = metrics.sourced || 1;
  const funnelStages = [
    { label: '1. Sourced', count: metrics.sourced || 0, rate: '100%' },
    { label: '2. Contacted', count: metrics.contacted || 0, rate: `${Math.round(((metrics.contacted || 0) / totalSourced) * 100)}%` },
    { label: '3. Connected', count: metrics.connected || 0, rate: `${Math.round(((metrics.connected || 0) / totalSourced) * 100)}%` },
    { label: '4. Interested', count: metrics.interested || 0, rate: `${Math.round(((metrics.interested || 0) / totalSourced) * 100)}%` },
    { label: '5. Interviews', count: (metrics.interview_scheduled || 0) + (metrics.interview_completed || 0), rate: `${Math.round((((metrics.interview_scheduled || 0) + (metrics.interview_completed || 0)) / totalSourced) * 100)}%` },
    { label: '6. Selected', count: metrics.selected || 0, rate: `${Math.round(((metrics.selected || 0) / totalSourced) * 100)}%` },
    { label: '7. Joined', count: metrics.joined || 0, rate: `${Math.round(((metrics.joined || 0) / totalSourced) * 100)}%` }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Historical Status Banner */}
      <div className={`snapshot-banner ${isLocked ? 'locked' : isFrozen ? 'frozen' : 'live'}`}>
        <div className="banner-content">
          <span className={`banner-badge ${isLocked ? 'locked' : isFrozen ? 'frozen' : 'live'}`}>
            {isLocked ? <Lock size={13} /> : isFrozen ? <ShieldCheck size={13} /> : <Unlock size={13} />}
            {isLocked ? 'Locked Snapshot' : isFrozen ? 'Frozen Snapshot' : 'Live Ongoing'}
          </span>
          <div className="banner-text">
            <strong>MIS for {selectedDate} (v{snapshot.version || 1}):</strong>{' '}
            {isLocked
              ? 'This historical snapshot is permanently LOCKED and immutable. Subsequent candidate entries or updates do not alter this day\'s records.'
              : isFrozen
              ? 'Point-in-time daily snapshot frozen. Any future changes can generate an audited v2 if re-frozen.'
              : 'Live real-time operational calculations. Click "Freeze Snapshot" to permanently save today\'s day-end snapshot.'}
            {snapshot.notes && (
              <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Note: {snapshot.notes} • Frozen by: {snapshot.created_by || 'System'}
              </span>
            )}
          </div>
        </div>

        {!isLocked && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onFreezeSnapshot(selectedDate)}
            style={{ flexShrink: 0 }}
          >
            <Lock size={14} />
            <span>Freeze {selectedDate} Snapshot</span>
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {kpiItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">{item.label}</span>
                <div className="kpi-icon-wrap" style={{ background: item.bg, color: item.color }}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="kpi-value">{item.value}</div>
              <div className="kpi-footer">
                <span>{selectedDate} count</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recruitment Funnel Visualizer */}
      <div className="funnel-container">
        <div className="funnel-header">
          <div className="section-title">
            <Sparkles size={18} color="var(--brand-primary)" />
            <span>Candidate Conversion Funnel ({selectedDate})</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Conversion pipeline from initial sourcing to confirmed joinee
          </div>
        </div>

        <div className="funnel-stages">
          {funnelStages.map((stage, sIdx) => (
            <React.Fragment key={sIdx}>
              <div className="funnel-stage-card">
                <div className="funnel-stage-label">{stage.label}</div>
                <div className="funnel-stage-count">{stage.count}</div>
                <div className="funnel-stage-rate">{stage.rate} conversion</div>
              </div>
              {sIdx < funnelStages.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <ArrowRight size={14} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Granular Breakdown Tabs */}
      <div className="table-card">
        <div style={{ padding: '16px 20px 0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'positions' ? 'active' : ''}`}
              onClick={() => setActiveTab('positions')}
            >
              <Briefcase size={15} />
              <span>Position-wise MIS ({breakdown_positions.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'recruiters' ? 'active' : ''}`}
              onClick={() => setActiveTab('recruiters')}
            >
              <UserCheck size={15} />
              <span>Recruiter-wise MIS ({breakdown_recruiters.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
              onClick={() => setActiveTab('clients')}
            >
              <Building2 size={15} />
              <span>Client-wise MIS ({breakdown_clients.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'candidates' ? 'active' : ''}`}
              onClick={() => setActiveTab('candidates')}
            >
              <Users size={15} />
              <span>Active Candidates Snapshot ({candidates.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Position Breakdown */}
        {activeTab === 'positions' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Position Title</th>
                  <th>Client</th>
                  <th>Budget CTC</th>
                  <th style={{ textAlign: 'center' }}>Sourced</th>
                  <th style={{ textAlign: 'center' }}>Contacted</th>
                  <th style={{ textAlign: 'center' }}>Connected</th>
                  <th style={{ textAlign: 'center' }}>Interested</th>
                  <th style={{ textAlign: 'center' }}>Interviews</th>
                  <th style={{ textAlign: 'center' }}>Selected</th>
                  <th style={{ textAlign: 'center' }}>Joined</th>
                  <th style={{ textAlign: 'center' }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {breakdown_positions.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No position breakdown logged for {selectedDate}
                    </td>
                  </tr>
                ) : (
                  breakdown_positions.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{p.title}</td>
                      <td>{p.client_name}</td>
                      <td><span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.budget_ctc || 'N/A'}</span></td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.sourced || 0}</td>
                      <td style={{ textAlign: 'center' }}>{p.contacted || 0}</td>
                      <td style={{ textAlign: 'center' }}>{p.connected || 0}</td>
                      <td style={{ textAlign: 'center' }}>{p.interested || 0}</td>
                      <td style={{ textAlign: 'center', color: '#A855F7', fontWeight: 600 }}>{p.interview_scheduled || 0}</td>
                      <td style={{ textAlign: 'center', color: '#10B981', fontWeight: 600 }}>{p.selected || 0}</td>
                      <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>{p.joined || 0}</td>
                      <td style={{ textAlign: 'center' }}>{p.pending || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Recruiter Breakdown */}
        {activeTab === 'recruiters' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recruiter Name</th>
                  <th>Department</th>
                  <th>Monthly Target</th>
                  <th style={{ textAlign: 'center' }}>Sourced</th>
                  <th style={{ textAlign: 'center' }}>Contacted</th>
                  <th style={{ textAlign: 'center' }}>Connected</th>
                  <th style={{ textAlign: 'center' }}>Interested</th>
                  <th style={{ textAlign: 'center' }}>Interviews</th>
                  <th style={{ textAlign: 'center' }}>Selected</th>
                  <th style={{ textAlign: 'center' }}>Joined</th>
                  <th style={{ textAlign: 'center' }}>Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {breakdown_recruiters.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No recruiter records found
                    </td>
                  </tr>
                ) : (
                  breakdown_recruiters.map((r, idx) => {
                    const eff = r.sourced > 0 ? Math.round(((r.selected || 0) / r.sourced) * 100) : 0;
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{r.recruiter_name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.department || 'Talent Acquisition'}</td>
                        <td>{r.target_monthly} hires/mo</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.sourced || 0}</td>
                        <td style={{ textAlign: 'center' }}>{r.contacted || 0}</td>
                        <td style={{ textAlign: 'center' }}>{r.connected || 0}</td>
                        <td style={{ textAlign: 'center' }}>{r.interested || 0}</td>
                        <td style={{ textAlign: 'center', color: '#A855F7', fontWeight: 600 }}>{r.interview_scheduled || 0}</td>
                        <td style={{ textAlign: 'center', color: '#10B981', fontWeight: 600 }}>{r.selected || 0}</td>
                        <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>{r.joined || 0}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--brand-primary)' }}>{eff}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Client Breakdown */}
        {activeTab === 'clients' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Account</th>
                  <th>Industry</th>
                  <th style={{ textAlign: 'center' }}>Active Positions</th>
                  <th style={{ textAlign: 'center' }}>Sourced</th>
                  <th style={{ textAlign: 'center' }}>Interviews</th>
                  <th style={{ textAlign: 'center' }}>Selected</th>
                  <th style={{ textAlign: 'center' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {breakdown_clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No client records found
                    </td>
                  </tr>
                ) : (
                  breakdown_clients.map((c, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{c.client_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.industry || 'Enterprise'}</td>
                      <td style={{ textAlign: 'center' }}>{c.active_positions || 0}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.sourced || 0}</td>
                      <td style={{ textAlign: 'center', color: '#A855F7', fontWeight: 600 }}>{c.interview_scheduled || 0}</td>
                      <td style={{ textAlign: 'center', color: '#10B981', fontWeight: 600 }}>{c.selected || 0}</td>
                      <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>{c.joined || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Candidates active on this date */}
        {activeTab === 'candidates' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position</th>
                  <th>Client</th>
                  <th>Recruiter</th>
                  <th>Experience</th>
                  <th>CTC (LPA)</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No candidate profiles logged on or before {selectedDate}
                    </td>
                  </tr>
                ) : (
                  candidates.slice(0, 15).map((cand, idx) => {
                    const statusClass = cand.status.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    return (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{cand.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cand.phone} • {cand.email}</div>
                        </td>
                        <td>{cand.position_title || 'N/A'}</td>
                        <td>{cand.client_name || 'N/A'}</td>
                        <td>{cand.recruiter_name || 'N/A'}</td>
                        <td>{cand.experience} yrs</td>
                        <td>{cand.current_ctc} / {cand.expected_ctc} ECTC</td>
                        <td>
                          <span className={`badge-status ${statusClass}`}>{cand.status}</span>
                        </td>
                        <td>{cand.created_date}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onSelectCandidate(cand.id)}
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
