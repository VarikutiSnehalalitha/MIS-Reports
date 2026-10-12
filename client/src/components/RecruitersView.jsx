import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Sparkles, Award, Target, Phone, Mail } from 'lucide-react';
import { misApi } from '../services/api';

export default function RecruitersView({ showToast }) {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRec, setNewRec] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Tech Talent Acquisition',
    target_monthly: 5,
    status: 'Active'
  });

  useEffect(() => {
    loadRecruiters();
  }, []);

  const loadRecruiters = async () => {
    try {
      setLoading(true);
      const res = await misApi.getRecruiters();
      setRecruiters(res.data || []);
    } catch (err) {
      showToast('Error loading recruiters: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newRec.name) {
      showToast('Name is required', 'error');
      return;
    }
    try {
      await misApi.createRecruiter(newRec);
      showToast(`Recruiter ${newRec.name} added`, 'success');
      setShowAddModal(false);
      loadRecruiters();
    } catch (err) {
      showToast('Failed to add recruiter: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="table-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCheck size={20} color="var(--brand-primary)" />
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recruiter Performance & Sourcing Targets</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Track recruiter throughput, monthly hiring targets, and efficiency</div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          <span>+ Add Recruiter</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Loading recruiters...</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recruiter Name</th>
                  <th>Department</th>
                  <th>Contact Details</th>
                  <th style={{ textAlign: 'center' }}>Monthly Target</th>
                  <th style={{ textAlign: 'center' }}>Candidates Managed</th>
                  <th style={{ textAlign: 'center' }}>Interviews Conducted</th>
                  <th style={{ textAlign: 'center' }}>Selected</th>
                  <th style={{ textAlign: 'center' }}>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{r.name}</div>
                    </td>
                    <td>{r.department || 'Talent Acquisition'}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{r.email}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.phone}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.target_monthly} hires/mo</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.total_candidates || 0}</td>
                    <td style={{ textAlign: 'center', color: '#A855F7', fontWeight: 600 }}>{r.interviews_count || 0}</td>
                    <td style={{ textAlign: 'center', color: '#10B981', fontWeight: 700 }}>{r.selected_count || 0}</td>
                    <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>{r.joined_count || 0}</td>
                    <td>
                      <span className={`banner-badge ${r.status === 'Active' ? 'locked' : 'live'}`} style={{ fontSize: '0.68rem' }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Recruiter Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Team Recruiter</h2>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Rohini Deshmukh"
                    value={newRec.name}
                    onChange={(e) => setNewRec({ ...newRec, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newRec.email}
                      onChange={(e) => setNewRec({ ...newRec, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newRec.phone}
                      onChange={(e) => setNewRec({ ...newRec, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newRec.department}
                      onChange={(e) => setNewRec({ ...newRec, department: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Target Hires</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newRec.target_monthly}
                      onChange={(e) => setNewRec({ ...newRec, target_monthly: parseInt(e.target.value, 10) || 5 })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Recruiter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
