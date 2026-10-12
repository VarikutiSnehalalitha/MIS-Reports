import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { misApi } from '../services/api';

export default function DateComparisonView({ showToast }) {
  const [date1, setDate1] = useState('2026-10-01');
  const [date2, setDate2] = useState('2026-10-08');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComparison();
  }, [date1, date2]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const res = await misApi.compareDates(date1, date2);
      setComparison(res.data);
    } catch (err) {
      showToast('Error comparing dates: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportComparison = () => {
    window.open(misApi.getComparisonExcelUrl(date1, date2), '_blank');
    showToast(`Exporting comparison between ${date1} and ${date2}`, 'success');
  };

  const keyMetrics = [
    'sourced', 'contacted', 'connected', 'interested',
    'interview_scheduled', 'selected', 'joined', 'dropped', 'pending'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Date Selection Controls */}
      <div className="table-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitCompare size={20} color="var(--brand-primary)" />
              <span>Historical Date-to-Date Comparison Engine</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Side-by-side delta calculation against permanent historical point-in-time snapshots
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="date-selector-container">
              <span className="date-selector-label"><Calendar size={13} /> Baseline:</span>
              <input
                type="date"
                className="date-input"
                value={date1}
                onChange={(e) => setDate1(e.target.value)}
              />
            </div>

            <div style={{ color: 'var(--text-muted)' }}>vs</div>

            <div className="date-selector-container">
              <span className="date-selector-label"><Calendar size={13} /> Target:</span>
              <input
                type="date"
                className="date-input"
                value={date2}
                onChange={(e) => setDate2(e.target.value)}
              />
            </div>

            <button className="btn btn-secondary btn-sm" onClick={handleExportComparison}>
              <Download size={14} />
              <span>Export Comparison (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Comparing snapshots {date1} and {date2}...</p>
        </div>
      ) : !comparison ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>No comparison data found.</div>
      ) : (
        <>
          {/* Metric Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {keyMetrics.map(key => {
              const diff = comparison.metrics_diff[key] || { date1_val: 0, date2_val: 0, change: 0, percent: 0 };
              const isPositive = diff.change > 0;
              const isNeutral = diff.change === 0;

              return (
                <div key={key} className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">{key.replace(/_/g, ' ')}</span>
                    <span className={`kpi-trend ${isPositive ? 'positive' : isNeutral ? '' : 'negative'}`}>
                      {isPositive ? <TrendingUp size={14} /> : isNeutral ? null : <TrendingDown size={14} />}
                      {isPositive ? `+${diff.change}` : diff.change} ({diff.percent}%)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{date1}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{diff.date1_val}</div>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)' }}>{date2}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{diff.date2_val}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Positions Comparison Table */}
          <div className="table-card">
            <div className="table-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Briefcase size={16} color="var(--brand-primary)" />
                <span>Position Performance Delta</span>
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {comparison.positions_diff.length} positions analyzed
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Position Title</th>
                    <th style={{ textAlign: 'center' }}>{date1} Sourced</th>
                    <th style={{ textAlign: 'center' }}>{date2} Sourced</th>
                    <th style={{ textAlign: 'center' }}>Sourced Delta</th>
                    <th style={{ textAlign: 'center' }}>Selections Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.positions_diff.map((pos, idx) => {
                    const diff = pos.sourced_diff;
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{pos.title}</td>
                        <td style={{ textAlign: 'center' }}>{pos.date1_sourced}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{pos.date2_sourced}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: diff > 0 ? '#10B981' : diff < 0 ? '#EF4444' : 'var(--text-muted)' }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td style={{ textAlign: 'center', color: '#10B981', fontWeight: 700 }}>
                          {pos.selected_diff > 0 ? `+${pos.selected_diff}` : pos.selected_diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recruiters Comparison Table */}
          <div className="table-card">
            <div className="table-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <UserCheck size={16} color="var(--brand-primary)" />
                <span>Recruiter Output Delta</span>
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {comparison.recruiters_diff.length} recruiters compared
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recruiter Name</th>
                    <th style={{ textAlign: 'center' }}>{date1} Sourced</th>
                    <th style={{ textAlign: 'center' }}>{date2} Sourced</th>
                    <th style={{ textAlign: 'center' }}>Sourcing Throughput</th>
                    <th style={{ textAlign: 'center' }}>Joined Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.recruiters_diff.map((rec, idx) => {
                    const diff = rec.sourced_diff;
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{rec.recruiter_name}</td>
                        <td style={{ textAlign: 'center' }}>{rec.date1_sourced}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{rec.date2_sourced}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: diff > 0 ? '#10B981' : diff < 0 ? '#EF4444' : 'var(--text-muted)' }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>
                          {rec.joined_diff > 0 ? `+${rec.joined_diff}` : rec.joined_diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
