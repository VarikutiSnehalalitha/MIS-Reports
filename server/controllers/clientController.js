const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getClients = (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT p.id) as position_count,
        COUNT(DISTINCT cand.id) as candidate_count,
        SUM(CASE WHEN cand.status = 'Selected' THEN 1 ELSE 0 END) as selected_count,
        SUM(CASE WHEN cand.status = 'Joined' THEN 1 ELSE 0 END) as joined_count
      FROM clients c
      LEFT JOIN positions p ON p.client_id = c.id
      LEFT JOIN candidates cand ON cand.client_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    res.json({ success: true, data: clients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createClient = (req, res) => {
  try {
    const { name, industry, spoc_name, spoc_email, spoc_phone, location, status = 'Active' } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO clients (id, name, industry, spoc_name, spoc_email, spoc_phone, location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, industry, spoc_name, spoc_email, spoc_phone, location, status);

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, details)
      VALUES (?, 'CREATE', 'Client', ?, ?, ?)
    `).run(uuidv4(), id, req.user ? req.user.name : 'System', `Added client: ${name}`);

    const created = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateClient = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const {
      name = existing.name,
      industry = existing.industry,
      spoc_name = existing.spoc_name,
      spoc_email = existing.spoc_email,
      spoc_phone = existing.spoc_phone,
      location = existing.location,
      status = existing.status
    } = req.body;

    db.prepare(`
      UPDATE clients SET
        name = ?, industry = ?, spoc_name = ?, spoc_email = ?, spoc_phone = ?,
        location = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, industry, spoc_name, spoc_email, spoc_phone, location, status, id);

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, old_values, new_values, details)
      VALUES (?, 'UPDATE', 'Client', ?, ?, ?, ?, ?)
    `).run(uuidv4(), id, req.user ? req.user.name : 'System', JSON.stringify(existing), JSON.stringify(req.body), `Updated client ${name}`);

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
