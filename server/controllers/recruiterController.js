const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getRecruiters = (req, res) => {
  try {
    const recruiters = db.prepare(`
      SELECT 
        r.*,
        COUNT(DISTINCT cand.id) as total_candidates,
        SUM(CASE WHEN cand.status = 'Selected' THEN 1 ELSE 0 END) as selected_count,
        SUM(CASE WHEN cand.status = 'Joined' THEN 1 ELSE 0 END) as joined_count,
        SUM(CASE WHEN cand.status = 'Interview Scheduled' THEN 1 ELSE 0 END) as interviews_count
      FROM recruiters r
      LEFT JOIN candidates cand ON cand.recruiter_id = r.id
      GROUP BY r.id
      ORDER BY r.name ASC
    `).all();

    res.json({ success: true, data: recruiters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRecruiter = (req, res) => {
  try {
    const { name, email, phone, department = 'Talent Acquisition', target_monthly = 5, status = 'Active', user_id = null } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Recruiter name is required' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO recruiters (id, user_id, name, email, phone, department, target_monthly, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user_id, name, email, phone, department, target_monthly, status);

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, details)
      VALUES (?, 'CREATE', 'Recruiter', ?, ?, ?)
    `).run(uuidv4(), id, req.user ? req.user.name : 'System', `Added recruiter ${name}`);

    const created = db.prepare('SELECT * FROM recruiters WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRecruiter = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM recruiters WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    const {
      name = existing.name,
      email = existing.email,
      phone = existing.phone,
      department = existing.department,
      target_monthly = existing.target_monthly,
      status = existing.status
    } = req.body;

    db.prepare(`
      UPDATE recruiters SET
        name = ?, email = ?, phone = ?, department = ?,
        target_monthly = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, email, phone, department, target_monthly, status, id);

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, old_values, new_values, details)
      VALUES (?, 'UPDATE', 'Recruiter', ?, ?, ?, ?, ?)
    `).run(uuidv4(), id, req.user ? req.user.name : 'System', JSON.stringify(existing), JSON.stringify(req.body), `Updated recruiter ${name}`);

    const updated = db.prepare('SELECT * FROM recruiters WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
