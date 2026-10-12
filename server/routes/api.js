const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const misController = require('../controllers/misController');
const candidateController = require('../controllers/candidateController');
const positionController = require('../controllers/positionController');
const clientController = require('../controllers/clientController');
const recruiterController = require('../controllers/recruiterController');
const activityController = require('../controllers/activityController');
const auditController = require('../controllers/auditController');
const exportController = require('../controllers/exportController');

const { authenticate, authorize } = require('../middleware/auth');

// Auth routes
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);
router.get('/auth/users', authController.getUsers);

// MIS Core & Historical Snapshot routes
router.get('/mis/today', authenticate, misController.getTodayMIS);
router.get('/mis/date/:date', authenticate, misController.getHistoricalByDate);
router.post('/mis/freeze/:date', authenticate, misController.freezeSnapshot);
router.get('/mis/compare', authenticate, misController.compareDates);
router.get('/mis/calendar', authenticate, misController.getCalendarIndex);
router.get('/mis/range-report', authenticate, misController.getRangeReport);
router.post('/mis/entry', authenticate, misController.saveOperationalEntry);
router.get('/mis/breakdown/positions', authenticate, misController.getPositionMIS);
router.get('/mis/breakdown/clients', authenticate, misController.getClientMIS);
router.get('/mis/breakdown/recruiters', authenticate, misController.getRecruiterMIS);

// Candidate routes
router.get('/candidates', authenticate, candidateController.getCandidates);
router.get('/candidates/:id', authenticate, candidateController.getCandidateById);
router.post('/candidates', authenticate, candidateController.createCandidate);
router.put('/candidates/:id', authenticate, candidateController.updateCandidate);
router.patch('/candidates/:id/status', authenticate, candidateController.updateCandidateStatus);
router.delete('/candidates/:id', authenticate, candidateController.deleteCandidate);

// Position routes
router.get('/positions', authenticate, positionController.getPositions);
router.post('/positions', authenticate, positionController.createPosition);
router.put('/positions/:id', authenticate, positionController.updatePosition);

// Client routes
router.get('/clients', authenticate, clientController.getClients);
router.post('/clients', authenticate, clientController.createClient);
router.put('/clients/:id', authenticate, clientController.updateClient);

// Recruiter routes
router.get('/recruiters', authenticate, recruiterController.getRecruiters);
router.post('/recruiters', authenticate, recruiterController.createRecruiter);
router.put('/recruiters/:id', authenticate, recruiterController.updateRecruiter);

// Activity, Follow-up, Interview & Submission routes
router.get('/activities', authenticate, activityController.getActivities);
router.get('/activities/interviews', authenticate, activityController.getInterviews);
router.get('/activities/follow-ups', authenticate, activityController.getFollowUps);
router.get('/activities/submissions', authenticate, activityController.getSubmissions);
router.post('/activities', authenticate, activityController.createActivity);

// Audit Log routes
router.get('/audit', authenticate, auditController.getAuditLogs);

// Export routes
router.get('/export/snapshot/:date/excel', exportController.exportSnapshotExcel);
router.get('/export/snapshot/:date/csv', exportController.exportSnapshotCSV);
router.get('/export/candidates/csv', exportController.exportCandidatesCSV);
router.get('/export/comparison/excel', exportController.exportComparisonExcel);
router.get('/export/snapshot/:date/printable', authenticate, exportController.getPrintableReportData);

module.exports = router;
