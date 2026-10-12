# Daily MIS Management System

An enterprise-grade full-stack Management Information System (MIS) platform built for recruitment, talent acquisition, and executive operations.

## Key Features

- **Permanent Point-in-Time Historical Preservation**: Every day's MIS is captured and preserved as an immutable historical snapshot. Subsequent entries never overwrite past date records.
- **Calendar & Historical Querying**: Query any historical date to retrieve the exact snapshot state, pipeline metrics, and candidate roster.
- **Side-by-Side Date Comparison**: Compare two dates to analyze metric deltas, candidate movement, and recruiter throughput.
- **Consolidated Range Reporting**: Weekly and monthly rollups with full export options (Excel, CSV).
- **Recruitment Funnel & Pipeline**: End-to-end tracking of positions, candidates, interview feedback, and recruiter quotas.
- **Role-Based Access Control**: Secure JWT authentication and audit trail.

## Tech Stack

- **Backend**: Node.js, Express, Better-SQLite3
- **Frontend**: React / Vite, Vanilla CSS design system
- **Database**: SQLite (WAL mode enabled)

## Getting Started

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Run the Application
```bash
npm start
```
By default, the backend API and frontend will be accessible at `http://localhost:5000`.
