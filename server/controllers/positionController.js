const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getPositions = (req, res) => {
  try {
    const { status, client_id } = req.query;
    let query = `
      SELECT 
        p.*,
        c.name as client_name,
        COUNT(cand.id) as candidate_count,
        SUM(CASE WHEN cand.status = 'Selected' THEN 1 ELSE 0 END) as selected_count,
        SUM(CASE WHEN cand.status = 'Joined' THEN 1 ELSE 0 END) as joined_count
      FROM positions p
      JOIN clients c ON p.client_id = c.id
      LEFT JOIN candidates cand ON cand.position_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    if (client_id) {
      query += ` AND p.client_id = ?`;
      params.push(client_id);
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    const positions = db.prepare(query).all(...params);
    res.json({ success: true, data: positions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPosition = (req, res) => {
  try {
    const {
      title,
      client_id,
      openings_count = 1,
      min_exp = 0,
      max_exp = 10,
      budget_ctc = '',
      location = '',
      department = 'Engineering',
      status = 'Open'
    } = req.body;

    if (!title || !client_id) {
      return res.status(400).json({ error: 'Title and client_id are required' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO positions (id, title, client_id, openings_count, min_exp, max_exp, budget_ctc, location, department, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, client_id, openings_count, min_exp, max_exp, budget_ctc, location, department, status);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, details)
      VALUES (?, 'CREATE', 'Position', ?, ?, ?)
    `).run(uuidv4(), id, req.user ? req.user.name : 'System', `Created position opening: ${title}`);

    const created = db.prepare('SELECT * FROM positions WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePosition = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM positions WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Position not found' });
    }

    const {
      title = existing.title,
      client_id = existing.client_id,
      openings_count = existing.openings_count,
      min_exp = existing.min_exp,
      max_exp = existing.max_exp,
      budget_ctc = existing.budget_ctc,
      location = existing.location,
      department = existing.department,
      status = existing.status
    } = req.body;

    db.prepare(`
      UPDATE positions SET
        title = ?, client_id = ?, openings_count = ?, min_exp = ?, max_exp = ?,
        budget_ctc = ?, location = ?, department = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, client_id, openings_count, min_exp, max_exp, budget_ctc, location, department, status, id);

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, old_values, new_values, details)
      VALUES (?, 'UPDATE', 'Position', ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), id, req.user ? req.user.name : 'System',
      JSON.stringify(existing), JSON.stringify(req.body), `Updated position ${title}`
    );

    const updated = db.prepare('SELECT * FROM positions WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
