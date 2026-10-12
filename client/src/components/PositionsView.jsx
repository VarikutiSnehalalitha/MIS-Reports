import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Sparkles, Building2, Users } from 'lucide-react';
import { misApi } from '../services/api';

export default function PositionsView({ showToast }) {
  const [positions, setPositions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPos, setNewPos] = useState({
    title: '',
    client_id: '',
    openings_count: 1,
    min_exp: 3,
    max_exp: 7,
    budget_ctc: '',
    location: 'Bangalore / Hybrid',
    department: 'Engineering',
    status: 'Open'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [posRes, cliRes] = await Promise.all([
        misApi.getPositions(),
        misApi.getClients()
      ]);
      setPositions(posRes.data || []);
      setClients(cliRes.data || []);
      if (cliRes.data && cliRes.data[0]) {
        setNewPos(prev => ({ ...prev, client_id: cliRes.data[0].id }));
      }
    } catch (err) {
      showToast('Error loading positions: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPos.title || !newPos.client_id) {
      showToast('Title and client are required', 'error');
      return;
    }
    try {
      await misApi.createPosition(newPos);
      showToast(`Position opening ${newPos.title} created`, 'success');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast('Failed to create position: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="table-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Briefcase size={20} color="var(--brand-primary)" />
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Positions & Active Openings</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Manage client requisitions, budget bands, and fulfillment</div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          <span>+ Add Position Opening</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Loading positions...</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Client Account</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'center' }}>Openings</th>
                  <th>Exp Required</th>
                  <th>Budget CTC</th>
                  <th style={{ textAlign: 'center' }}>Total Candidates</th>
                  <th style={{ textAlign: 'center' }}>Selected / Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.location}</div>
                    </td>
                    <td>{p.client_name}</td>
                    <td>{p.department || 'Technology'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.openings_count}</td>
                    <td>{p.min_exp} - {p.max_exp} yrs</td>
                    <td><span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{p.budget_ctc || 'Open'}</span></td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.candidate_count || 0}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ color: '#10B981', fontWeight: 700 }}>{p.selected_count || 0}</span> / <span style={{ color: '#059669', fontWeight: 800 }}>{p.joined_count || 0}</span>
                    </td>
                    <td>
                      <span className={`banner-badge ${p.status === 'Open' ? 'locked' : 'live'}`} style={{ fontSize: '0.68rem' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Position Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Create Position Opening</h2>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Position Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Senior Backend Engineer"
                    value={newPos.title}
                    onChange={(e) => setNewPos({ ...newPos, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Account *</label>
                  <select
                    className="form-control"
                    value={newPos.client_id}
                    onChange={(e) => setNewPos({ ...newPos, client_id: e.target.value })}
                    required
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Openings Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newPos.openings_count}
                      onChange={(e) => setNewPos({ ...newPos, openings_count: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Budget CTC</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 24-32 LPA"
                      value={newPos.budget_ctc}
                      onChange={(e) => setNewPos({ ...newPos, budget_ctc: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Min Experience (Yrs)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newPos.min_exp}
                      onChange={(e) => setNewPos({ ...newPos, min_exp: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Experience (Yrs)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newPos.max_exp}
                      onChange={(e) => setNewPos({ ...newPos, max_exp: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Position</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
