import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  Kanban,
  Table as TableIcon,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { misApi } from '../services/api';

const STATUS_LIST = [
  'All',
  'Sourced',
  'Contacted',
  'Connected',
  'Interested',
  'Not Interested',
  'Follow-up',
  'Interview Scheduled',
  'Interview Completed',
  'Selected',
  'Rejected',
  'Joined',
  'Dropped',
  'Pending'
];

export default function CandidateDatabaseView({
  onSelectCandidate,
  onOpenAddCandidate,
  showToast
}) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [positions, setPositions] = useState([]);
  const [clients, setClients] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedRecruiter, setSelectedRecruiter] = useState('');

  useEffect(() => {
    fetchCandidates();
    loadDropdowns();
  }, [selectedStatus, selectedPosition, selectedRecruiter]);

  const loadDropdowns = async () => {
    try {
      const [posRes, cliRes, recRes] = await Promise.all([
        misApi.getPositions(),
        misApi.getClients(),
        misApi.getRecruiters()
      ]);
      setPositions(posRes.data || []);
      setClients(cliRes.data || []);
      setRecruiters(recRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedStatus && selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedPosition) params.append('position_id', selectedPosition);
      if (selectedRecruiter) params.append('recruiter_id', selectedRecruiter);

      const res = await misApi.getCandidates(params.toString());
      setCandidates(res.data || []);
    } catch (err) {
      showToast('Error loading candidates: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCandidates();
  };

  const handleQuickStatusChange = async (candidateId, newStatus) => {
    try {
      await misApi.updateCandidateStatus(candidateId, { status: newStatus });
      showToast(`Status updated to ${newStatus}`, 'success');
      fetchCandidates();
    } catch (err) {
      showToast('Error updating status: ' + err.message, 'error');
    }
  };

  const handleDeleteCandidate = async (candidateId, name) => {
    if (!window.confirm(`Are you sure you want to remove candidate ${name}? An audit log will be generated.`)) return;
    try {
      await misApi.deleteCandidate(candidateId);
      showToast(`Candidate ${name} deleted successfully`, 'success');
      fetchCandidates();
    } catch (err) {
      showToast('Error deleting candidate: ' + err.message, 'error');
    }
  };

  // Filter in memory for instantaneous search response if needed
  const filteredCandidates = candidates.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.phone.toLowerCase().includes(s) ||
      (c.location && c.location.toLowerCase().includes(s)) ||
      (c.position_title && c.position_title.toLowerCase().includes(s))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toolbar & Filter Bar */}
      <div className="table-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
            <div className="search-input-box">
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search candidates by name, email, phone, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">Search</button>
          </form>

          {/* Filters & View Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <select
              className="form-control"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {STATUS_LIST.map(st => (
                <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
              ))}
            </select>

            {/* Position Filter */}
            <select
              className="form-control"
              style={{ padding: '6px 12px', fontSize: '0.8rem', maxWidth: '180px' }}
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="">All Positions</option>
              {positions.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>

            {/* Recruiter Filter */}
            <select
              className="form-control"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              value={selectedRecruiter}
              onChange={(e) => setSelectedRecruiter(e.target.value)}
            >
              <option value="">All Recruiters</option>
              {recruiters.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
              <button
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', border: 'none' }}
                onClick={() => setViewMode('table')}
                title="Table List View"
              >
                <TableIcon size={14} />
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', border: 'none' }}
                onClick={() => setViewMode('kanban')}
                title="Pipeline Stage Board View"
              >
                <Kanban size={14} />
              </button>
            </div>

            {/* Export CSV */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                window.open(misApi.getAllCandidatesCSVUrl(), '_blank');
                showToast('Exporting candidate database to CSV', 'success');
              }}
              title="Download CSV"
            >
              <Download size={14} />
            </button>

            {/* Add Candidate */}
            <button className="btn btn-primary btn-sm" onClick={onOpenAddCandidate}>
              <Plus size={14} />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Loading candidate pool...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="table-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>No candidates match the specified filters.</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={() => { setSearch(''); setSelectedStatus('All'); setSelectedPosition(''); setSelectedRecruiter(''); }}>
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Position & Client</th>
                  <th>Contact Info</th>
                  <th>Experience</th>
                  <th>CTC Bracket</th>
                  <th>Notice Period</th>
                  <th>Recruiter</th>
                  <th>Pipeline Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(cand => {
                  const statusClass = cand.status.toLowerCase().replace(/[^a-z0-9]/g, '-');
                  return (
                    <tr key={cand.id}>
                      <td>
                        <div
                          style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}
                          onClick={() => onSelectCandidate(cand.id)}
                        >
                          {cand.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {cand.location || 'Remote/India'} • Sourced {cand.created_date}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{cand.position_title || 'General'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cand.client_name || 'Direct'}</div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} color="var(--text-muted)" /> {cand.phone}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} color="var(--text-muted)" /> {cand.email}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{cand.experience} yrs</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Src: {cand.source || 'Portal'}</div>
                      </td>

                      <td>
                        <div><strong>{cand.current_ctc || 0}</strong> LPA Current</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--brand-primary)' }}>Exp: {cand.expected_ctc || 0} LPA</div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{cand.notice_period || '30 Days'}</span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 500 }}>{cand.recruiter_name}</div>
                      </td>

                      <td>
                        <select
                          className={`badge-status ${statusClass}`}
                          style={{ border: 'none', outline: 'none', cursor: 'pointer', fontVariant: 'normal' }}
                          value={cand.status}
                          onChange={(e) => handleQuickStatusChange(cand.id, e.target.value)}
                        >
                          {STATUS_LIST.filter(s => s !== 'All').map(st => (
                            <option key={st} value={st} style={{ background: 'var(--bg-modal)', color: 'var(--text-primary)' }}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => onSelectCandidate(cand.id)}
                            title="View Full Profile & Timeline"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => handleDeleteCandidate(cand.id, cand.name)}
                            title="Delete Candidate"
                            style={{ color: 'var(--status-danger)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
          {['Sourced', 'Contacted', 'Interested', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Joined'].map(stage => {
            const stageCands = filteredCandidates.filter(c => c.status === stage);
            return (
              <div
                key={stage}
                style={{
                  minWidth: '280px',
                  maxWidth: '320px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '75vh'
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {stage}
                  </div>
                  <span className="nav-badge" style={{ background: 'var(--bg-card-hover)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {stageCands.length}
                  </span>
                </div>

                <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stageCands.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      No profiles in {stage}
                    </div>
                  ) : (
                    stageCands.map(c => (
                      <div
                        key={c.id}
                        style={{
                          background: 'var(--bg-modal)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => onSelectCandidate(c.id)}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--brand-primary)', marginTop: '2px' }}>
                          {c.position_title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          Exp: {c.experience}y • {c.current_ctc}/{c.expected_ctc} LPA • {c.notice_period}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Rec: {c.recruiter_name}</span>
                          <ChevronRight size={13} color="var(--text-muted)" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
