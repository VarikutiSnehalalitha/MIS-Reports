const XLSX = require('xlsx');

class ExportService {
  /**
   * Export candidate list to CSV string
   */
  static candidatesToCSV(candidates) {
    const headers = [
      'ID', 'Name', 'Phone', 'Email', 'Position', 'Client', 'Recruiter',
      'Location', 'Source', 'Current CTC', 'Expected CTC', 'Notice Period',
      'Experience (Yrs)', 'Status', 'Interview Date', 'Feedback', 'Remarks', 'Created Date'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = candidates.map(c => [
      c.id,
      c.name,
      c.phone,
      c.email,
      c.position_title || c.position || '',
      c.client_name || c.client || '',
      c.recruiter_name || c.recruiter || '',
      c.location || '',
      c.source || '',
      c.current_ctc || 0,
      c.expected_ctc || 0,
      c.notice_period || '',
      c.experience || 0,
      c.status || '',
      c.interview_date || '',
      c.feedback || '',
      c.remarks || '',
      c.created_date || ''
    ].map(escapeCsv).join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }

  /**
   * Export MIS Snapshot to Excel (.xlsx buffer) with multiple sheets:
   * 1. Overview & Metrics
   * 2. Position Breakdown
   * 3. Recruiter Breakdown
   * 4. Client Breakdown
   * 5. Candidate Pipeline
   */
  static snapshotToExcel(snapshot) {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Metrics Overview
    const metricsData = [
      ['DAILY MIS MANAGEMENT SYSTEM - HISTORICAL REPORT'],
      ['MIS Date', snapshot.mis_date],
      ['Snapshot Status', snapshot.status],
      ['Version', `v${snapshot.version}`],
      ['Generated / Frozen At', snapshot.created_at],
      ['Notes', snapshot.notes || ''],
      [],
      ['METRIC', 'COUNT', 'DESCRIPTION'],
      ['Sourced', snapshot.metrics.sourced || 0, 'Profiles identified and entered into pipeline'],
      ['Contacted', snapshot.metrics.contacted || 0, 'Outreach attempted via phone/email'],
      ['Connected', snapshot.metrics.connected || 0, 'Candidates reached and engaged'],
      ['Interested', snapshot.metrics.interested || 0, 'Candidates interested in position'],
      ['Not Interested', snapshot.metrics.not_interested || 0, 'Candidates declined or not interested'],
      ['Follow-up', snapshot.metrics.follow_up || 0, 'Profiles requiring recruiter follow-up'],
      ['Interview Scheduled', snapshot.metrics.interview_scheduled || 0, 'Interviews confirmed on calendar'],
      ['Interview Completed', snapshot.metrics.interview_completed || 0, 'Interviews attended by candidate'],
      ['Selected', snapshot.metrics.selected || 0, 'Candidates offered or cleared final round'],
      ['Rejected', snapshot.metrics.rejected || 0, 'Candidates rejected by client/evaluator'],
      ['Joined', snapshot.metrics.joined || 0, 'Candidates onboarded / joined successfully'],
      ['Dropped', snapshot.metrics.dropped || 0, 'Candidates backed out / offer declined'],
      ['Pending', snapshot.metrics.pending || 0, 'Awaiting client or candidate decision'],
      ['Total Submissions', snapshot.metrics.total_submissions || 0, 'Candidate profiles submitted to clients']
    ];
    const wsMetrics = XLSX.utils.aoa_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, wsMetrics, 'Overview & Metrics');

    // Sheet 2: Position Breakdown
    const positionRows = (snapshot.breakdown_positions || []).map(p => ({
      'Position Title': p.title,
      'Client': p.client_name,
      'Openings': p.openings_count,
      'Budget CTC': p.budget_ctc,
      'Sourced': p.sourced || 0,
      'Contacted': p.contacted || 0,
      'Connected': p.connected || 0,
      'Interested': p.interested || 0,
      'Interviews': p.interview_scheduled || 0,
      'Selected': p.selected || 0,
      'Joined': p.joined || 0,
      'Pending': p.pending || 0
    }));
    const wsPositions = XLSX.utils.json_to_sheet(positionRows.length > 0 ? positionRows : [{ Note: 'No position records' }]);
    XLSX.utils.book_append_sheet(wb, wsPositions, 'Position-wise MIS');

    // Sheet 3: Recruiter Breakdown
    const recruiterRows = (snapshot.breakdown_recruiters || []).map(r => ({
      'Recruiter Name': r.recruiter_name,
      'Department': r.department,
      'Monthly Target': r.target_monthly,
      'Sourced': r.sourced || 0,
      'Contacted': r.contacted || 0,
      'Connected': r.connected || 0,
      'Interested': r.interested || 0,
      'Interviews Scheduled': r.interview_scheduled || 0,
      'Selected': r.selected || 0,
      'Joined': r.joined || 0,
      'Pending': r.pending || 0
    }));
    const wsRecruiters = XLSX.utils.json_to_sheet(recruiterRows.length > 0 ? recruiterRows : [{ Note: 'No recruiter records' }]);
    XLSX.utils.book_append_sheet(wb, wsRecruiters, 'Recruiter-wise MIS');

    // Sheet 4: Client Breakdown
    const clientRows = (snapshot.breakdown_clients || []).map(c => ({
      'Client Name': c.client_name,
      'Industry': c.industry,
      'Active Positions': c.active_positions || 0,
      'Sourced': c.sourced || 0,
      'Interviews': c.interview_scheduled || 0,
      'Selected': c.selected || 0,
      'Joined': c.joined || 0
    }));
    const wsClients = XLSX.utils.json_to_sheet(clientRows.length > 0 ? clientRows : [{ Note: 'No client records' }]);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Client-wise MIS');

    // Sheet 5: Candidates
    const candRows = (snapshot.candidates || []).map(c => ({
      'Candidate Name': c.name,
      'Phone': c.phone,
      'Email': c.email,
      'Position': c.position_title || c.position || '',
      'Client': c.client_name || c.client || '',
      'Recruiter': c.recruiter_name || c.recruiter || '',
      'Location': c.location || '',
      'Source': c.source || '',
      'Current CTC (LPA)': c.current_ctc || 0,
      'Expected CTC (LPA)': c.expected_ctc || 0,
      'Notice Period': c.notice_period || '',
      'Experience (Yrs)': c.experience || 0,
      'Status': c.status || '',
      'Interview Date': c.interview_date || '',
      'Feedback': c.feedback || '',
      'Remarks': c.remarks || '',
      'Created Date': c.created_date || ''
    }));
    const wsCands = XLSX.utils.json_to_sheet(candRows.length > 0 ? candRows : [{ Note: 'No candidate records' }]);
    XLSX.utils.book_append_sheet(wb, wsCands, 'Candidate Database');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Export Comparison Report to Excel (.xlsx buffer)
   */
  static comparisonToExcel(comp) {
    const wb = XLSX.utils.book_new();

    const overviewData = [
      ['DAILY MIS COMPARISON REPORT'],
      ['Date 1 (Baseline)', comp.date1],
      ['Date 2 (Target)', comp.date2],
      [],
      ['METRIC', `${comp.date1} COUNT`, `${comp.date2} COUNT`, 'DELTA (CHANGE)', '% CHANGE']
    ];

    Object.entries(comp.metrics_diff).forEach(([key, val]) => {
      overviewData.push([
        key.replace(/_/g, ' ').toUpperCase(),
        val.date1_val,
        val.date2_val,
        val.change > 0 ? `+${val.change}` : val.change,
        `${val.percent}%`
      ]);
    });

    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Metric Comparison');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = ExportService;
