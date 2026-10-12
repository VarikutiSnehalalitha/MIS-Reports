import React, { useState } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  Download,
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { misApi } from '../services/api';

export const BENCHMARK_DATE = '2026-10-08';

export default function TopHeader({
  activeNav,
  selectedDate,
  setSelectedDate,
  snapshot,
  onFreezeSnapshot,
  onOpenDailyEntry,
  onOpenAddCandidate,
  onOpenPrintModal,
  showToast
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const getPageTitle = () => {
    switch (activeNav) {
      case 'dashboard':
        return {
          title: `Daily MIS Dashboard (${selectedDate})`,
          sub: 'Operational metrics, recruitment funnel, and point-in-time point aggregates'
        };
      case 'calendar':
        return {
          title: 'Historical MIS Calendar',
          sub: 'Permanent historical records across any date. Select any date to see exact snapshot.'
        };
      case 'compare':
        return {
          title: 'Date-to-Date MIS Comparison',
          sub: 'Compare metric deltas, candidate movement, and recruiter throughput between any two dates'
        };
      case 'reports':
        return {
          title: 'Weekly & Monthly MIS Reports',
          sub: 'Consolidated range aggregations for executive reviews and management auditing'
        };
      case 'candidates':
        return {
          title: 'Candidate Database & Pipeline',
          sub: 'Comprehensive talent pool with compensation, status stages, and touchpoints'
        };
      case 'interviews':
        return {
          title: 'Interview Tracking & Schedules',
          sub: 'Upcoming and completed interview evaluations with recruiter and SPOC feedback'
        };
      case 'followups':
        return {
          title: 'Pending Follow-ups & Reminders',
          sub: 'Candidates requiring outreach, CTC negotiations, or notice period check-ins'
        };
      case 'submissions':
        return {
          title: 'Client Submissions & Feedback',
          sub: 'Profiles presented to corporate clients and stage-gate feedback statuses'
        };
      case 'positions':
        return {
          title: 'Positions & Job Openings',
          sub: 'Active requisitions, budget CTC brackets, and fulfillment metrics'
        };
      case 'clients':
        return {
          title: 'Client Directory & Accounts',
          sub: 'Corporate client accounts, SPOC contact information, and open positions'
        };
      case 'recruiters':
        return {
          title: 'Recruiter Performance & Targets',
          sub: 'Monthly targets, candidate sourcing throughput, and conversion efficiency'
        };
      case 'audit':
        return {
          title: 'System Audit & Change Trail',
          sub: 'Immutable audit logs detailing who changed what, timestamps, and data diffs'
        };
      default:
        return { title: 'Daily MIS Management System', sub: 'Historical Operations Engine' };
    }
  };

  const { title, sub } = getPageTitle();

  const handleExportExcel = () => {
    window.open(misApi.getExcelExportUrl(selectedDate), '_blank');
    showToast(`Downloading Excel snapshot for ${selectedDate}`, 'success');
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    window.open(misApi.getCSVExportUrl(selectedDate), '_blank');
    showToast(`Downloading CSV candidate data for ${selectedDate}`, 'success');
    setShowExportMenu(false);
  };

  const handleAllCandidatesCSV = () => {
    window.open(misApi.getAllCandidatesCSVUrl(), '_blank');
    showToast('Downloading all candidates master CSV', 'success');
    setShowExportMenu(false);
  };

  const isFrozen = snapshot && snapshot.is_frozen;
  const isLocked = snapshot && snapshot.status === 'Locked';

  return (
    <header className="app-header">
      {/* Title & Sub */}
      <div className="header-left">
        <div className="header-title-box">
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="header-right">
        {/* Quick Date Selector */}
        <div className="date-selector-container">
          <span className="date-selector-label">
            <Calendar size={14} /> Date:
          </span>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          {selectedDate !== BENCHMARK_DATE && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '0.7rem' }}
              onClick={() => setSelectedDate(BENCHMARK_DATE)}
              title="Jump to October 8, 2026 historical benchmark snapshot"
            >
              Jump to 08 Oct
            </button>
          )}
        </div>

        {/* Snapshot Status & Freeze Button */}
        {activeNav === 'dashboard' && (
          <button
            className={`btn ${isLocked ? 'btn-success' : isFrozen ? 'btn-outline-brand' : 'btn-secondary'} btn-sm`}
            onClick={() => onFreezeSnapshot(selectedDate)}
            title={isLocked ? 'Immutable locked historical snapshot' : 'Freeze/Finalize daily snapshot'}
          >
            {isLocked ? <Lock size={14} /> : isFrozen ? <Lock size={14} /> : <Unlock size={14} />}
            <span>{isLocked ? 'Locked (v' + (snapshot.version || 1) + ')' : isFrozen ? 'Frozen (v' + (snapshot.version || 1) + ')' : 'Freeze Today'}</span>
          </button>
        )}

        {/* Export Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            <Download size={14} />
            <span>Export</span>
            <ChevronDown size={13} />
          </button>

          {showExportMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: 'var(--bg-modal)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)',
                width: '230px',
                zIndex: 50,
                overflow: 'hidden'
              }}
            >
              <button
                className="nav-item"
                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 0 }}
                onClick={handleExportExcel}
              >
                <FileSpreadsheet size={15} color="#10B981" />
                <span>Download Excel (.xlsx)</span>
              </button>
              <button
                className="nav-item"
                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 0 }}
                onClick={handleExportCSV}
              >
                <FileText size={15} color="#0EA5E9" />
                <span>Export Date CSV</span>
              </button>
              <button
                className="nav-item"
                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 0 }}
                onClick={handleAllCandidatesCSV}
              >
                <FileText size={15} color="#8B5CF6" />
                <span>Export All Candidates CSV</span>
              </button>
              <button
                className="nav-item"
                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 0, borderTop: '1px solid var(--border-subtle)' }}
                onClick={() => {
                  setShowExportMenu(false);
                  onOpenPrintModal();
                }}
              >
                <Printer size={15} color="#F59E0B" />
                <span>Print / Save PDF Report</span>
              </button>
            </div>
          )}
        </div>

        {/* Operational Entry Button */}
        <button className="btn btn-secondary btn-sm" onClick={onOpenDailyEntry}>
          <Sparkles size={14} />
          <span>Daily Entry</span>
        </button>

        {/* Add Candidate Button */}
        <button className="btn btn-primary btn-sm" onClick={onOpenAddCandidate}>
          <Plus size={14} />
          <span>+ Candidate</span>
        </button>
      </div>
    </header>
  );
}
