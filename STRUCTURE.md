# Daily MIS Management System — System Architecture & Structure Document

## 1. Executive Overview

The **Daily MIS (Management Information System) Management System** is an enterprise-grade full-stack platform built for recruitment, talent acquisition, and executive business operations. 

Its central architectural guarantee is **Permanent Point-in-Time Historical Preservation**:
* Every day's MIS is captured and frozen as an **immutable historical snapshot**.
* Data entered on subsequent days (e.g. October 9 or October 10) **never alters or overwrites previous day records** (e.g. October 8).
* Stakeholders can query any historical date from the calendar (e.g., `08 October 2026`) and retrieve the exact state, metrics, funnel conversion, and candidate roster from that date.
* Two dates can be compared side-by-side with exact metric deltas, candidate movement, and recruiter throughput.
* Range reports (e.g. Weekly `01 Oct – 08 Oct` or Monthly `October 2026`) consolidate historical snapshots into executive summaries.

---

## 2. Directory Structure

```
Daily MIS Management System/
├── package.json                         # Root project scripts & backend dependencies
├── STRUCTURE.md                         # Complete system architectural specification
├── data/
│   └── mis_system.db                    # SQLite relational database (WAL mode enabled)
├── server/
│   ├── server.js                        # Express API server entrypoint & static client proxy
│   ├── config/
│   │   └── db.js                        # SQLite connection, pragmas, and schema initialization
│   ├── database/
│   │   ├── schema.sql                   # SQL DDL migrations with indexes & foreign keys
│   │   └── seed.js                      # Realistic seed dataset (Oct 01 - Oct 11 snapshots)
│   ├── middleware/
│   │   ├── auth.js                      # JWT authentication & role-based authorization
│   │   └── errorHandler.js              # Centralized API error handler
│   ├── services/
│   │   ├── snapshotService.js           # Core snapshot preservation & delta comparison engine
│   │   └── exportService.js             # Multi-sheet Excel workbook & CSV exporter
│   ├── controllers/
│   │   ├── authController.js            # User authentication & demo accounts
│   │   ├── misController.js             # Snapshots, calendar, comparison, & range reports
│   │   ├── candidateController.js       # Candidate pipeline CRUD & status transitions
│   │   ├── positionController.js        # Requisitions & openings management
│   │   ├── clientController.js          # Corporate client accounts
│   │   ├── recruiterController.js       # Recruiter roster & monthly performance targets
│   │   ├── activityController.js        # Interviews, follow-ups, & submission feedback
│   │   ├── auditController.js           # Immutable audit log ledger
│   │   └── exportController.js          # Excel, CSV, & printable PDF report routes
│   └── routes/
│       └── api.js                       # Express REST API routing layer
└── client/
    ├── index.html                       # HTML5 entry with Plus Jakarta Sans font
    ├── vite.config.js                   # Vite configuration with API proxy (port 3000 -> 5000)
    ├── package.json                     # Client UI packages (React, Lucide icons)
    ├── dist/                            # Production bundle (HTML, CSS, JS)
    └── src/
        ├── main.jsx                     # React DOM bootstrap
        ├── App.jsx                      # App root component & routing state
        ├── index.css                    # Pure Vanilla CSS design system tokens
        ├── services/
        │   └── api.js                   # Frontend HTTP client
        └── components/
            ├── Sidebar.jsx              # Navigation sidebar & role switcher
            ├── TopHeader.jsx            # Top date selector, quick jumps, & action bar
            ├── MISDashboardView.jsx     # KPI cards, funnel chart, & position/recruiter tabs
            ├── HistoricalCalendarView.jsx # Calendar archive & point-in-time inspector
            ├── DateComparisonView.jsx   # Date 1 vs Date 2 delta comparisons
            ├── RangeReportsView.jsx     # Weekly (01-08 Oct) & monthly consolidated reports
            ├── CandidateDatabaseView.jsx# Candidate table & Kanban pipeline views
            ├── ActivityTrackingView.jsx # Follow-ups, interviews, & submission feedback
            ├── PositionsView.jsx        # Position openings manager
            ├── ClientsView.jsx          # Client directory manager
            ├── RecruitersView.jsx       # Recruiter performance manager
            ├── AuditLogView.jsx         # System-wide audit log inspector & JSON diffs
            ├── AddCandidateModal.jsx    # Candidate creation form
            ├── DailyEntryModal.jsx      # Daily recruiter metrics entry form
            ├── CandidateDetailDrawer.jsx# Candidate profile slide-over with touchpoints
            └── PrintableReportModal.jsx # Print-ready / PDF report format
```

---

## 3. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Frontend [React Single Page Application]
        UI[Executive SaaS Dashboard]
        DatePicker[Historical Date Selector]
        FunnelView[Recruitment Funnel]
        KanbanView[Pipeline Kanban Board]
        ComparisonEngine[Date Comparison Engine]
        ReportEngine[Range Reports Engine]
    end

    subgraph BackendAPI [Express API Server :5000]
        Router[/api Routes]
        AuthMW[JWT & RBAC Middleware]
        AuditMW[Audit Logger Service]
        SnapshotEngine[Historical Snapshot Engine]
        ExportEngine[XLSX & CSV Generation Service]
    end

    subgraph DatabaseLayer [SQLite with WAL Mode]
        T_Users[(users)]
        T_Clients[(clients)]
        T_Positions[(positions)]
        T_Recruiters[(recruiters)]
        T_Candidates[(candidates)]
        T_Activities[(activities)]
        T_DailyEntries[(daily_mis_entries)]
        T_Snapshots[(daily_mis_snapshots - Immutable)]
        T_AuditLogs[(audit_logs)]
    end

    UI --> Router
    DatePicker --> SnapshotEngine
    SnapshotEngine --> T_Snapshots
    SnapshotEngine --> T_DailyEntries
    SnapshotEngine --> T_Candidates
    Router --> ExportEngine
    ExportEngine --> UI
    Router --> AuditMW
    AuditMW --> T_AuditLogs
```

---

## 4. Permanent Historical Snapshot Engine

### 4.1 Immutability Principle
A major flaw in naive dashboards is computing metrics on the fly from current candidate states. When a candidate's status changes on October 10 from "Interview Scheduled" to "Selected", a naive dashboard alters October 8 metrics retrospectively.

In this system:
1. When a daily snapshot is frozen (either manually or via day-end finalize), the engine captures a **frozen JSON representation** in `daily_mis_snapshots`:
   - `metrics_summary`: All 13 metrics at that date
   - `breakdown_positions`: Position performance at that date
   - `breakdown_clients`: Client breakdown at that date
   - `breakdown_recruiters`: Recruiter output at that date
   - `candidate_snapshot_data`: Snapshot of candidate rows at that date
2. Once marked `status = 'Locked'` (as configured for benchmark date `2026-10-08`), any attempt to overwrite or mutate it is strictly rejected by the backend engine with an error (`403 Forbidden: Snapshot is LOCKED and historical data cannot be modified`).
3. Revisions create an incremented `version` (`v2`, `v3`) while preserving prior versions for historical integrity.

---

## 5. Database Schema & Data Dictionary

### 5.1 `users`
* `id` (TEXT, PK): Unique user ID
* `name` (TEXT): Display name
* `email` (TEXT, UNIQUE): Login email
* `password_hash` (TEXT): Bcrypt salted hash
* `role` (TEXT): One of `'Admin'`, `'Manager'`, `'Recruiter'`
* `avatar` (TEXT): Initials or avatar path

### 5.2 `clients`
* `id` (TEXT, PK): Unique client ID
* `name` (TEXT): Corporate name (e.g. *TechNova Global*)
* `industry` (TEXT): Industry vertical (e.g. *Fintech*, *Healthtech*)
* `spoc_name` (TEXT): Single Point of Contact
* `spoc_email` (TEXT): SPOC email
* `spoc_phone` (TEXT): SPOC phone
* `location` (TEXT): City / Region
* `status` (TEXT): `'Active'`, `'Inactive'`, `'Hold'`

### 5.3 `positions`
* `id` (TEXT, PK): Unique position ID
* `title` (TEXT): Job title (e.g. *Senior Backend Engineer*)
* `client_id` (TEXT, FK -> clients): Client account
* `openings_count` (INTEGER): Number of openings
* `min_exp` / `max_exp` (REAL): Experience range
* `budget_ctc` (TEXT): Budget bracket (e.g. *24-32 LPA*)
* `department` (TEXT): Functional unit
* `status` (TEXT): `'Open'`, `'Hold'`, `'Closed'`

### 5.4 `recruiters`
* `id` (TEXT, PK): Unique recruiter ID
* `user_id` (TEXT, FK -> users): Linked user account
* `name` (TEXT): Recruiter name
* `department` (TEXT): Team
* `target_monthly` (INTEGER): Monthly hiring target
* `status` (TEXT): `'Active'`, `'On Leave'`, `'Inactive'`

### 5.5 `candidates`
* `id` (TEXT, PK): Unique candidate ID
* `name` (TEXT): Candidate full name
* `phone` (TEXT): Contact number
* `email` (TEXT): Contact email
* `position_id` (TEXT, FK -> positions): Applied position
* `client_id` (TEXT, FK -> clients): Associated client
* `recruiter_id` (TEXT, FK -> recruiters): Sourced by recruiter
* `location` (TEXT): Current location
* `source` (TEXT): LinkedIn, Naukri, Referral, Direct, etc.
* `current_ctc` (REAL): Current compensation in LPA
* `expected_ctc` (REAL): Expected compensation in LPA
* `notice_period` (TEXT): Immediate, 15 Days, 30 Days, 60 Days, etc.
* `experience` (REAL): Total experience in years
* `status` (TEXT): Pipeline state:
  * `Sourced`, `Contacted`, `Connected`, `Interested`, `Not Interested`
  * `Follow-up`, `Interview Scheduled`, `Interview Completed`
  * `Selected`, `Rejected`, `Joined`, `Dropped`, `Pending`
* `interview_date` (DATETIME): Scheduled interview date/time
* `feedback` (TEXT): Client or interviewer feedback
* `remarks` (TEXT): Recruiter internal remarks
* `created_date` (DATE): Logical date candidate entered the pipeline (`YYYY-MM-DD`)

### 5.6 `daily_mis_snapshots`
* `id` (TEXT, PK): Unique snapshot ID
* `mis_date` (DATE): Snapshot date (`YYYY-MM-DD`)
* `version` (INTEGER): Snapshot revision (`1`, `2`, ...)
* `status` (TEXT): `'Draft'`, `'Finalized'`, `'Locked'`
* `metrics_summary` (TEXT JSON): Complete aggregates dictionary
* `breakdown_positions` (TEXT JSON): Array of position metrics
* `breakdown_clients` (TEXT JSON): Array of client metrics
* `breakdown_recruiters` (TEXT JSON): Array of recruiter metrics
* `candidate_snapshot_data` (TEXT JSON): Candidates state at that date
* `notes` (TEXT): Operational remarks
* `created_by` (TEXT): User or system freezing the snapshot

### 5.7 `audit_logs`
* `id` (TEXT, PK): Unique audit record ID
* `action` (TEXT): `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `SNAPSHOT_FREEZE`, `EXPORT`
* `entity_type` (TEXT): `Candidate`, `DailyMIS`, `Position`, `Client`, `Recruiter`, `Snapshot`
* `entity_id` (TEXT): ID of changed object
* `user_name` (TEXT): Operator name
* `old_values` (TEXT JSON): Previous attribute values
* `new_values` (TEXT JSON): New attribute values
* `details` (TEXT): Human-readable event description
* `created_at` (DATETIME): Timestamp

---

## 6. REST API Endpoint Catalog

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and timestamp |
| `POST` | `/api/auth/login` | User authentication returning JWT token |
| `GET` | `/api/mis/today?date=YYYY-MM-DD` | Returns MIS metrics for date |
| `GET` | `/api/mis/date/:date` | Returns permanent historical snapshot for date |
| `POST` | `/api/mis/freeze/:date` | Freezes/locks daily historical snapshot |
| `GET` | `/api/mis/compare?date1=...&date2=...` | Computes delta metrics between two dates |
| `GET` | `/api/mis/calendar` | Returns archive index of all snapshot dates |
| `GET` | `/api/mis/range-report?startDate=...&endDate=...`| Consolidates range into weekly or monthly MIS |
| `POST` | `/api/mis/entry` | Saves daily operational numbers for a recruiter |
| `GET` | `/api/candidates` | Filtered, searched, and sorted candidate list |
| `POST` | `/api/candidates` | Creates new candidate and logs activity & audit |
| `PATCH` | `/api/candidates/:id/status` | Updates candidate status and logs audit |
| `GET` | `/api/activities/interviews` | Retrieves all upcoming and past interviews |
| `GET` | `/api/activities/follow-ups` | Retrieves pending follow-up candidate profiles |
| `GET` | `/api/activities/submissions` | Retrieves profiles submitted to clients with feedback |
| `GET` | `/api/export/snapshot/:date/excel` | Multi-tab Excel workbook download (`.xlsx`) |
| `GET` | `/api/export/snapshot/:date/csv` | Candidate CSV download for date |
| `GET` | `/api/export/candidates/csv` | Master candidates CSV download |
| `GET` | `/api/export/comparison/excel` | Comparison report Excel workbook download |
| `GET` | `/api/audit` | Filterable system audit logs with JSON diffs |

---

## 7. How to Run & Verify

### Starting the Server
```bash
# Production mode (serves API on :5000 and React SPA bundle)
npm start
```

### Development Mode
```bash
# Starts Express backend and Vite hot-reload frontend
npm run dev
```

### Accessing the System
Open your web browser and navigate to:
```
http://localhost:5000
```

* **Historical Benchmark Date**: Select `2026-10-08` or click "Jump to 08 Oct" to view the permanently frozen snapshot.
* **Weekly Report**: Click "Weekly MIS" (`01 Oct – 08 Oct`) in the Historical Calendar or Range Reports tab.
* **Monthly Report**: Click "Monthly MIS" (`October 2026`).
* **Comparison**: Navigate to "Compare Two Dates" to see delta analysis.
