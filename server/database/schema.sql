-- Daily MIS Management System Database Schema
-- SQLite schema with proper relations, indexes, and audit logging support

PRAGMA foreign_keys = ON;

-- 1. Users & Auth
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin', 'Manager', 'Recruiter')),
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clients
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    spoc_name TEXT,
    spoc_email TEXT,
    spoc_phone TEXT,
    location TEXT,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Hold')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Positions / Job Openings
CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_id TEXT NOT NULL,
    openings_count INTEGER DEFAULT 1,
    min_exp REAL DEFAULT 0,
    max_exp REAL DEFAULT 10,
    budget_ctc TEXT,
    location TEXT,
    department TEXT,
    status TEXT DEFAULT 'Open' CHECK(status IN ('Open', 'Hold', 'Closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 4. Recruiters
CREATE TABLE IF NOT EXISTS recruiters (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department TEXT DEFAULT 'Talent Acquisition',
    target_monthly INTEGER DEFAULT 5,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'On Leave', 'Inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Candidates Master
CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    position_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    recruiter_id TEXT NOT NULL,
    location TEXT,
    source TEXT DEFAULT 'LinkedIn',
    current_ctc REAL DEFAULT 0,
    expected_ctc REAL DEFAULT 0,
    notice_period TEXT DEFAULT '30 Days',
    experience REAL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN (
        'Sourced', 'Contacted', 'Connected', 'Interested', 'Not Interested',
        'Follow-up', 'Interview Scheduled', 'Interview Completed',
        'Selected', 'Rejected', 'Joined', 'Dropped', 'Pending'
    )),
    interview_date DATETIME,
    feedback TEXT,
    remarks TEXT,
    created_date DATE NOT NULL, -- Logical date candidate entered the pipeline (YYYY-MM-DD)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE RESTRICT
);

-- 6. Candidate Activities & Touchpoints
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    recruiter_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN (
        'Call', 'Email', 'Screening', 'Follow-up', 
        'Interview Scheduled', 'Interview Feedback', 
        'Client Submission', 'Status Change', 'Remark'
    )),
    notes TEXT,
    activity_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE
);

-- 7. Daily Granular MIS Operational Entries (by date, recruiter, position, client)
CREATE TABLE IF NOT EXISTS daily_mis_entries (
    id TEXT PRIMARY KEY,
    mis_date DATE NOT NULL,
    recruiter_id TEXT NOT NULL,
    position_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    sourced INTEGER DEFAULT 0,
    contacted INTEGER DEFAULT 0,
    connected INTEGER DEFAULT 0,
    interested INTEGER DEFAULT 0,
    not_interested INTEGER DEFAULT 0,
    follow_up INTEGER DEFAULT 0,
    interview_scheduled INTEGER DEFAULT 0,
    interview_completed INTEGER DEFAULT 0,
    selected INTEGER DEFAULT 0,
    rejected INTEGER DEFAULT 0,
    joined INTEGER DEFAULT 0,
    dropped INTEGER DEFAULT 0,
    pending INTEGER DEFAULT 0,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE(mis_date, recruiter_id, position_id, client_id)
);

-- 8. Permanent Historical MIS Snapshots (IMMUTABLE POINT-IN-TIME FREEZE)
-- Every date gets an immutable snapshot that preserves exact metrics, breakdown by position,
-- breakdown by client, breakdown by recruiter, candidate states, and activity states.
CREATE TABLE IF NOT EXISTS daily_mis_snapshots (
    id TEXT PRIMARY KEY,
    mis_date DATE NOT NULL,
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Finalized' CHECK(status IN ('Draft', 'Finalized', 'Locked')),
    metrics_summary TEXT NOT NULL, -- JSON blob of all aggregates
    breakdown_positions TEXT NOT NULL, -- JSON blob array
    breakdown_clients TEXT NOT NULL, -- JSON blob array
    breakdown_recruiters TEXT NOT NULL, -- JSON blob array
    candidate_snapshot_data TEXT, -- JSON blob of candidate pipeline records at that date
    activity_snapshot_data TEXT, -- JSON blob of activities recorded
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mis_date, version)
);

-- 9. Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, STATUS_CHANGE, SNAPSHOT_FREEZE, EXPORT, RESTORE
    entity_type TEXT NOT NULL, -- Candidate, DailyMIS, Position, Client, Recruiter, Snapshot
    entity_id TEXT,
    user_id TEXT,
    user_name TEXT,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries across dates, recruiters, clients, and positions
CREATE INDEX IF NOT EXISTS idx_candidates_date ON candidates(created_date);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_recruiter ON candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_client ON candidates(client_id);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_candidate ON activities(candidate_id);
CREATE INDEX IF NOT EXISTS idx_daily_mis_entries_date ON daily_mis_entries(mis_date);
CREATE INDEX IF NOT EXISTS idx_daily_mis_snapshots_date ON daily_mis_snapshots(mis_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
