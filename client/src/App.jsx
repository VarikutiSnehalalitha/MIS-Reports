import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader, { BENCHMARK_DATE } from './components/TopHeader';
import MISDashboardView from './components/MISDashboardView';
import HistoricalCalendarView from './components/HistoricalCalendarView';
import DateComparisonView from './components/DateComparisonView';
import RangeReportsView from './components/RangeReportsView';
import CandidateDatabaseView from './components/CandidateDatabaseView';
import ActivityTrackingView from './components/ActivityTrackingView';
import PositionsView from './components/PositionsView';
import ClientsView from './components/ClientsView';
import RecruitersView from './components/RecruitersView';
import AuditLogView from './components/AuditLogView';
import AddCandidateModal from './components/AddCandidateModal';
import DailyEntryModal from './components/DailyEntryModal';
import CandidateDetailDrawer from './components/CandidateDetailDrawer';
import PrintableReportModal from './components/PrintableReportModal';
import { misApi } from './services/api';

export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState('2026-10-08'); // Default to benchmark date to highlight historical snapshot immediately
  const [snapshot, setSnapshot] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    id: 'usr-admin-1',
    name: 'Aditya Sharma',
    email: 'aditya.sharma@talentmis.com',
    role: 'Admin',
    avatar: 'AS'
  });

  // Range reports params
  const [reportStart, setReportStart] = useState('2026-10-01');
  const [reportEnd, setReportEnd] = useState('2026-10-08');

  // Modals & Drawers
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isDailyEntryOpen, setIsDailyEntryOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // Toast System
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    loadSnapshotForDate(selectedDate);
  }, [selectedDate]);

  const loadSnapshotForDate = async (date) => {
    try {
      const res = await misApi.getHistoricalMIS(date);
      setSnapshot(res.data);
    } catch (err) {
      showToast('Error loading snapshot for ' + date + ': ' + err.message, 'error');
    }
  };

  const handleFreezeSnapshot = async (date) => {
    if (snapshot && snapshot.status === 'Locked') {
      showToast(`Snapshot for ${date} is LOCKED and immutable. Historical snapshots cannot be altered.`, 'error');
      return;
    }

    try {
      const res = await misApi.freezeSnapshot(date, {
        notes: `Operational MIS snapshot frozen by ${currentUser.name} on ${new Date().toLocaleDateString()}`,
        status: 'Finalized'
      });
      setSnapshot(res.data);
      showToast(`Daily MIS snapshot frozen permanently for ${date}!`, 'success');
    } catch (err) {
      showToast('Failed to freeze snapshot: ' + err.message, 'error');
    }
  };

  const handleCalendarSelectDate = (date) => {
    setSelectedDate(date);
    setActiveNav('dashboard');
    showToast(`Loaded historical snapshot for ${date}`, 'info');
  };

  const handleNavigateToReports = (start, end) => {
    setReportStart(start);
    setReportEnd(end);
    setActiveNav('reports');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />

      {/* Main Container */}
      <main className="app-main">
        {/* Top Header */}
        <TopHeader
          activeNav={activeNav}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          snapshot={snapshot}
          onFreezeSnapshot={handleFreezeSnapshot}
          onOpenDailyEntry={() => setIsDailyEntryOpen(true)}
          onOpenAddCandidate={() => setIsAddCandidateOpen(true)}
          onOpenPrintModal={() => setIsPrintModalOpen(true)}
          showToast={showToast}
        />

        {/* View Router */}
        <div className="content-body">
          {activeNav === 'dashboard' && (
            <MISDashboardView
              snapshot={snapshot}
              selectedDate={selectedDate}
              onFreezeSnapshot={handleFreezeSnapshot}
              onSelectCandidate={(id) => setSelectedCandidateId(id)}
              onOpenDailyEntry={() => setIsDailyEntryOpen(true)}
            />
          )}

          {activeNav === 'calendar' && (
            <HistoricalCalendarView
              onSelectDate={handleCalendarSelectDate}
              onNavigateToReports={handleNavigateToReports}
              showToast={showToast}
            />
          )}

          {activeNav === 'compare' && (
            <DateComparisonView showToast={showToast} />
          )}

          {activeNav === 'reports' && (
            <RangeReportsView
              initialStart={reportStart}
              initialEnd={reportEnd}
              onOpenPrintModal={() => setIsPrintModalOpen(true)}
              showToast={showToast}
            />
          )}

          {activeNav === 'candidates' && (
            <CandidateDatabaseView
              onSelectCandidate={(id) => setSelectedCandidateId(id)}
              onOpenAddCandidate={() => setIsAddCandidateOpen(true)}
              showToast={showToast}
            />
          )}

          {activeNav === 'interviews' && (
            <ActivityTrackingView
              mode="interviews"
              onSelectCandidate={(id) => setSelectedCandidateId(id)}
              showToast={showToast}
            />
          )}

          {activeNav === 'followups' && (
            <ActivityTrackingView
              mode="followups"
              onSelectCandidate={(id) => setSelectedCandidateId(id)}
              showToast={showToast}
            />
          )}

          {activeNav === 'submissions' && (
            <ActivityTrackingView
              mode="submissions"
              onSelectCandidate={(id) => setSelectedCandidateId(id)}
              showToast={showToast}
            />
          )}

          {activeNav === 'positions' && (
            <PositionsView showToast={showToast} />
          )}

          {activeNav === 'clients' && (
            <ClientsView showToast={showToast} />
          )}

          {activeNav === 'recruiters' && (
            <RecruitersView showToast={showToast} />
          )}

          {activeNav === 'audit' && (
            <AuditLogView showToast={showToast} />
          )}
        </div>
      </main>

      {/* Modals & Slide-over Drawers */}
      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        onSuccess={() => {
          loadSnapshotForDate(selectedDate);
        }}
        showToast={showToast}
        defaultDate={selectedDate}
      />

      <DailyEntryModal
        isOpen={isDailyEntryOpen}
        onClose={() => setIsDailyEntryOpen(false)}
        onSuccess={() => {
          loadSnapshotForDate(selectedDate);
        }}
        showToast={showToast}
        defaultDate={selectedDate}
      />

      <CandidateDetailDrawer
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
        onUpdated={() => {
          loadSnapshotForDate(selectedDate);
        }}
        showToast={showToast}
      />

      <PrintableReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        snapshot={snapshot}
        selectedDate={selectedDate}
      />

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
