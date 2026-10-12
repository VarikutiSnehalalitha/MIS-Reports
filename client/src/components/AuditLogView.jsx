import React, { useState, useEffect } from 'react';
import { History, Search, Shield, Clock, User, Sparkles, Eye, X } from 'lucide-react';
import { misApi } from '../services/api';

export default function AuditLogView({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [inspectLog, setInspectLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (entityFilter !== 'All') params.append('entity_type', entityFilter);
      if (actionFilter !== 'All') params.append('action', actionFilter);
      if (search) params.append('user_name', search);

      const res = await misApi.getAuditLogs(params.toString());
      setLogs(res.data || []);
    } catch (err) {
      showToast('Error loading audit logs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'SNAPSHOT_FREEZE': return { bg: 'rgba(99, 102, 241, 0.2)', color: '#818CF8' };
      case 'STATUS_CHANGE': return { bg: 'rgba(168, 85, 247, 0.2)', color: '#C084FC' };
      case 'CREATE': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#34D399' };
      case 'UPDATE': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' };
      case 'DELETE': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#F87171' };
      default: return { bg: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toolbar */}
      <div className="table-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} color="var(--brand-primary)" />
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>System Audit & Historical Change Trail</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Immutable audit ledger recording every snapshot freeze, candidate transition, and operational change
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Entity Filter */}
            <select
              className="form-control"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="All">All Entities</option>
              <option value="Snapshot">Snapshot</option>
              <option value="Candidate">Candidate</option>
              <option value="DailyMIS">Daily MIS</option>
              <option value="Position">Position</option>
              <option value="Client">Client</option>
              <option value="Recruiter">Recruiter</option>
            </select>

            {/* Action Filter */}
            <select
              className="form-control"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="All">All Actions</option>
              <option value="SNAPSHOT_FREEZE">Snapshot Freeze</option>
              <option value="STATUS_CHANGE">Status Change</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px' }}>
              <div className="search-input-box" style={{ minWidth: '180px', padding: '6px 10px' }}>
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter by user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm">Filter</button>
            </form>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Loading audit records...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="table-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No audit records found matching criteria.
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Target ID</th>
                  <th>Modified By</th>
                  <th>Event Description</th>
                  <th style={{ textAlign: 'right' }}>Payload Diff</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const style = getActionColor(log.action);
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {log.created_at}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: style.bg,
                            color: style.color
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.entity_type}</td>
                      <td>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {log.entity_id ? log.entity_id.substring(0, 14) + '...' : 'System'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.user_name || 'System'}</div>
                      </td>
                      <td>{log.details}</td>
                      <td style={{ textAlign: 'right' }}>
                        {(log.old_values || log.new_values) ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                            onClick={() => setInspectLog(log)}
                          >
                            <Eye size={12} />
                            <span>View Diff</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON Diff Inspector Modal */}
      {inspectLog && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Audit Record Inspector</h2>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Action: {inspectLog.action} on {inspectLog.entity_type} • {inspectLog.created_at}
                </div>
              </div>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setInspectLog(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Event Details:</div>
                <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                  {inspectLog.details}
                </div>
              </div>

              {inspectLog.old_values && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#EF4444', marginBottom: '6px' }}>Previous State (Before):</div>
                  <pre style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--text-secondary)' }}>
                    {(() => {
                      try { return JSON.stringify(JSON.parse(inspectLog.old_values), null, 2); }
                      catch (e) { return inspectLog.old_values; }
                    })()}
                  </pre>
                </div>
              )}

              {inspectLog.new_values && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981', marginBottom: '6px' }}>Updated State (After):</div>
                  <pre style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--text-primary)' }}>
                    {(() => {
                      try { return JSON.stringify(JSON.parse(inspectLog.new_values), null, 2); }
                      catch (e) { return inspectLog.new_values; }
                    })()}
                  </pre>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setInspectLog(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
