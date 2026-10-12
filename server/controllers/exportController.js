const ExportService = require('../services/exportService');
const SnapshotService = require('../services/snapshotService');
const db = require('../config/db');

exports.exportSnapshotExcel = (req, res) => {
  try {
    const { date } = req.params;
    const snapshot = SnapshotService.getSnapshotByDate(date);
    const buffer = ExportService.snapshotToExcel(snapshot);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Daily_MIS_${date}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportSnapshotCSV = (req, res) => {
  try {
    const { date } = req.params;
    const snapshot = SnapshotService.getSnapshotByDate(date);
    const csv = ExportService.candidatesToCSV(snapshot.candidates || []);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Candidates_MIS_${date}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportCandidatesCSV = (req, res) => {
  try {
    const candidates = db.prepare(`
      SELECT 
        c.*,
        p.title as position_title,
        cl.name as client_name,
        r.name as recruiter_name
      FROM candidates c
      LEFT JOIN positions p ON c.position_id = p.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN recruiters r ON c.recruiter_id = r.id
      ORDER BY c.created_date DESC
    `).all();

    const csv = ExportService.candidatesToCSV(candidates);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="All_Candidates_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportComparisonExcel = (req, res) => {
  try {
    const { date1, date2 } = req.query;
    if (!date1 || !date2) {
      return res.status(400).json({ error: 'date1 and date2 are required' });
    }

    const comp = SnapshotService.compareDates(date1, date2);
    const buffer = ExportService.comparisonToExcel(comp);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="MIS_Comparison_${date1}_vs_${date2}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPrintableReportData = (req, res) => {
  try {
    const { date } = req.params;
    const snapshot = SnapshotService.getSnapshotByDate(date);
    res.json({ success: true, data: snapshot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
