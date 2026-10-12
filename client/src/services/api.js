// API Client Service for Daily MIS Management System

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    let errMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errMessage = errorJson.error;
    } catch (e) {
      // ignore
    }
    throw new Error(errMessage);
  }

  // Handle binary downloads vs json
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response;
}

export const misApi = {
  // MIS Core & Snapshots
  getTodayMIS: (date) => request(`/mis/today${date ? `?date=${date}` : ''}`),
  getHistoricalMIS: (date, version) => request(`/mis/date/${date}${version ? `?version=${version}` : ''}`),
  freezeSnapshot: (date, payload) => request(`/mis/freeze/${date}`, { method: 'POST', body: JSON.stringify(payload) }),
  compareDates: (date1, date2) => request(`/mis/compare?date1=${date1}&date2=${date2}`),
  getCalendarIndex: (year, month) => request(`/mis/calendar${year ? `?year=${year}&month=${month}` : ''}`),
  getRangeReport: (startDate, endDate) => request(`/mis/range-report?startDate=${startDate}&endDate=${endDate}`),
  saveOperationalEntry: (payload) => request('/mis/entry', { method: 'POST', body: JSON.stringify(payload) }),
  getPositionMIS: (params = '') => request(`/mis/breakdown/positions${params ? `?${params}` : ''}`),
  getClientMIS: (params = '') => request(`/mis/breakdown/clients${params ? `?${params}` : ''}`),
  getRecruiterMIS: (params = '') => request(`/mis/breakdown/recruiters${params ? `?${params}` : ''}`),

  // Candidates
  getCandidates: (params = '') => request(`/candidates${params ? `?${params}` : ''}`),
  getCandidateById: (id) => request(`/candidates/${id}`),
  createCandidate: (data) => request('/candidates', { method: 'POST', body: JSON.stringify(data) }),
  updateCandidate: (id, data) => request(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCandidateStatus: (id, data) => request(`/candidates/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCandidate: (id) => request(`/candidates/${id}`, { method: 'DELETE' }),

  // Positions, Clients, Recruiters
  getPositions: () => request('/positions'),
  createPosition: (data) => request('/positions', { method: 'POST', body: JSON.stringify(data) }),
  getClients: () => request('/clients'),
  createClient: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  getRecruiters: () => request('/recruiters'),
  createRecruiter: (data) => request('/recruiters', { method: 'POST', body: JSON.stringify(data) }),

  // Activities & Tracking
  getActivities: (params = '') => request(`/activities${params ? `?${params}` : ''}`),
  getInterviews: () => request('/activities/interviews'),
  getFollowUps: () => request('/activities/follow-ups'),
  getSubmissions: () => request('/activities/submissions'),
  createActivity: (data) => request('/activities', { method: 'POST', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: (params = '') => request(`/audit${params ? `?${params}` : ''}`),

  // Export URLs
  getExcelExportUrl: (date) => `${API_BASE}/export/snapshot/${date}/excel`,
  getCSVExportUrl: (date) => `${API_BASE}/export/snapshot/${date}/csv`,
  getAllCandidatesCSVUrl: () => `${API_BASE}/export/candidates/csv`,
  getComparisonExcelUrl: (date1, date2) => `${API_BASE}/export/comparison/excel?date1=${date1}&date2=${date2}`,
  getPrintableReportUrl: (date) => `${API_BASE}/export/snapshot/${date}/printable`
};
