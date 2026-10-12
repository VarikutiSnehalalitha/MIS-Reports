import React, { useState, useEffect } from 'react';
import { X, UserPlus, Sparkles } from 'lucide-react';
import { misApi } from '../services/api';

const STATUS_OPTIONS = [
  'Sourced', 'Contacted', 'Connected', 'Interested', 'Not Interested',
  'Follow-up', 'Interview Scheduled', 'Interview Completed',
  'Selected', 'Rejected', 'Joined', 'Dropped', 'Pending'
];

export default function AddCandidateModal({ isOpen, onClose, onSuccess, showToast, defaultDate }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    position_id: '',
    client_id: '',
    recruiter_id: '',
    location: 'Bangalore',
    source: 'LinkedIn',
    current_ctc: '',
    expected_ctc: '',
    notice_period: '30 Days',
    experience: '',
    status: 'Sourced',
    interview_date: '',
    feedback: '',
    remarks: '',
    created_date: defaultDate || new Date().toISOString().split('T')[0]
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
      showToast('Error loading master data: ' + err.message, 'error');
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-sync client when position is selected
    if (name === 'position_id') {
      const selectedPos = positions.find(p => p.id === value);
      if (selectedPos && selectedPos.client_id) {
        setFormData(prev => ({ ...prev, position_id: value, client_id: selectedPos.client_id }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || !formData.position_id || !formData.client_id || !formData.recruiter_id) {
      showToast('Please fill all mandatory fields (Name, Phone, Email, Position, Client, Recruiter)', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await misApi.createCandidate({
        ...formData,
        current_ctc: parseFloat(formData.current_ctc) || 0,
        expected_ctc: parseFloat(formData.expected_ctc) || 0,
        experience: parseFloat(formData.experience) || 0
      });
      showToast(`Candidate ${formData.name} successfully added to pipeline`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast('Failed to add candidate: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={20} color="var(--brand-primary)" />
            <h2 className="modal-title">Add Candidate to Daily MIS Pipeline</h2>
          </div>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-grid">
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="e.g. Vikramaditya Rao"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  placeholder="e.g. +91 98450 12345"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="e.g. vikram@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label">Candidate Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  placeholder="e.g. Bangalore / Hybrid"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              {/* Position */}
              <div className="form-group">
                <label className="form-label">Position / Opening *</label>
                <select
                  name="position_id"
                  className="form-control"
                  value={formData.position_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Position</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.client_name})</option>
                  ))}
                </select>
              </div>

              {/* Client */}
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

              {/* Recruiter */}
              <div className="form-group">
                <label className="form-label">Assigned Recruiter *</label>
                <select
                  name="recruiter_id"
                  className="form-control"
                  value={formData.recruiter_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Recruiter</option>
                  {recruiters.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.department})</option>
                  ))}
                </select>
              </div>

              {/* Sourcing Source */}
              <div className="form-group">
                <label className="form-label">Sourcing Channel</label>
                <select
                  name="source"
                  className="form-control"
                  value={formData.source}
                  onChange={handleChange}
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Naukri">Naukri</option>
                  <option value="Referral">Employee Referral</option>
                  <option value="Direct">Direct / Career Portal</option>
                  <option value="IIM / Campus">Campus / Alumni</option>
                  <option value="Headhunting">Headhunting</option>
                </select>
              </div>

              {/* Experience */}
              <div className="form-group">
                <label className="form-label">Total Experience (Years)</label>
                <input
                  type="number"
                  step="0.1"
                  name="experience"
                  className="form-control"
                  placeholder="e.g. 5.5"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>

              {/* Notice Period */}
              <div className="form-group">
                <label className="form-label">Notice Period</label>
                <select
                  name="notice_period"
                  className="form-control"
                  value={formData.notice_period}
                  onChange={handleChange}
                >
                  <option value="Immediate">Immediate Joiner</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="45 Days">45 Days</option>
                  <option value="60 Days">60 Days</option>
                  <option value="90 Days">90 Days</option>
                </select>
              </div>

              {/* Current CTC */}
              <div className="form-group">
                <label className="form-label">Current CTC (LPA)</label>
                <input
                  type="number"
                  step="0.1"
                  name="current_ctc"
                  className="form-control"
                  placeholder="e.g. 18.0"
                  value={formData.current_ctc}
                  onChange={handleChange}
                />
              </div>

              {/* Expected CTC */}
              <div className="form-group">
                <label className="form-label">Expected CTC (LPA)</label>
                <input
                  type="number"
                  step="0.1"
                  name="expected_ctc"
                  className="form-control"
                  placeholder="e.g. 26.0"
                  value={formData.expected_ctc}
                  onChange={handleChange}
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">Initial Pipeline Status *</label>
                <select
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Date Created/Sourced */}
              <div className="form-group">
                <label className="form-label">MIS Sourced Date</label>
                <input
                  type="date"
                  name="created_date"
                  className="form-control"
                  value={formData.created_date}
                  onChange={handleChange}
                />
              </div>

              {/* Interview Date if applicable */}
              {formData.status.includes('Interview') && (
                <div className="form-group full-width">
                  <label className="form-label">Interview Date & Time</label>
                  <input
                    type="datetime-local"
                    name="interview_date"
                    className="form-control"
                    value={formData.interview_date}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Feedback / Evaluation */}
              <div className="form-group full-width">
                <label className="form-label">Client / Recruiter Feedback</label>
                <textarea
                  name="feedback"
                  className="form-control"
                  placeholder="Enter preliminary screening notes or client feedback..."
                  value={formData.feedback}
                  onChange={handleChange}
                />
              </div>

              {/* Remarks */}
              <div className="form-group full-width">
                <label className="form-label">Internal Remarks & Notes</label>
                <input
                  type="text"
                  name="remarks"
                  className="form-control"
                  placeholder="e.g. Candidate open to relocation, offers in hand..."
                  value={formData.remarks}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Sparkles size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
              <span>{submitting ? 'Saving...' : 'Add Candidate Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
