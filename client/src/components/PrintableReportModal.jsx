import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import { misApi } from '../services/api';

export default function PrintableReportModal({ isOpen, onClose, snapshot, selectedDate }) {
  if (!isOpen || !snapshot) return null;

  const { metrics = {}, breakdown_positions = [], breakdown_recruiters = [], breakdown_clients = [] } = snapshot;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: '900px', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Executive Printable MIS Report</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Ready for Print-to-PDF / Paper Distribution</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ background: '#FFFFFF', color: '#0F172A', padding: '32px' }}>
          {/* Printable Report Header */}
          <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                DAILY MIS EXECUTIVE REPORT
              </h1>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                Talent Operations & Recruitment Management Information System
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <div><strong>MIS Date:</strong> {selectedDate}</div>
              <div><strong>Snapshot Status:</strong> {snapshot.status} (v{snapshot.version})</div>
              <div><strong>Generated:</strong> {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
              I. Executive Metrics Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              <div style={{ border: '1px solid #CBD5E1', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>SOURCED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{metrics.sourced || 0}</div>
              </div>
              <div style={{ border: '1px solid #CBD5E1', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>CONTACTED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{metrics.contacted || 0}</div>
              </div>
              <div style={{ border: '1px solid #CBD5E1', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>INTERVIEWS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{(metrics.interview_scheduled || 0) + (metrics.interview_completed || 0)}</div>
              </div>
              <div style={{ border: '1px solid #CBD5E1', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>SELECTED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{metrics.selected || 0}</div>
              </div>
              <div style={{ border: '1px solid #CBD5E1', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>JOINED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>{metrics.joined || 0}</div>
              </div>
            </div>
          </div>

          {/* Position Breakdown */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              II. Position-wise Performance
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Position Title</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Sourced</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Interviews</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Selected</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {breakdown_positions.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{p.title}</td>
                    <td style={{ padding: '8px' }}>{p.client_name}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{p.sourced}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{p.interview_scheduled}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{p.selected}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800 }}>{p.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recruiter Breakdown */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              III. Recruiter Throughput
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Recruiter</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Department</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Target</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Sourced</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Selected</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {breakdown_recruiters.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{r.recruiter_name}</td>
                    <td style={{ padding: '8px' }}>{r.department}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{r.target_monthly} / mo</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{r.sourced}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{r.selected}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800 }}>{r.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signoff Footer */}
          <div style={{ marginTop: '36px', borderTop: '1px dashed #94A3B8', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B' }}>
            <div>Report verified against Daily MIS database</div>
            <div>Authorized Operations Lead Sign-off: _____________________</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
