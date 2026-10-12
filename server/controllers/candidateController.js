const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getCandidates = (req, res) => {
  try {
    const {
      search,
      status,
      position_id,
      client_id,
      recruiter_id,
      date,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        c.*,
        p.title as position_title,
        cl.name as client_name,
        r.name as recruiter_name
      FROM candidates c
      LEFT JOIN positions p ON c.position_id = p.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN recruiters r ON c.recruiter_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.location LIKE ? OR c.skills LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (status && status !== 'All') {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (position_id) {
      query += ` AND c.position_id = ?`;
      params.push(position_id);
    }

    if (client_id) {
      query += ` AND c.client_id = ?`;
      params.push(client_id);
    }

    if (recruiter_id) {
      query += ` AND c.recruiter_id = ?`;
      params.push(recruiter_id);
    }

    if (date) {
      query += ` AND c.created_date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND c.created_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    // Allowed sort columns
    const validSorts = ['name', 'created_date', 'created_at', 'experience', 'current_ctc', 'expected_ctc', 'status'];
    const safeSort = validSorts.includes(sortBy) ? `c.${sortBy}` : 'c.created_at';
    const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const candidates = db.prepare(query).all(...params);

    // Total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total FROM candidates c WHERE 1=1
    `;
    const countParams = [];
    if (search) {
      countQuery += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.location LIKE ?)`;
      const s = `%${search}%`;
      countParams.push(s, s, s, s);
    }
    if (status && status !== 'All') {
      countQuery += ` AND c.status = ?`;
      countParams.push(status);
    }
    if (position_id) {
      countQuery += ` AND c.position_id = ?`;
      countParams.push(position_id);
    }
    if (client_id) {
      countQuery += ` AND c.client_id = ?`;
      countParams.push(client_id);
    }
    if (recruiter_id) {
      countQuery += ` AND c.recruiter_id = ?`;
      countParams.push(recruiter_id);
    }
    if (date) {
      countQuery += ` AND c.created_date = ?`;
      countParams.push(date);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: candidates,
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCandidateById = (req, res) => {
  try {
    const { id } = req.params;
    const candidate = db.prepare(`
      SELECT 
        c.*,
        p.title as position_title,
        p.budget_ctc as position_budget,
        cl.name as client_name,
        r.name as recruiter_name
      FROM candidates c
      LEFT JOIN positions p ON c.position_id = p.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN recruiters r ON c.recruiter_id = r.id
      WHERE c.id = ?
    `).get(id);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const activities = db.prepare(`
      SELECT a.*, r.name as recruiter_name
      FROM activities a
      LEFT JOIN recruiters r ON a.recruiter_id = r.id
      WHERE a.candidate_id = ?
      ORDER BY a.created_at DESC
    `).all(id);

    const auditHistory = db.prepare(`
      SELECT * FROM audit_logs
      WHERE entity_type = 'Candidate' AND entity_id = ?
      ORDER BY created_at DESC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...candidate,
        activities,
        auditHistory
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCandidate = (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      position_id,
      client_id,
      recruiter_id,
      location,
      source = 'LinkedIn',
      current_ctc = 0,
      expected_ctc = 0,
      notice_period = '30 Days',
      experience = 0,
      status = 'Sourced',
      interview_date = null,
      feedback = '',
      remarks = '',
      created_date = new Date().toISOString().split('T')[0]
    } = req.body;

    if (!name || !phone || !email || !position_id || !client_id || !recruiter_id) {
      return res.status(400).json({ error: 'Name, phone, email, position, client, and recruiter are mandatory fields.' });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO candidates (
        id, name, phone, email, position_id, client_id, recruiter_id,
        location, source, current_ctc, expected_ctc, notice_period,
        experience, status, interview_date, feedback, remarks, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, phone, email, position_id, client_id, recruiter_id,
      location, source, current_ctc, expected_ctc, notice_period,
      experience, status, interview_date, feedback, remarks, created_date
    );

    // Initial activity log
    db.prepare(`
      INSERT INTO activities (id, candidate_id, recruiter_id, type, notes, activity_date)
      VALUES (?, ?, ?, 'Screening', ?, ?)
    `).run(
      uuidv4(), id, recruiter_id, `Candidate sourced and added to pipeline with status ${status}`, created_date
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, new_values, details)
      VALUES (?, 'CREATE', 'Candidate', ?, ?, ?, ?)
    `).run(
      uuidv4(), id, req.user ? req.user.name : 'System',
      JSON.stringify({ name, email, status, position_id, client_id }),
      `New candidate ${name} profile created under status ${status}`
    );

    const created = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCandidate = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const {
      name = existing.name,
      phone = existing.phone,
      email = existing.email,
      position_id = existing.position_id,
      client_id = existing.client_id,
      recruiter_id = existing.recruiter_id,
      location = existing.location,
      source = existing.source,
      current_ctc = existing.current_ctc,
      expected_ctc = existing.expected_ctc,
      notice_period = existing.notice_period,
      experience = existing.experience,
      status = existing.status,
      interview_date = existing.interview_date,
      feedback = existing.feedback,
      remarks = existing.remarks
    } = req.body;

    db.prepare(`
      UPDATE candidates SET
        name = ?, phone = ?, email = ?, position_id = ?, client_id = ?, recruiter_id = ?,
        location = ?, source = ?, current_ctc = ?, expected_ctc = ?, notice_period = ?,
        experience = ?, status = ?, interview_date = ?, feedback = ?, remarks = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, phone, email, position_id, client_id, recruiter_id,
      location, source, current_ctc, expected_ctc, notice_period,
      experience, status, interview_date, feedback, remarks, id
    );

    // If status changed, log activity
    if (status !== existing.status) {
      db.prepare(`
        INSERT INTO activities (id, candidate_id, recruiter_id, type, notes, activity_date)
        VALUES (?, ?, ?, 'Status Change', ?, ?)
      `).run(
        uuidv4(), id, recruiter_id,
        `Status transitioned from ${existing.status} to ${status}. Feedback: ${feedback || 'N/A'}`,
        new Date().toISOString().split('T')[0]
      );
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, old_values, new_values, details)
      VALUES (?, 'UPDATE', 'Candidate', ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), id, req.user ? req.user.name : 'System',
      JSON.stringify(existing),
      JSON.stringify(req.body),
      `Updated details for candidate ${name}`
    );

    const updated = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCandidateStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, interview_date, feedback, remarks } = req.body;

    const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    db.prepare(`
      UPDATE candidates SET
        status = ?,
        interview_date = COALESCE(?, interview_date),
        feedback = COALESCE(?, feedback),
        remarks = COALESCE(?, remarks),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, interview_date || null, feedback || null, remarks || null, id);

    // Log Activity
    const actType = status.includes('Interview') ? 'Interview Scheduled' : 'Status Change';
    db.prepare(`
      INSERT INTO activities (id, candidate_id, recruiter_id, type, notes, activity_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), id, existing.recruiter_id, actType,
      `Status changed from ${existing.status} to ${status}. ${feedback ? 'Feedback: ' + feedback : ''}`,
      new Date().toISOString().split('T')[0]
    );

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, old_values, new_values, details)
      VALUES (?, 'STATUS_CHANGE', 'Candidate', ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), id, req.user ? req.user.name : 'System',
      JSON.stringify({ status: existing.status }),
      JSON.stringify({ status, interview_date, feedback }),
      `Candidate ${existing.name} status updated to ${status}`
    );

    res.json({ success: true, message: `Candidate status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCandidate = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    db.prepare('DELETE FROM candidates WHERE id = ?').run(id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, old_values, details)
      VALUES (?, 'DELETE', 'Candidate', ?, ?, ?, ?)
    `).run(
      uuidv4(), id, req.user ? req.user.name : 'System',
      JSON.stringify(existing),
      `Deleted candidate ${existing.name}`
    );

    res.json({ success: true, message: 'Candidate removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
