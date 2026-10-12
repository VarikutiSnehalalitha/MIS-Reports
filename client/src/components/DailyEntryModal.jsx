import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle } from 'lucide-react';
import { misApi } from '../services/api';

export default function DailyEntryModal({ isOpen, onClose, onSuccess, showToast, defaultDate }) {
  const [formData, setFormData] = useState({
    mis_date: defaultDate || new Date().toISOString().split('T')[0],
    recruiter_id: '',
    position_id: '',
    client_id: '',
    sourced: 5,
    contacted: 4,
    connected: 3,
    interested: 2,
    not_interested: 1,
    follow_up: 1,
    interview_scheduled: 1,
    interview_completed: 0,
    selected: 0,
    rejected: 0,
    joined: 0,
    dropped: 0,
    pending: 1,
    remarks: ''
  });

  const [positions, setPositions] = useState([]);
  const [clients, setClients] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMasterData();
    }
  }, [isOpen]);

  const loadMasterData = async () => {
    try {
      const [posRes, cliRes, recRes] = await Promise.all([
        misApi.getPositions(),
        misApi.getClients(),
        misApi.getRecruiters()
      ]);
      const posList = posRes.data || [];
      const cliList = cliRes.data || [];
      const recList = recRes.data || [];

      setPositions(posList);
      setClients(cliList);
      setRecruiters(recList);

      setFormData(prev => ({
        ...prev,
        position_id: prev.position_id || (posList[0] ? posList[0].id : ''),
        client_id: prev.client_id || (cliList[0] ? cliList[0].id : ''),
        recruiter_id: prev.recruiter_id || (recList[0] ? recList[0].id : '')
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name === 'position_id') {
      const pos = positions.find(p => p.id === value);
      if (pos && pos.client_id) {
        setFormData(prev => ({ ...prev, position_id: value, client_id: pos.client_id }));
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseInt(value, 10) || 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mis_date || !formData.recruiter_id || !formData.position_id || !formData.client_id) {
      showToast('Please select Date, Recruiter, Position, and Client', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await misApi.saveOperationalEntry(formData);
      showToast(`Daily MIS operational entry saved for ${formData.mis_date}`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast('Failed to save operational entry: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--brand-primary)" />
            <h2 className="modal-title">Log Daily MIS Operational Metrics</h2>
          </div>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">MIS Date *</label>
                <input
                  type="date"
                  name="mis_date"
                  className="form-control"
                  value={formData.mis_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Recruiter *</label>
                <select
                  name="recruiter_id"
                  className="form-control"
                  value={formData.recruiter_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Recruiter</option>
                  {recruiters.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Position Opening *</label>
                <select
                  name="position_id"
                  className="form-control"
                  value={formData.position_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Position</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Client Account *</label>
                <select
                  name="client_id"
                  className="form-control"
                  value={formData.client_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              Operational Numbers for Today
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Sourced</label>
                <input type="number" name="sourced" className="form-control" min="0" value={formData.sourced} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Contacted</label>
                <input type="number" name="contacted" className="form-control" min="0" value={formData.contacted} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Connected</label>
                <input type="number" name="connected" className="form-control" min="0" value={formData.connected} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Interested</label>
                <input type="number" name="interested" className="form-control" min="0" value={formData.interested} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Not Interested</label>
                <input type="number" name="not_interested" className="form-control" min="0" value={formData.not_interested} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up</label>
                <input type="number" name="follow_up" className="form-control" min="0" value={formData.follow_up} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Interview Sched.</label>
                <input type="number" name="interview_scheduled" className="form-control" min="0" value={formData.interview_scheduled} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Interview Comp.</label>
                <input type="number" name="interview_completed" className="form-control" min="0" value={formData.interview_completed} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Selected</label>
                <input type="number" name="selected" className="form-control" min="0" value={formData.selected} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Joined</label>
                <input type="number" name="joined" className="form-control" min="0" value={formData.joined} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Dropped</label>
                <input type="number" name="dropped" className="form-control" min="0" value={formData.dropped} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Pending</label>
                <input type="number" name="pending" className="form-control" min="0" value={formData.pending} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Remarks / Daily Log Notes</label>
              <input
                type="text"
                name="remarks"
                className="form-control"
                placeholder="Key highlights or bottlenecks encountered today..."
                value={formData.remarks}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Operational Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
