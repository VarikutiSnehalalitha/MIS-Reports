const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getActivities = (req, res) => {
  try {
    const { type, candidate_id, recruiter_id, date, limit = 50 } = req.query;

    let query = `
      SELECT 
        a.*,
        c.name as candidate_name,
        c.status as candidate_status,
        c.phone as candidate_phone,
        p.title as position_title,
        cl.name as client_name,
        r.name as recruiter_name
      FROM activities a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN positions p ON c.position_id = p.id
      JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN recruiters r ON a.recruiter_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'All') {
      query += ` AND a.type = ?`;
      params.push(type);
    }
    if (candidate_id) {
      query += ` AND a.candidate_id = ?`;
      params.push(candidate_id);
    }
    if (recruiter_id) {
      query += ` AND a.recruiter_id = ?`;
      params.push(recruiter_id);
    }
    if (date) {
      query += ` AND a.activity_date = ?`;
      params.push(date);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const activities = db.prepare(query).all(...params);
    res.json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Interview Tracking endpoint
 */
exports.getInterviews = (req, res) => {
  try {
    const interviews = db.prepare(`
      SELECT 
        c.id as candidate_id,
        c.name as candidate_name,
        c.phone as candidate_phone,
        c.email as candidate_email,
        c.status as candidate_status,
        c.interview_date,
        c.feedback,
        c.experience,
        p.id as position_id,
        p.title as position_title,
        cl.id as client_id,
        cl.name as client_name,
        r.id as recruiter_id,
        r.name as recruiter_name
      FROM candidates c
      JOIN positions p ON c.position_id = p.id
      JOIN clients cl ON c.client_id = cl.id
      JOIN recruiters r ON c.recruiter_id = r.id
      WHERE c.status IN ('Interview Scheduled', 'Interview Completed', 'Selected', 'Rejected')
         OR c.interview_date IS NOT NULL
      ORDER BY c.interview_date DESC, c.updated_at DESC
    `).all();

    res.json({ success: true, data: interviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Follow-up Tracking endpoint
 */
exports.getFollowUps = (req, res) => {
  try {
    const followUps = db.prepare(`
      SELECT 
        c.id as candidate_id,
        c.name as candidate_name,
        c.phone as candidate_phone,
        c.email as candidate_email,
        c.status as candidate_status,
        c.remarks,
        c.created_date,
        c.updated_at,
        p.title as position_title,
        cl.name as client_name,
        r.name as recruiter_name
      FROM candidates c
      JOIN positions p ON c.position_id = p.id
      JOIN clients cl ON c.client_id = cl.id
      JOIN recruiters r ON c.recruiter_id = r.id
      WHERE c.status IN ('Follow-up', 'Pending', 'Contacted')
      ORDER BY c.updated_at ASC
    `).all();

    res.json({ success: true, data: followUps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Client Submissions & Feedback Tracking endpoint
 */
exports.getSubmissions = (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT 
        c.id as candidate_id,
        c.name as candidate_name,
        c.experience,
        c.current_ctc,
        c.expected_ctc,
        c.notice_period,
        c.status as current_status,
        c.feedback as client_feedback,
        c.remarks,
        c.created_date as submitted_date,
        p.title as position_title,
        cl.name as client_name,
        r.name as recruiter_name
      FROM candidates c
      JOIN positions p ON c.position_id = p.id
      JOIN clients cl ON c.client_id = cl.id
      JOIN recruiters r ON c.recruiter_id = r.id
      WHERE c.status IN ('Interested', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Rejected', 'Joined')
      ORDER BY c.created_date DESC
    `).all();

    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createActivity = (req, res) => {
  try {
    const { candidate_id, recruiter_id, type, notes, activity_date = new Date().toISOString().split('T')[0] } = req.body;
    if (!candidate_id || !recruiter_id || !type) {
      return res.status(400).json({ error: 'candidate_id, recruiter_id, and type are required' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO activities (id, candidate_id, recruiter_id, type, notes, activity_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, candidate_id, recruiter_id, type, notes, activity_date);

    res.status(201).json({ success: true, id, message: 'Activity logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
