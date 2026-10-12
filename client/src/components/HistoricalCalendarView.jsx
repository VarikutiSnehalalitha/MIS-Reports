import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Lock,
  Unlock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { misApi } from '../services/api';

export default function HistoricalCalendarView({
  onSelectDate,
  onNavigateToReports,
  showToast
}) {
  const [calendarIndex, setCalendarIndex] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewDate, setPreviewDate] = useState('2026-10-08');
  const [previewSnapshot, setPreviewSnapshot] = useState(null);

  useEffect(() => {
    fetchCalendarIndex();
  }, []);

  useEffect(() => {
    if (previewDate) {
      fetchPreviewSnapshot(previewDate);
    }
  }, [previewDate]);

  const fetchCalendarIndex = async () => {
    try {
      setLoading(true);
      const data = await misApi.getCalendarIndex(2026, 10);
      setCalendarIndex(data);
    } catch (err) {
      showToast('Error loading historical calendar index: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviewSnapshot = async (date) => {
    try {
      const res = await misApi.getHistoricalMIS(date);
      setPreviewSnapshot(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Cards & Quick Jumps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="kpi-card" style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Historical Benchmark</span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
              <Lock size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>08 October 2026</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Permanent locked historical snapshot. Unaffected by later dates.
          </p>
          <button
            className="btn btn-primary btn-sm"
            style={{ width: '100%' }}
            onClick={() => onSelectDate('2026-10-08')}
          >
            <span>Open 08 Oct MIS</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Weekly Preset</span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>01 Oct – 08 Oct</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Consolidated 8-day weekly management review and audit aggregation.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={() => onNavigateToReports('2026-10-01', '2026-10-08')}
          >
            <span>View Weekly MIS</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Monthly Preset</span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>October 2026</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Full monthly recruitment throughput and cumulative analytics.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={() => onNavigateToReports('2026-10-01', '2026-10-31')}
          >
            <span>View Monthly MIS</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Split: Calendar Snapshot Index & Live Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Left: Historical Dates Timeline */}
        <div className="table-card">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <CalendarDays size={18} color="var(--brand-primary)" />
              <span>Historical Snapshot Archive (October 2026)</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {calendarIndex.length} dates recorded
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th style={{ textAlign: 'center' }}>Sourced</th>
                  <th style={{ textAlign: 'center' }}>Interviews</th>
                  <th style={{ textAlign: 'center' }}>Selected</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Loading historical snapshots...
                    </td>
                  </tr>
                ) : calendarIndex.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No snapshots found
                    </td>
                  </tr>
                ) : (
                  calendarIndex.map((item, idx) => {
                    const isSelected = previewDate === item.mis_date;
                    const isLocked = item.status === 'Locked';
                    const isFrozen = item.is_frozen;

                    return (
                      <tr
                        key={idx}
                        style={{
                          background: isSelected ? 'var(--brand-subtle)' : 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => setPreviewDate(item.mis_date)}
                      >
                        <td style={{ fontWeight: 700 }}>
                          {item.mis_date}
                          {item.mis_date === '2026-10-08' && (
                            <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: '#10B981', fontWeight: 800 }}>
                              ★ Benchmark
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`banner-badge ${isLocked ? 'locked' : isFrozen ? 'frozen' : 'live'}`}
                            style={{ fontSize: '0.65rem', padding: '2px 8px' }}
                          >
                            {isLocked ? <Lock size={10} /> : isFrozen ? <ShieldCheck size={10} /> : <Unlock size={10} />}
                            {item.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>v{item.version || 1}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.metrics.sourced || 0}</td>
                        <td style={{ textAlign: 'center', color: '#A855F7' }}>{item.metrics.interview_scheduled || 0}</td>
                        <td style={{ textAlign: 'center', color: '#10B981', fontWeight: 700 }}>{item.metrics.selected || 0}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDate(item.mis_date);
                            }}
                          >
                            Open MIS
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Date Inspector */}
        <div className="table-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Snapshot Inspector</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Point-in-time state for: <strong style={{ color: 'var(--text-primary)' }}>{previewDate}</strong>
              </div>
            </div>
            {previewSnapshot && (
              <span className={`banner-badge ${previewSnapshot.status === 'Locked' ? 'locked' : previewSnapshot.is_frozen ? 'frozen' : 'live'}`}>
                {previewSnapshot.status}
              </span>
            )}
          </div>

          {previewSnapshot ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Snapshot metadata */}
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Version:</strong> v{previewSnapshot.version}</div>
                <div><strong>Frozen At:</strong> {previewSnapshot.created_at || 'Live'}</div>
                <div><strong>Frozen By:</strong> {previewSnapshot.created_by || 'System'}</div>
                <div><strong>Notes:</strong> {previewSnapshot.notes || 'No notes'}</div>
              </div>

              {/* Quick Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SOURCED</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{previewSnapshot.metrics.sourced || 0}</div>
                </div>
                <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CONNECTED</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0EA5E9' }}>{previewSnapshot.metrics.connected || 0}</div>
                </div>
                <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>INTERVIEWS</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#A855F7' }}>{previewSnapshot.metrics.interview_scheduled || 0}</div>
                </div>
                <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SELECTED</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981' }}>{previewSnapshot.metrics.selected || 0}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => onSelectDate(previewDate)}
                >
                  <span>Open Full Dashboard</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => window.open(misApi.getExcelExportUrl(previewDate), '_blank')}
                  title="Export this snapshot to Excel"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Select a date on the left to inspect its historical snapshot
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
