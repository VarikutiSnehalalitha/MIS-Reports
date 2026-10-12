import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Download,
  Printer,
  Sparkles,
  Users,
  Award,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { misApi } from '../services/api';

export default function RangeReportsView({ initialStart, initialEnd, onOpenPrintModal, showToast }) {
  const [startDate, setStartDate] = useState(initialStart || '2026-10-01');
  const [endDate, setEndDate] = useState(initialEnd || '2026-10-08');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialStart && initialEnd) {
      setStartDate(initialStart);
      setEndDate(initialEnd);
    }
  }, [initialStart, initialEnd]);

  useEffect(() => {
    fetchRangeReport();
  }, [startDate, endDate]);

  const fetchRangeReport = async () => {
    try {
      setLoading(true);
      const res = await misApi.getRangeReport(startDate, endDate);
      setReport(res.data);
    } catch (err) {
      showToast('Error loading range report: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyPreset = () => {
    setStartDate('2026-10-01');
    setEndDate('2026-10-08');
    showToast('Loaded Weekly MIS (01 Oct – 08 Oct)', 'info');
  };

  const handleMonthlyPreset = () => {
    setStartDate('2026-10-01');
    setEndDate('2026-10-31');
    showToast('Loaded Monthly MIS (October 2026)', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Range Controls & Quick Presets */}
      <div className="table-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--brand-primary)" />
              <span>Executive MIS Range Report Engine</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Consolidate day-by-day historical snapshots into comprehensive weekly and monthly reports
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${startDate === '2026-10-01' && endDate === '2026-10-08' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={handleWeeklyPreset}
            >
              Weekly MIS (01 Oct – 08 Oct)
            </button>

            <button
              className={`btn ${startDate === '2026-10-01' && endDate === '2026-10-31' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={handleMonthlyPreset}
            >
              Monthly MIS (Oct 2026)
            </button>

            <div className="date-selector-container">
              <span className="date-selector-label"><Calendar size={13} /> From:</span>
              <input
                type="date"
                className="date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="date-selector-label">To:</span>
              <input
                type="date"
                className="date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button className="btn btn-secondary btn-sm" onClick={onOpenPrintModal} title="Print / PDF preview">
              <Printer size={14} />
              <span>Print PDF</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Compiling range report...</p>
        </div>
      ) : !report ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>No range data available.</div>
      ) : (
        <>
          {/* Cumulative Metrics Grid */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Cumulative Sourced</span>
                <div className="kpi-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
                  <Users size={16} />
                </div>
              </div>
              <div className="kpi-value">{report.cumulative_metrics.sourced || 0}</div>
              <div className="kpi-footer">Across {report.total_days} days</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Cumulative Contacted</span>
                <div className="kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                  <Users size={16} />
                </div>
              </div>
              <div className="kpi-value">{report.cumulative_metrics.contacted || 0}</div>
              <div className="kpi-footer">Outreach attempts</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Interviews Conducted</span>
                <div className="kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}>
                  <Calendar size={16} />
                </div>
              </div>
              <div className="kpi-value">{report.cumulative_metrics.interview_scheduled || 0}</div>
              <div className="kpi-footer">Candidate evaluations</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Offers / Selected</span>
                <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                  <Award size={16} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: '#10B981' }}>{report.cumulative_metrics.selected || 0}</div>
              <div className="kpi-footer">Total selected</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Total Joined</span>
                <div className="kpi-icon-wrap" style={{ background: 'rgba(5, 150, 105, 0.2)', color: '#059669' }}>
                  <UserCheck size={16} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: '#059669' }}>{report.cumulative_metrics.joined || 0}</div>
              <div className="kpi-footer">Confirmed onboarded</div>
            </div>
          </div>

          {/* Daily Trend Table */}
          <div className="table-card">
            <div className="table-toolbar">
              <div style={{ fontWeight: 700 }}>Day-by-Day Historical Progression</div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {report.daily_trend.length} snapshots in range
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Sourced</th>
                    <th style={{ textAlign: 'center' }}>Contacted</th>
                    <th style={{ textAlign: 'center' }}>Connected</th>
                    <th style={{ textAlign: 'center' }}>Interested</th>
                    <th style={{ textAlign: 'center' }}>Interviews</th>
                    <th style={{ textAlign: 'center' }}>Selected</th>
                    <th style={{ textAlign: 'center' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {report.daily_trend.map((day, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>
                        {day.date}
                        {day.date === '2026-10-08' && (
                          <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: '#10B981', fontWeight: 800 }}>
                            ★ Benchmark
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`banner-badge ${day.is_frozen ? 'frozen' : 'live'}`} style={{ fontSize: '0.65rem' }}>
                          {day.is_frozen ? 'Frozen' : 'Live'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{day.metrics.sourced || 0}</td>
                      <td style={{ textAlign: 'center' }}>{day.metrics.contacted || 0}</td>
                      <td style={{ textAlign: 'center' }}>{day.metrics.connected || 0}</td>
                      <td style={{ textAlign: 'center' }}>{day.metrics.interested || 0}</td>
                      <td style={{ textAlign: 'center', color: '#A855F7', fontWeight: 600 }}>{day.metrics.interview_scheduled || 0}</td>
                      <td style={{ textAlign: 'center', color: '#10B981', fontWeight: 700 }}>{day.metrics.selected || 0}</td>
                      <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>{day.metrics.joined || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consolidations: Positions & Recruiters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Positions Consolidated */}
            <div className="table-card">
              <div className="table-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Briefcase size={16} color="var(--brand-primary)" />
                  <span>Position Totals in Range</span>
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Position Title</th>
                      <th style={{ textAlign: 'center' }}>Sourced</th>
                      <th style={{ textAlign: 'center' }}>Interviews</th>
                      <th style={{ textAlign: 'center' }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.positions_summary.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>
                          {p.title}
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.client_name}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.sourced}</td>
                        <td style={{ textAlign: 'center', color: '#A855F7' }}>{p.interview_scheduled}</td>
                        <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{p.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recruiters Consolidated */}
            <div className="table-card">
              <div className="table-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <UserCheck size={16} color="var(--brand-primary)" />
                  <span>Recruiter Output in Range</span>
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Recruiter</th>
                      <th style={{ textAlign: 'center' }}>Sourced</th>
                      <th style={{ textAlign: 'center' }}>Interviews</th>
                      <th style={{ textAlign: 'center' }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.recruiters_summary.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{r.recruiter_name}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.sourced}</td>
                        <td style={{ textAlign: 'center', color: '#A855F7' }}>{r.interview_scheduled}</td>
                        <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{r.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
