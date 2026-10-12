import React, { useState, useEffect } from 'react';
import { Building2, Plus, Sparkles, MapPin, Phone, Mail } from 'lucide-react';
import { misApi } from '../services/api';

export default function ClientsView({ showToast }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    industry: 'SaaS / Enterprise',
    spoc_name: '',
    spoc_email: '',
    spoc_phone: '',
    location: 'Bangalore',
    status: 'Active'
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await misApi.getClients();
      setClients(res.data || []);
    } catch (err) {
      showToast('Error loading clients: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newClient.name) {
      showToast('Client name is required', 'error');
      return;
    }
    try {
      await misApi.createClient(newClient);
      showToast(`Client account ${newClient.name} added`, 'success');
      setShowAddModal(false);
      loadClients();
    } catch (err) {
      showToast('Failed to add client: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="table-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={20} color="var(--brand-primary)" />
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Client Accounts & Directory</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Corporate accounts, SPOC details, and requisition volume</div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          <span>+ Add Client Account</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Loading client accounts...</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Industry Domain</th>
                  <th>SPOC Contact</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'center' }}>Active Positions</th>
                  <th style={{ textAlign: 'center' }}>Candidate Pool</th>
                  <th style={{ textAlign: 'center' }}>Selected</th>
                  <th style={{ textAlign: 'center' }}>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                    </td>
                    <td>{c.industry || 'Technology'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.spoc_name || 'N/A'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.spoc_email} • {c.spoc_phone}</div>
                    </td>
                    <td>{c.location || 'India'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.position_count || 0}</td>
                    <td style={{ textAlign: 'center' }}>{c.candidate_count || 0}</td>
                    <td style={{ textAlign: 'center', color: '#10B981', fontWeight: 700 }}>{c.selected_count || 0}</td>
                    <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>{c.joined_count || 0}</td>
                    <td>
                      <span className={`banner-badge ${c.status === 'Active' ? 'locked' : 'live'}`} style={{ fontSize: '0.68rem' }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Corporate Client</h2>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Acme Technologies"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry Domain</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Fintech / Banking"
                    value={newClient.industry}
                    onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">SPOC Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Contact person"
                      value={newClient.spoc_name}
                      onChange={(e) => setNewClient({ ...newClient, spoc_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newClient.location}
                      onChange={(e) => setNewClient({ ...newClient, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">SPOC Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="email@company.com"
                      value={newClient.spoc_email}
                      onChange={(e) => setNewClient({ ...newClient, spoc_email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SPOC Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+91 98..."
                      value={newClient.spoc_phone}
                      onChange={(e) => setNewClient({ ...newClient, spoc_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
