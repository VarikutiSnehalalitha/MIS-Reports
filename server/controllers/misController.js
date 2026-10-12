const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const SnapshotService = require('../services/snapshotService');

// Default system date if none provided
const getTodayDateStr = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get Today's MIS (or specified date)
 */
exports.getTodayMIS = (req, res) => {
  try {
    const date = req.query.date || getTodayDateStr();
    const snapshot = SnapshotService.getSnapshotByDate(date);
    res.json({ success: true, data: snapshot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Historical MIS by Date
 * Guaranteed point-in-time preservation!
 */
exports.getHistoricalByDate = (req, res) => {
  try {
    const { date } = req.params;
    const version = req.query.version ? parseInt(req.query.version, 10) : null;
    const snapshot = SnapshotService.getSnapshotByDate(date, version);
    res.json({ success: true, data: snapshot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Freeze an immutable Daily Snapshot for a given date
 */
exports.freezeSnapshot = (req, res) => {
  try {
    const { date } = req.params;
    const { notes, status } = req.body;
    const user = req.user ? req.user.name : 'Administrator';

    const snapshot = SnapshotService.createOrFreezeSnapshot(date, {
      notes,
      status: status || 'Finalized',
      user,
      allowOverride: req.body.allowOverride || false
    });

    res.json({
      success: true,
      message: `Daily MIS snapshot permanently frozen for ${date}`,
      data: snapshot
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Compare two dates
 */
exports.compareDates = (req, res) => {
  try {
    const { date1, date2 } = req.query;
    if (!date1 || !date2) {
      return res.status(400).json({ error: 'Both date1 and date2 parameters are required for comparison.' });
    }

    const comparison = SnapshotService.compareDates(date1, date2);
    res.json({ success: true, data: comparison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get calendar index of all historical dates
 */
exports.getCalendarIndex = (req, res) => {
  try {
    const { year, month } = req.query;
    const index = SnapshotService.getCalendarIndex(year, month);
    res.json({ success: true, data: index });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Weekly or Monthly Aggregated MIS Report
 */
exports.getRangeReport = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required for range report.' });
    }

    const report = SnapshotService.getRangeReport(startDate, endDate);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Save or update daily operational MIS entry by recruiter, position, and client
 */
exports.saveOperationalEntry = (req, res) => {
  try {
    const {
      mis_date,
      recruiter_id,
      position_id,
      client_id,
      sourced = 0,
      contacted = 0,
      connected = 0,
      interested = 0,
      not_interested = 0,
      follow_up = 0,
      interview_scheduled = 0,
      interview_completed = 0,
      selected = 0,
      rejected = 0,
      joined = 0,
      dropped = 0,
      pending = 0,
      remarks = ''
    } = req.body;

    if (!mis_date || !recruiter_id || !position_id || !client_id) {
      return res.status(400).json({ error: 'mis_date, recruiter_id, position_id, and client_id are required.' });
    }

    // Check if snapshot is already locked for this date
    const lockedSnapshot = db.prepare(`
      SELECT id FROM daily_mis_snapshots 
      WHERE mis_date = ? AND status = 'Locked'
    `).get(mis_date);

    if (lockedSnapshot) {
      return res.status(403).json({ error: `MIS for date ${mis_date} is LOCKED and historical data cannot be modified.` });
    }

    const existing = db.prepare(`
      SELECT id FROM daily_mis_entries
      WHERE mis_date = ? AND recruiter_id = ? AND position_id = ? AND client_id = ?
    `).get(mis_date, recruiter_id, position_id, client_id);

    if (existing) {
      db.prepare(`
        UPDATE daily_mis_entries SET
          sourced = ?, contacted = ?, connected = ?, interested = ?, not_interested = ?,
          follow_up = ?, interview_scheduled = ?, interview_completed = ?, selected = ?,
          rejected = ?, joined = ?, dropped = ?, pending = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        sourced, contacted, connected, interested, not_interested,
        follow_up, interview_scheduled, interview_completed, selected,
        rejected, joined, dropped, pending, remarks, existing.id
      );

      // Audit
      db.prepare(`
        INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, details)
        VALUES (?, 'UPDATE', 'DailyMIS', ?, ?, ?)
      `).run(uuidv4(), existing.id, req.user ? req.user.name : 'User', `Updated operational MIS entry for ${mis_date}`);

      return res.json({ success: true, message: 'Operational MIS entry updated', id: existing.id });
    } else {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO daily_mis_entries (
          id, mis_date, recruiter_id, position_id, client_id,
          sourced, contacted, connected, interested, not_interested,
          follow_up, interview_scheduled, interview_completed, selected,
          rejected, joined, dropped, pending, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, mis_date, recruiter_id, position_id, client_id,
        sourced, contacted, connected, interested, not_interested,
        follow_up, interview_scheduled, interview_completed, selected,
        rejected, joined, dropped, pending, remarks
      );

      // Audit
      db.prepare(`
        INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, details)
        VALUES (?, 'CREATE', 'DailyMIS', ?, ?, ?)
      `).run(uuidv4(), id, req.user ? req.user.name : 'User', `Created operational MIS entry for ${mis_date}`);

      return res.json({ success: true, message: 'Operational MIS entry created', id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Position-wise breakdown across all dates or for a specific date
 */
exports.getPositionMIS = (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = `
      SELECT 
        p.id as position_id,
        p.title,
        p.openings_count,
        p.budget_ctc,
        p.location,
        p.status as position_status,
        c.id as client_id,
        c.name as client_name,
        COUNT(cand.id) as total_candidates,
        SUM(CASE WHEN cand.status = 'Sourced' THEN 1 ELSE 0 END) as sourced,
        SUM(CASE WHEN cand.status = 'Contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN cand.status = 'Connected' THEN 1 ELSE 0 END) as connected,
        SUM(CASE WHEN cand.status = 'Interested' THEN 1 ELSE 0 END) as interested,
        SUM(CASE WHEN cand.status = 'Follow-up' THEN 1 ELSE 0 END) as follow_up,
        SUM(CASE WHEN cand.status = 'Interview Scheduled' THEN 1 ELSE 0 END) as interview_scheduled,
        SUM(CASE WHEN cand.status = 'Interview Completed' THEN 1 ELSE 0 END) as interview_completed,
        SUM(CASE WHEN cand.status = 'Selected' THEN 1 ELSE 0 END) as selected,
        SUM(CASE WHEN cand.status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN cand.status = 'Joined' THEN 1 ELSE 0 END) as joined,
        SUM(CASE WHEN cand.status = 'Dropped' THEN 1 ELSE 0 END) as dropped,
        SUM(CASE WHEN cand.status = 'Pending' THEN 1 ELSE 0 END) as pending
      FROM positions p
      JOIN clients c ON p.client_id = c.id
      LEFT JOIN candidates cand ON cand.position_id = p.id
    `;
    const params = [];

    if (date) {
      query += ` AND cand.created_date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND cand.created_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY p.id ORDER BY total_candidates DESC, p.title ASC`;

    const data = db.prepare(query).all(...params);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Client-wise breakdown across all dates or for a specific date
 */
exports.getClientMIS = (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = `
      SELECT 
        c.id as client_id,
        c.name as client_name,
        c.industry,
        c.location,
        c.status as client_status,
        COUNT(DISTINCT p.id) as total_positions,
        COUNT(cand.id) as total_candidates,
        SUM(CASE WHEN cand.status = 'Sourced' THEN 1 ELSE 0 END) as sourced,
        SUM(CASE WHEN cand.status = 'Interested' THEN 1 ELSE 0 END) as interested,
        SUM(CASE WHEN cand.status = 'Interview Scheduled' THEN 1 ELSE 0 END) as interview_scheduled,
        SUM(CASE WHEN cand.status = 'Interview Completed' THEN 1 ELSE 0 END) as interview_completed,
        SUM(CASE WHEN cand.status = 'Selected' THEN 1 ELSE 0 END) as selected,
        SUM(CASE WHEN cand.status = 'Joined' THEN 1 ELSE 0 END) as joined
      FROM clients c
      LEFT JOIN positions p ON p.client_id = c.id
      LEFT JOIN candidates cand ON cand.client_id = c.id
    `;
    const params = [];

    if (date) {
      query += ` AND cand.created_date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND cand.created_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY c.id ORDER BY total_candidates DESC, c.name ASC`;

    const data = db.prepare(query).all(...params);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Recruiter-wise breakdown across all dates or for a specific date
 */
exports.getRecruiterMIS = (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = `
      SELECT 
        r.id as recruiter_id,
        r.name as recruiter_name,
        r.department,
        r.target_monthly,
        r.status as recruiter_status,
        COUNT(cand.id) as total_candidates,
        SUM(CASE WHEN cand.status = 'Sourced' THEN 1 ELSE 0 END) as sourced,
        SUM(CASE WHEN cand.status = 'Contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN cand.status = 'Connected' THEN 1 ELSE 0 END) as connected,
        SUM(CASE WHEN cand.status = 'Interested' THEN 1 ELSE 0 END) as interested,
        SUM(CASE WHEN cand.status = 'Interview Scheduled' THEN 1 ELSE 0 END) as interview_scheduled,
        SUM(CASE WHEN cand.status = 'Interview Completed' THEN 1 ELSE 0 END) as interview_completed,
        SUM(CASE WHEN cand.status = 'Selected' THEN 1 ELSE 0 END) as selected,
        SUM(CASE WHEN cand.status = 'Joined' THEN 1 ELSE 0 END) as joined,
        SUM(CASE WHEN cand.status = 'Pending' THEN 1 ELSE 0 END) as pending
      FROM recruiters r
      LEFT JOIN candidates cand ON cand.recruiter_id = r.id
    `;
    const params = [];

    if (date) {
      query += ` AND cand.created_date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND cand.created_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY r.id ORDER BY total_candidates DESC, r.name ASC`;

    const data = db.prepare(query).all(...params);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
