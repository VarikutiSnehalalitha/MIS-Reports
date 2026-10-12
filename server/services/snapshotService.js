const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

class SnapshotService {
  /**
   * Calculate aggregated metrics from an array of operational daily entries or candidates
   */
  static emptyMetrics() {
    return {
      sourced: 0,
      contacted: 0,
      connected: 0,
      interested: 0,
      not_interested: 0,
      follow_up: 0,
      interview_scheduled: 0,
      interview_completed: 0,
      selected: 0,
      rejected: 0,
      joined: 0,
      dropped: 0,
      pending: 0,
      total_submissions: 0
    };
  }

  /**
   * Aggregates metrics from daily_mis_entries or compiles directly from candidates table
   */
  static compileMetricsForDate(date) {
    const metrics = this.emptyMetrics();

    // 1. Check daily_mis_entries for this date
    const entries = db.prepare(`
      SELECT 
        SUM(sourced) as sourced,
        SUM(contacted) as contacted,
        SUM(connected) as connected,
        SUM(interested) as interested,
        SUM(not_interested) as not_interested,
        SUM(follow_up) as follow_up,
        SUM(interview_scheduled) as interview_scheduled,
        SUM(interview_completed) as interview_completed,
        SUM(selected) as selected,
        SUM(rejected) as rejected,
        SUM(joined) as joined,
        SUM(dropped) as dropped,
        SUM(pending) as pending
      FROM daily_mis_entries
      WHERE mis_date = ?
    `).get(date);

    // 2. Also check candidates created on this date or activities on this date
    const candidateStatusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM candidates 
      WHERE created_date = ?
      GROUP BY status
    `).all(date);

    // If entries exist, use them as base, otherwise derive from candidate table
    if (entries && entries.sourced !== null) {
      Object.keys(metrics).forEach(k => {
        if (entries[k] !== undefined && entries[k] !== null) {
          metrics[k] = Number(entries[k]);
        }
      });
    } else {
      // Derive from candidate records for that date
      candidateStatusCounts.forEach(row => {
        const key = row.status.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (metrics[key] !== undefined) {
          metrics[key] += row.count;
        }
        metrics.sourced += row.count;
      });
      // Fallback connected/contacted if sourced
      if (metrics.sourced > 0 && metrics.contacted === 0) {
        metrics.contacted = metrics.sourced;
        metrics.connected = Math.round(metrics.sourced * 0.85);
      }
    }

    metrics.total_submissions = (metrics.interested || 0) + (metrics.interview_scheduled || 0) + (metrics.interview_completed || 0);

    return metrics;
  }

  /**
   * Compile breakdown by Position for a given date
   */
  static compilePositionBreakdown(date) {
    const rows = db.prepare(`
      SELECT 
        p.id as position_id,
        p.title,
        p.openings_count,
        p.budget_ctc,
        c.name as client_name,
        COALESCE(SUM(d.sourced), 0) as sourced,
        COALESCE(SUM(d.contacted), 0) as contacted,
        COALESCE(SUM(d.connected), 0) as connected,
        COALESCE(SUM(d.interested), 0) as interested,
        COALESCE(SUM(d.interview_scheduled), 0) as interview_scheduled,
        COALESCE(SUM(d.selected), 0) as selected,
        COALESCE(SUM(d.joined), 0) as joined,
        COALESCE(SUM(d.pending), 0) as pending
      FROM positions p
      JOIN clients c ON p.client_id = c.id
      LEFT JOIN daily_mis_entries d ON d.position_id = p.id AND d.mis_date = ?
      GROUP BY p.id
      ORDER BY sourced DESC, p.title ASC
    `).all(date);

    // If no daily entries, fallback to candidate aggregates
    if (rows.every(r => r.sourced === 0)) {
      return db.prepare(`
        SELECT 
          p.id as position_id,
          p.title,
          p.openings_count,
          p.budget_ctc,
          c.name as client_name,
          COUNT(cand.id) as sourced,
          SUM(CASE WHEN cand.status IN ('Contacted', 'Connected', 'Interested', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Joined') THEN 1 ELSE 0 END) as contacted,
          SUM(CASE WHEN cand.status IN ('Connected', 'Interested', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Joined') THEN 1 ELSE 0 END) as connected,
          SUM(CASE WHEN cand.status IN ('Interested', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Joined') THEN 1 ELSE 0 END) as interested,
          SUM(CASE WHEN cand.status IN ('Interview Scheduled', 'Interview Completed') THEN 1 ELSE 0 END) as interview_scheduled,
          SUM(CASE WHEN cand.status = 'Selected' THEN 1 ELSE 0 END) as selected,
          SUM(CASE WHEN cand.status = 'Joined' THEN 1 ELSE 0 END) as joined,
          SUM(CASE WHEN cand.status = 'Pending' THEN 1 ELSE 0 END) as pending
        FROM positions p
        JOIN clients c ON p.client_id = c.id
        LEFT JOIN candidates cand ON cand.position_id = p.id AND cand.created_date <= ?
        GROUP BY p.id
        ORDER BY sourced DESC, p.title ASC
      `).all(date);
    }
    return rows;
  }

  /**
   * Compile breakdown by Client for a given date
   */
  static compileClientBreakdown(date) {
    const rows = db.prepare(`
      SELECT 
        c.id as client_id,
        c.name as client_name,
        c.industry,
        COUNT(DISTINCT p.id) as active_positions,
        COALESCE(SUM(d.sourced), 0) as sourced,
        COALESCE(SUM(d.interview_scheduled), 0) as interview_scheduled,
        COALESCE(SUM(d.selected), 0) as selected,
        COALESCE(SUM(d.joined), 0) as joined
      FROM clients c
      LEFT JOIN positions p ON p.client_id = c.id AND p.status = 'Open'
      LEFT JOIN daily_mis_entries d ON d.client_id = c.id AND d.mis_date = ?
      GROUP BY c.id
      ORDER BY sourced DESC, c.name ASC
    `).all(date);

    if (rows.every(r => r.sourced === 0)) {
      return db.prepare(`
        SELECT 
          c.id as client_id,
          c.name as client_name,
          c.industry,
          COUNT(DISTINCT p.id) as active_positions,
          COUNT(cand.id) as sourced,
          SUM(CASE WHEN cand.status IN ('Interview Scheduled', 'Interview Completed') THEN 1 ELSE 0 END) as interview_scheduled,
          SUM(CASE WHEN cand.status = 'Selected' THEN 1 ELSE 0 END) as selected,
          SUM(CASE WHEN cand.status = 'Joined' THEN 1 ELSE 0 END) as joined
        FROM clients c
        LEFT JOIN positions p ON p.client_id = c.id AND p.status = 'Open'
        LEFT JOIN candidates cand ON cand.client_id = c.id AND cand.created_date <= ?
        GROUP BY c.id
        ORDER BY sourced DESC, c.name ASC
      `).all(date);
    }
    return rows;
  }

  /**
   * Compile breakdown by Recruiter for a given date
   */
  static compileRecruiterBreakdown(date) {
    const rows = db.prepare(`
      SELECT 
        r.id as recruiter_id,
        r.name as recruiter_name,
        r.department,
        r.target_monthly,
        COALESCE(SUM(d.sourced), 0) as sourced,
        COALESCE(SUM(d.contacted), 0) as contacted,
        COALESCE(SUM(d.connected), 0) as connected,
        COALESCE(SUM(d.interested), 0) as interested,
        COALESCE(SUM(d.interview_scheduled), 0) as interview_scheduled,
        COALESCE(SUM(d.interview_completed), 0) as interview_completed,
        COALESCE(SUM(d.selected), 0) as selected,
        COALESCE(SUM(d.joined), 0) as joined,
        COALESCE(SUM(d.pending), 0) as pending
      FROM recruiters r
      LEFT JOIN daily_mis_entries d ON d.recruiter_id = r.id AND d.mis_date = ?
      GROUP BY r.id
      ORDER BY sourced DESC, r.name ASC
    `).all(date);

    if (rows.every(r => r.sourced === 0)) {
      return db.prepare(`
        SELECT 
          r.id as recruiter_id,
          r.name as recruiter_name,
          r.department,
          r.target_monthly,
          COUNT(cand.id) as sourced,
          SUM(CASE WHEN cand.status IN ('Contacted', 'Connected', 'Interested', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Joined') THEN 1 ELSE 0 END) as contacted,
          SUM(CASE WHEN cand.status IN ('Connected', 'Interested', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Joined') THEN 1 ELSE 0 END) as connected,
          SUM(CASE WHEN cand.status IN ('Interested', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Joined') THEN 1 ELSE 0 END) as interested,
          SUM(CASE WHEN cand.status IN ('Interview Scheduled', 'Interview Completed') THEN 1 ELSE 0 END) as interview_scheduled,
          SUM(CASE WHEN cand.status = 'Interview Completed' THEN 1 ELSE 0 END) as interview_completed,
          SUM(CASE WHEN cand.status = 'Selected' THEN 1 ELSE 0 END) as selected,
          SUM(CASE WHEN cand.status = 'Joined' THEN 1 ELSE 0 END) as joined,
          SUM(CASE WHEN cand.status = 'Pending' THEN 1 ELSE 0 END) as pending
        FROM recruiters r
        LEFT JOIN candidates cand ON cand.recruiter_id = r.id AND cand.created_date <= ?
        GROUP BY r.id
        ORDER BY sourced DESC, r.name ASC
      `).all(date);
    }
    return rows;
  }

  /**
   * Compile candidate records present up to or on this date
   */
  static compileCandidatesForDate(date) {
    return db.prepare(`
      SELECT 
        cand.id,
        cand.name,
        cand.phone,
        cand.email,
        cand.location,
        cand.source,
        cand.current_ctc,
        cand.expected_ctc,
        cand.notice_period,
        cand.experience,
        cand.status,
        cand.interview_date,
        cand.feedback,
        cand.remarks,
        cand.created_date,
        cand.created_at,
        cand.updated_at,
        p.id as position_id,
        p.title as position_title,
        c.id as client_id,
        c.name as client_name,
        r.id as recruiter_id,
        r.name as recruiter_name
      FROM candidates cand
      JOIN positions p ON cand.position_id = p.id
      JOIN clients c ON cand.client_id = c.id
      JOIN recruiters r ON cand.recruiter_id = r.id
      WHERE cand.created_date <= ?
      ORDER BY cand.created_date DESC, cand.created_at DESC
    `).all(date);
  }

  /**
   * Freezes and stores an immutable daily MIS snapshot
   */
  static createOrFreezeSnapshot(date, options = {}) {
    const user = options.user || 'System';
    const notes = options.notes || `Daily MIS finalized for ${date}`;
    const status = options.status || 'Finalized';

    // Check if a snapshot already exists
    const existing = db.prepare(`
      SELECT * FROM daily_mis_snapshots
      WHERE mis_date = ?
      ORDER BY version DESC
      LIMIT 1
    `).get(date);

    if (existing && existing.status === 'Locked' && !options.allowOverride) {
      throw new Error(`Snapshot for date ${date} is LOCKED and immutable. Cannot overwrite historical records.`);
    }

    const version = existing ? existing.version + 1 : 1;
    const metrics = this.compileMetricsForDate(date);
    const positions = this.compilePositionBreakdown(date);
    const clients = this.compileClientBreakdown(date);
    const recruiters = this.compileRecruiterBreakdown(date);
    const candidates = this.compileCandidatesForDate(date);

    const snapshotId = uuidv4();

    const insertStmt = db.prepare(`
      INSERT INTO daily_mis_snapshots (
        id, mis_date, version, status, metrics_summary,
        breakdown_positions, breakdown_clients, breakdown_recruiters,
        candidate_snapshot_data, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertStmt.run(
      snapshotId,
      date,
      version,
      status,
      JSON.stringify(metrics),
      JSON.stringify(positions),
      JSON.stringify(clients),
      JSON.stringify(recruiters),
      JSON.stringify(candidates),
      notes,
      user
    );

    // Audit record
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, new_values, details)
      VALUES (?, 'SNAPSHOT_FREEZE', 'Snapshot', ?, ?, ?, ?)
    `).run(
      uuidv4(),
      snapshotId,
      user,
      JSON.stringify({ date, version, metrics }),
      `Permanent MIS snapshot frozen for ${date} (v${version})`
    );

    return this.getSnapshotByDate(date, version);
  }

  /**
   * Retrieve an exact snapshot for a date (or compile live preview if not frozen yet)
   */
  static getSnapshotByDate(date, version = null) {
    let query = `
      SELECT * FROM daily_mis_snapshots
      WHERE mis_date = ?
    `;
    const params = [date];

    if (version) {
      query += ` AND version = ?`;
      params.push(version);
    } else {
      query += ` ORDER BY version DESC LIMIT 1`;
    }

    const snapshot = db.prepare(query).get(...params);

    if (snapshot) {
      return {
        id: snapshot.id,
        mis_date: snapshot.mis_date,
        version: snapshot.version,
        status: snapshot.status,
        metrics: JSON.parse(snapshot.metrics_summary || '{}'),
        breakdown_positions: JSON.parse(snapshot.breakdown_positions || '[]'),
        breakdown_clients: JSON.parse(snapshot.breakdown_clients || '[]'),
        breakdown_recruiters: JSON.parse(snapshot.breakdown_recruiters || '[]'),
        candidates: JSON.parse(snapshot.candidate_snapshot_data || '[]'),
        notes: snapshot.notes,
        created_by: snapshot.created_by,
        created_at: snapshot.created_at,
        is_frozen: true
      };
    }

    // If not frozen yet, construct live dynamic view for that date
    const metrics = this.compileMetricsForDate(date);
    const positions = this.compilePositionBreakdown(date);
    const clients = this.compileClientBreakdown(date);
    const recruiters = this.compileRecruiterBreakdown(date);
    const candidates = this.compileCandidatesForDate(date);

    return {
      id: `live-${date}`,
      mis_date: date,
      version: 1,
      status: 'Live / Unfrozen',
      metrics,
      breakdown_positions: positions,
      breakdown_clients: clients,
      breakdown_recruiters: recruiters,
      candidates,
      notes: 'Live calculation (snapshot not frozen yet)',
      created_by: 'Live Engine',
      created_at: new Date().toISOString(),
      is_frozen: false
    };
  }

  /**
   * Compare two dates side-by-side with metric diffs and candidate status movement
   */
  static compareDates(date1, date2) {
    const snap1 = this.getSnapshotByDate(date1);
    const snap2 = this.getSnapshotByDate(date2);

    const m1 = snap1.metrics;
    const m2 = snap2.metrics;

    const diff = {};
    const metricKeys = Object.keys({ ...m1, ...m2 });

    metricKeys.forEach(k => {
      const v1 = Number(m1[k] || 0);
      const v2 = Number(m2[k] || 0);
      const absoluteChange = v2 - v1;
      const percentageChange = v1 > 0 ? Number(((absoluteChange / v1) * 100).toFixed(1)) : (v2 > 0 ? 100 : 0);
      diff[k] = {
        date1_val: v1,
        date2_val: v2,
        change: absoluteChange,
        percent: percentageChange
      };
    });

    // Positions comparison
    const posMap = new Map();
    snap1.breakdown_positions.forEach(p => posMap.set(p.position_id, { title: p.title, date1_sourced: p.sourced || 0, date2_sourced: 0, date1_selected: p.selected || 0, date2_selected: 0 }));
    snap2.breakdown_positions.forEach(p => {
      const existing = posMap.get(p.position_id) || { title: p.title, date1_sourced: 0, date2_sourced: 0, date1_selected: 0, date2_selected: 0 };
      existing.date2_sourced = p.sourced || 0;
      existing.date2_selected = p.selected || 0;
      posMap.set(p.position_id, existing);
    });

    const positionsDiff = Array.from(posMap.entries()).map(([id, data]) => ({
      position_id: id,
      title: data.title,
      sourced_diff: data.date2_sourced - data.date1_sourced,
      selected_diff: data.date2_selected - data.date1_selected,
      date1_sourced: data.date1_sourced,
      date2_sourced: data.date2_sourced
    }));

    // Recruiters comparison
    const recMap = new Map();
    snap1.breakdown_recruiters.forEach(r => recMap.set(r.recruiter_id, { name: r.recruiter_name, date1_sourced: r.sourced || 0, date2_sourced: 0, date1_joined: r.joined || 0, date2_joined: 0 }));
    snap2.breakdown_recruiters.forEach(r => {
      const existing = recMap.get(r.recruiter_id) || { name: r.recruiter_name, date1_sourced: 0, date2_sourced: 0, date1_joined: 0, date2_joined: 0 };
      existing.date2_sourced = r.sourced || 0;
      existing.date2_joined = r.joined || 0;
      recMap.set(r.recruiter_id, existing);
    });

    const recruitersDiff = Array.from(recMap.entries()).map(([id, data]) => ({
      recruiter_id: id,
      recruiter_name: data.name,
      sourced_diff: data.date2_sourced - data.date1_sourced,
      joined_diff: data.date2_joined - data.date1_joined,
      date1_sourced: data.date1_sourced,
      date2_sourced: data.date2_sourced
    }));

    return {
      date1,
      date2,
      snap1: {
        id: snap1.id,
        is_frozen: snap1.is_frozen,
        metrics: snap1.metrics
      },
      snap2: {
        id: snap2.id,
        is_frozen: snap2.is_frozen,
        metrics: snap2.metrics
      },
      metrics_diff: diff,
      positions_diff: positionsDiff,
      recruiters_diff: recruitersDiff
    };
  }

  /**
   * Calendar view list of all available historical dates and their metrics
   */
  static getCalendarIndex(year, month) {
    let query = `
      SELECT 
        s.id,
        s.mis_date,
        s.version,
        s.status,
        s.created_at,
        s.metrics_summary
      FROM daily_mis_snapshots s
    `;
    const params = [];

    if (year && month) {
      const monthStr = String(month).padStart(2, '0');
      query += ` WHERE s.mis_date LIKE ?`;
      params.push(`${year}-${monthStr}-%`);
    }

    query += ` ORDER BY s.mis_date ASC, s.version DESC`;

    const rows = db.prepare(query).all(...params);

    // Also get all distinct dates from candidates table or operational entries so un-frozen dates are visible
    let datesQuery = `
      SELECT DISTINCT mis_date FROM daily_mis_entries
      UNION
      SELECT DISTINCT created_date as mis_date FROM candidates
    `;
    const allDates = db.prepare(datesQuery).all().map(r => r.mis_date).filter(Boolean);

    const snapshotMap = new Map();
    rows.forEach(r => {
      if (!snapshotMap.has(r.mis_date)) {
        snapshotMap.set(r.mis_date, {
          id: r.id,
          mis_date: r.mis_date,
          version: r.version,
          status: r.status,
          metrics: JSON.parse(r.metrics_summary || '{}'),
          is_frozen: true
        });
      }
    });

    // Add any dates that have data but no frozen snapshot yet
    allDates.forEach(d => {
      if (!snapshotMap.has(d)) {
        snapshotMap.set(d, {
          id: `live-${d}`,
          mis_date: d,
          version: 1,
          status: 'Live',
          metrics: this.compileMetricsForDate(d),
          is_frozen: false
        });
      }
    });

    return Array.from(snapshotMap.values()).sort((a, b) => b.mis_date.localeCompare(a.mis_date));
  }

  /**
   * Aggregates date range (for Weekly or Monthly reports)
   */
  static getRangeReport(startDate, endDate) {
    const dates = [];
    const curr = new Date(startDate);
    const end = new Date(endDate);

    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    const dailySnapshots = dates.map(d => this.getSnapshotByDate(d));

    // Calculate aggregated totals
    const cumulative = this.emptyMetrics();
    dailySnapshots.forEach(snap => {
      Object.keys(cumulative).forEach(k => {
        cumulative[k] += Number(snap.metrics[k] || 0);
      });
    });

    // Consolidate positions
    const posTotals = new Map();
    dailySnapshots.forEach(snap => {
      snap.breakdown_positions.forEach(p => {
        const item = posTotals.get(p.position_id) || {
          position_id: p.position_id,
          title: p.title,
          client_name: p.client_name,
          sourced: 0,
          interview_scheduled: 0,
          selected: 0,
          joined: 0
        };
        item.sourced += Number(p.sourced || 0);
        item.interview_scheduled += Number(p.interview_scheduled || 0);
        item.selected += Number(p.selected || 0);
        item.joined += Number(p.joined || 0);
        posTotals.set(p.position_id, item);
      });
    });

    // Consolidate recruiters
    const recTotals = new Map();
    dailySnapshots.forEach(snap => {
      snap.breakdown_recruiters.forEach(r => {
        const item = recTotals.get(r.recruiter_id) || {
          recruiter_id: r.recruiter_id,
          recruiter_name: r.recruiter_name,
          department: r.department,
          target_monthly: r.target_monthly,
          sourced: 0,
          interview_scheduled: 0,
          selected: 0,
          joined: 0
        };
        item.sourced += Number(r.sourced || 0);
        item.interview_scheduled += Number(r.interview_scheduled || 0);
        item.selected += Number(r.selected || 0);
        item.joined += Number(r.joined || 0);
        recTotals.set(r.recruiter_id, item);
      });
    });

    // Consolidate clients
    const clientTotals = new Map();
    dailySnapshots.forEach(snap => {
      snap.breakdown_clients.forEach(c => {
        const item = clientTotals.get(c.client_id) || {
          client_id: c.client_id,
          client_name: c.client_name,
          industry: c.industry,
          sourced: 0,
          interview_scheduled: 0,
          selected: 0,
          joined: 0
        };
        item.sourced += Number(c.sourced || 0);
        item.interview_scheduled += Number(c.interview_scheduled || 0);
        item.selected += Number(c.selected || 0);
        item.joined += Number(c.joined || 0);
        clientTotals.set(c.client_id, item);
      });
    });

    return {
      startDate,
      endDate,
      total_days: dates.length,
      cumulative_metrics: cumulative,
      daily_trend: dailySnapshots.map(s => ({
        date: s.mis_date,
        is_frozen: s.is_frozen,
        metrics: s.metrics
      })),
      positions_summary: Array.from(posTotals.values()).sort((a, b) => b.sourced - a.sourced),
      recruiters_summary: Array.from(recTotals.values()).sort((a, b) => b.sourced - a.sourced),
      clients_summary: Array.from(clientTotals.values()).sort((a, b) => b.sourced - a.sourced)
    };
  }
}

module.exports = SnapshotService;
