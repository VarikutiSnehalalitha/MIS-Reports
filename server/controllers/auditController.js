const db = require('../config/db');

exports.getAuditLogs = (req, res) => {
  try {
    const { entity_type, action, user_name, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT * FROM audit_logs
      WHERE 1=1
    `;
    const params = [];

    if (entity_type && entity_type !== 'All') {
      query += ` AND entity_type = ?`;
      params.push(entity_type);
    }
    if (action && action !== 'All') {
      query += ` AND action = ?`;
      params.push(action);
    }
    if (user_name) {
      query += ` AND user_name LIKE ?`;
      params.push(`%${user_name}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const logs = db.prepare(query).all(...params);

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM audit_logs`).get();

    res.json({
      success: true,
      data: logs,
      total: countRow.total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
