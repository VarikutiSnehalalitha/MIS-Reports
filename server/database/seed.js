const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const SnapshotService = require('../services/snapshotService');

function seedDatabase() {
  console.log('Seeding Daily MIS Management System Database...');

  // Clear existing data in correct FK order
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM activities;
    DELETE FROM daily_mis_snapshots;
    DELETE FROM daily_mis_entries;
    DELETE FROM candidates;
    DELETE FROM positions;
    DELETE FROM clients;
    DELETE FROM recruiters;
    DELETE FROM users;
  `);

  const passwordHash = bcrypt.hashSync('admin123', 8);

  // 1. Users
  const users = [
    { id: 'usr-admin-1', name: 'Aditya Sharma', email: 'aditya.sharma@talentmis.com', role: 'Admin', avatar: 'AS' },
    { id: 'usr-mgr-1', name: 'Neha Kapoor', email: 'neha.kapoor@talentmis.com', role: 'Manager', avatar: 'NK' },
    { id: 'usr-rec-1', name: 'Priya Verma', email: 'priya.verma@talentmis.com', role: 'Recruiter', avatar: 'PV' },
    { id: 'usr-rec-2', name: 'Rahul Joshi', email: 'rahul.joshi@talentmis.com', role: 'Recruiter', avatar: 'RJ' }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  users.forEach(u => insertUser.run(u.id, u.name, u.email, passwordHash, u.role, u.avatar));

  // 2. Clients
  const clients = [
    { id: 'cl-1', name: 'TechNova Global', industry: 'SaaS / Enterprise Software', spoc_name: 'Rajesh Nair', spoc_email: 'rajesh@technova.io', spoc_phone: '+91 98201 12345', location: 'Bangalore' },
    { id: 'cl-2', name: 'FinEdge Capital', industry: 'Fintech / Banking', spoc_name: 'Siddharth Rao', spoc_email: 'siddharth@finedge.com', spoc_phone: '+91 98450 67890', location: 'Mumbai' },
    { id: 'cl-3', name: 'CloudScale Systems', industry: 'Cloud Infrastructure & AI', spoc_name: 'Meera Iyer', spoc_email: 'meera@cloudscale.ai', spoc_phone: '+91 99001 23456', location: 'Hyderabad' },
    { id: 'cl-4', name: 'HealthPulse Labs', industry: 'Healthtech', spoc_name: 'Dr. Kabir Sen', spoc_email: 'kabir@healthpulse.in', spoc_phone: '+91 97112 34567', location: 'Delhi NCR' },
    { id: 'cl-5', name: 'OmniRetail Commerce', industry: 'E-Commerce / Logistics', spoc_name: 'Ananya Roy', spoc_email: 'ananya@omniretail.com', spoc_phone: '+91 98300 54321', location: 'Pune' }
  ];

  const insertClient = db.prepare(`
    INSERT INTO clients (id, name, industry, spoc_name, spoc_email, spoc_phone, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  clients.forEach(c => insertClient.run(c.id, c.name, c.industry, c.spoc_name, c.spoc_email, c.spoc_phone, c.location));

  // 3. Positions
  const positions = [
    { id: 'pos-1', title: 'Senior Backend Engineer (Node/Go)', client_id: 'cl-1', openings_count: 4, min_exp: 4, max_exp: 8, budget_ctc: '24-32 LPA', location: 'Bangalore / Hybrid', department: 'Platform Engineering' },
    { id: 'pos-2', title: 'Lead Frontend Architect (React/Next)', client_id: 'cl-1', openings_count: 2, min_exp: 6, max_exp: 10, budget_ctc: '30-40 LPA', location: 'Bangalore', department: 'Core UI' },
    { id: 'pos-3', title: 'DevOps / Site Reliability Engineer', client_id: 'cl-3', openings_count: 3, min_exp: 3, max_exp: 7, budget_ctc: '20-28 LPA', location: 'Hyderabad', department: 'Infrastructure' },
    { id: 'pos-4', title: 'Risk Analyst & Compliance Lead', client_id: 'cl-2', openings_count: 2, min_exp: 5, max_exp: 9, budget_ctc: '22-30 LPA', location: 'Mumbai', department: 'Risk & Strategy' },
    { id: 'pos-5', title: 'Staff Data Engineer (PySpark/Databricks)', client_id: 'cl-4', openings_count: 2, min_exp: 5, max_exp: 8, budget_ctc: '26-36 LPA', location: 'Delhi NCR', department: 'Data Platform' },
    { id: 'pos-6', title: 'Product Manager - Growth & Retention', client_id: 'cl-5', openings_count: 1, min_exp: 4, max_exp: 8, budget_ctc: '25-35 LPA', location: 'Pune', department: 'Product' }
  ];

  const insertPos = db.prepare(`
    INSERT INTO positions (id, title, client_id, openings_count, min_exp, max_exp, budget_ctc, location, department)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  positions.forEach(p => insertPos.run(p.id, p.title, p.client_id, p.openings_count, p.min_exp, p.max_exp, p.budget_ctc, p.location, p.department));

  // 4. Recruiters
  const recruiters = [
    { id: 'rec-1', user_id: 'usr-rec-1', name: 'Priya Verma', email: 'priya.verma@talentmis.com', phone: '+91 98111 22334', department: 'Tech Talent Acquisition', target_monthly: 6 },
    { id: 'rec-2', user_id: 'usr-rec-2', name: 'Rahul Joshi', email: 'rahul.joshi@talentmis.com', phone: '+91 98222 33445', department: 'Fintech & Leadership', target_monthly: 5 },
    { id: 'rec-3', user_id: null, name: 'Ananya Iyer', email: 'ananya.iyer@talentmis.com', phone: '+91 98333 44556', department: 'Cloud & Infrastructure', target_monthly: 5 },
    { id: 'rec-4', user_id: null, name: 'Vikram Malhotra', email: 'vikram.m@talentmis.com', phone: '+91 98444 55667', department: 'Product & Analytics', target_monthly: 4 }
  ];

  const insertRec = db.prepare(`
    INSERT INTO recruiters (id, user_id, name, email, phone, department, target_monthly)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  recruiters.forEach(r => insertRec.run(r.id, r.user_id, r.name, r.email, r.phone, r.department, r.target_monthly));

  // 5. Rich Realistic Candidates across October 1 - October 11, 2026
  const candidateSeeds = [
    // Oct 1
    { name: 'Arjun Nambiar', phone: '+91 98230 11001', email: 'arjun.nambiar@gmail.com', pos: 'pos-1', cl: 'cl-1', rec: 'rec-1', loc: 'Bangalore', src: 'LinkedIn', ctc: 18, ectc: 26, np: '30 Days', exp: 5.2, status: 'Joined', date: '2026-10-01', feedback: 'Offered and joined successfully on 10 Oct', remarks: 'Strong system design skills' },
    { name: 'Kavita Menon', phone: '+91 98230 11002', email: 'kavita.m@gmail.com', pos: 'pos-2', cl: 'cl-1', rec: 'rec-1', loc: 'Bangalore', src: 'Naukri', ctc: 22, ectc: 32, np: 'Immediate', exp: 7.0, status: 'Selected', date: '2026-10-01', feedback: 'VP Engineering approved offer rollout', remarks: 'Exceptional React & Web Performance knowledge' },
    { name: 'Rohan Deshmukh', phone: '+91 98230 11003', email: 'rohan.d@outlook.com', pos: 'pos-3', cl: 'cl-3', rec: 'rec-3', loc: 'Hyderabad', src: 'Referral', ctc: 15, ectc: 22, np: '15 Days', exp: 4.5, status: 'Selected', date: '2026-10-01', feedback: 'Hands-on Terraform & K8s exam cleared with 92%', remarks: 'Offer released 07 Oct' },

    // Oct 2
    { name: 'Deepika Sundaram', phone: '+91 98230 11004', email: 'deepika.s@gmail.com', pos: 'pos-4', cl: 'cl-2', rec: 'rec-2', loc: 'Mumbai', src: 'LinkedIn', ctc: 19, ectc: 25, np: '30 Days', exp: 6.0, status: 'Interview Completed', date: '2026-10-02', feedback: 'Final round with Head of Risk completed. Awaiting verdict', remarks: 'Good regulatory exposure' },
    { name: 'Suresh Pillai', phone: '+91 98230 11005', email: 'suresh.pillai@yahoo.com', pos: 'pos-1', cl: 'cl-1', rec: 'rec-1', loc: 'Bangalore', src: 'Direct', ctc: 17, ectc: 24, np: '60 Days', exp: 4.8, status: 'Rejected', date: '2026-10-02', feedback: 'L2 technical round: struggled with concurrency and locks', remarks: 'Good attitude but gaps in DB scaling' },

    // Oct 3
    { name: 'Tanvi Chawla', phone: '+91 98230 11006', email: 'tanvi.chawla@gmail.com', pos: 'pos-6', cl: 'cl-5', rec: 'rec-4', loc: 'Pune', src: 'IIM Network', ctc: 20, ectc: 30, np: '30 Days', exp: 5.5, status: 'Selected', date: '2026-10-03', feedback: 'Founder round cleared. Joining confirmation expected', remarks: 'Strong product metrics intuition' },
    { name: 'Gaurav Kulkarni', phone: '+91 98230 11007', email: 'gaurav.k@gmail.com', pos: 'pos-5', cl: 'cl-4', rec: 'rec-2', loc: 'Delhi NCR', src: 'LinkedIn', ctc: 21, ectc: 31, np: '45 Days', exp: 6.2, status: 'Interview Scheduled', date: '2026-10-03', feedback: 'Tech evaluation scheduled for 12 Oct', remarks: 'Databricks and Spark streaming expert' },

    // Oct 4
    { name: 'Sneha Banerjee', phone: '+91 98230 11008', email: 'sneha.b@gmail.com', pos: 'pos-2', cl: 'cl-1', rec: 'rec-1', loc: 'Kolkata/Relocate', src: 'Naukri', ctc: 18, ectc: 28, np: '30 Days', exp: 6.5, status: 'Interview Completed', date: '2026-10-04', feedback: 'Design system evaluation positive. Waiting for budget signoff', remarks: 'Willing to relocate to Bangalore' },
    { name: 'Varun Singhania', phone: '+91 98230 11009', email: 'varun.s@fin.in', pos: 'pos-4', cl: 'cl-2', rec: 'rec-2', loc: 'Mumbai', src: 'Portal', ctc: 16, ectc: 22, np: 'Immediate', exp: 4.0, status: 'Interested', date: '2026-10-04', feedback: 'Screened by recruiter. Profile shared with client', remarks: 'Available for interview on weekdays' },

    // Oct 5
    { name: 'Pooja Hegde', phone: '+91 98230 11010', email: 'pooja.hegde@tech.com', pos: 'pos-3', cl: 'cl-3', rec: 'rec-3', loc: 'Hyderabad', src: 'LinkedIn', ctc: 17, ectc: 25, np: '30 Days', exp: 5.0, status: 'Joined', date: '2026-10-05', feedback: 'Onboarded on AWS infrastructure team', remarks: 'Very smooth onboarding' },
    { name: 'Nikhil Saxena', phone: '+91 98230 11011', email: 'nikhil.saxena@gmail.com', pos: 'pos-1', cl: 'cl-1', rec: 'rec-1', loc: 'Bangalore', src: 'Referral', ctc: 22, ectc: 30, np: '60 Days', exp: 6.8, status: 'Interview Scheduled', date: '2026-10-05', feedback: 'L1 interview scheduled for 13 Oct 2026', remarks: 'Ex-Flipkart backend dev' },

    // Oct 6
    { name: 'Aakash Bhattacharya', phone: '+91 98230 11012', email: 'aakash.b@gmail.com', pos: 'pos-5', cl: 'cl-4', rec: 'rec-4', loc: 'Delhi NCR', src: 'LinkedIn', ctc: 24, ectc: 34, np: '30 Days', exp: 7.5, status: 'Connected', date: '2026-10-06', feedback: 'Connected on phone. Discussed role requirements', remarks: 'Shared JD over email' },
    { name: 'Ritika Aggarwal', phone: '+91 98230 11013', email: 'ritika.aggarwal@gmail.com', pos: 'pos-6', cl: 'cl-5', rec: 'rec-4', loc: 'Pune', src: 'Direct', ctc: 19, ectc: 27, np: '45 Days', exp: 5.1, status: 'Follow-up', date: '2026-10-06', feedback: 'Candidate requested follow-up on 12 Oct regarding CTC bracket', remarks: 'Need manager approval for upper bracket' },

    // Oct 7
    { name: 'Manish Tiwari', phone: '+91 98230 11014', email: 'manish.t@cloud.io', pos: 'pos-3', cl: 'cl-3', rec: 'rec-3', loc: 'Hyderabad', src: 'Naukri', ctc: 14, ectc: 21, np: 'Immediate', exp: 3.8, status: 'Contacted', date: '2026-10-07', feedback: 'Outreach email and WhatsApp sent', remarks: 'Awaiting response' },
    { name: 'Bhavna Sharma', phone: '+91 98230 11015', email: 'bhavna.sharma@corp.in', pos: 'pos-2', cl: 'cl-1', rec: 'rec-1', loc: 'Bangalore', src: 'LinkedIn', ctc: 26, ectc: 38, np: '90 Days', exp: 8.5, status: 'Dropped', date: '2026-10-07', feedback: 'Candidate counter-offered and retained by current employer', remarks: 'Notice period 90 days was risky' },

    // Oct 8 (HISTORICAL BENCHMARK DATE REQUESTED BY USER)
    { name: 'Karthik Raja', phone: '+91 98230 11016', email: 'karthik.raja@dev.in', pos: 'pos-1', cl: 'cl-1', rec: 'rec-1', loc: 'Chennai / Bangalore', src: 'LinkedIn', ctc: 19, ectc: 27, np: '30 Days', exp: 5.4, status: 'Interview Scheduled', date: '2026-10-08', feedback: 'Technical Round 1 scheduled with Tech Lead for 14 Oct', remarks: 'Solid Go microservices background' },
    { name: 'Meghna Varma', phone: '+91 98230 11017', email: 'meghna.varma@fintech.io', pos: 'pos-4', cl: 'cl-2', rec: 'rec-2', loc: 'Mumbai', src: 'Naukri', ctc: 18, ectc: 26, np: '15 Days', exp: 5.2, status: 'Interview Completed', date: '2026-10-08', feedback: 'Panel recommended for final HR discussion', remarks: 'Quick joiner' },
    { name: 'Abhishek Pandey', phone: '+91 98230 11018', email: 'abhishek.p@gmail.com', pos: 'pos-5', cl: 'cl-4', rec: 'rec-4', loc: 'Delhi NCR', src: 'Direct', ctc: 22, ectc: 32, np: '30 Days', exp: 6.0, status: 'Selected', date: '2026-10-08', feedback: 'Selected for Senior Data Engineer position at HealthPulse', remarks: 'Client SPOC Dr. Kabir approved' },
    { name: 'Shweta Murthy', phone: '+91 98230 11019', email: 'shweta.m@gmail.com', pos: 'pos-6', cl: 'cl-5', rec: 'rec-4', loc: 'Pune', src: 'Referral', ctc: 21, ectc: 29, np: '30 Days', exp: 5.8, status: 'Interested', date: '2026-10-08', feedback: 'Profile submitted to OmniRetail hiring manager', remarks: 'Portfolio reviewed positive' },
    { name: 'Siddhesh Parab', phone: '+91 98230 11020', email: 'siddhesh.p@yahoo.com', pos: 'pos-3', cl: 'cl-3', rec: 'rec-3', loc: 'Hyderabad', src: 'LinkedIn', ctc: 16, ectc: 24, np: '45 Days', exp: 4.2, status: 'Sourced', date: '2026-10-08', feedback: 'Profile shortlisted from search boolean query', remarks: 'Kubernetes certified' },

    // Oct 9
    { name: 'Harshita Dave', phone: '+91 98230 11021', email: 'harshita.d@gmail.com', pos: 'pos-2', cl: 'cl-1', rec: 'rec-1', loc: 'Bangalore', src: 'LinkedIn', ctc: 25, ectc: 35, np: '30 Days', exp: 7.2, status: 'Interview Scheduled', date: '2026-10-09', feedback: 'System architecture round scheduled for 15 Oct', remarks: 'Strong React 19 knowledge' },
    { name: 'Raghavan R.', phone: '+91 98230 11022', email: 'raghavan.r@gmail.com', pos: 'pos-1', cl: 'cl-1', rec: 'rec-1', loc: 'Bangalore', src: 'Naukri', ctc: 18, ectc: 25, np: '30 Days', exp: 4.9, status: 'Not Interested', date: '2026-10-09', feedback: 'Candidate currently pursuing higher education', remarks: 'Closed profile' },

    // Oct 10
    { name: 'Tushar Mathur', phone: '+91 98230 11023', email: 'tushar.m@cloud.com', pos: 'pos-3', cl: 'cl-3', rec: 'rec-3', loc: 'Hyderabad', src: 'LinkedIn', ctc: 18, ectc: 27, np: '30 Days', exp: 5.1, status: 'Connected', date: '2026-10-10', feedback: 'Spoke regarding CloudScale opening. Interested in JD', remarks: 'CV received on WhatsApp' },
    { name: 'Zoya Khan', phone: '+91 98230 11024', email: 'zoya.khan@gmail.com', pos: 'pos-4', cl: 'cl-2', rec: 'rec-2', loc: 'Mumbai', src: 'Portal', ctc: 17, ectc: 24, np: 'Immediate', exp: 4.5, status: 'Follow-up', date: '2026-10-10', feedback: 'Call scheduled on 12 Oct for salary expectations alignment', remarks: 'Wants remote flexibility' },

    // Oct 11 (TODAY)
    { name: 'Vivek Singhal', phone: '+91 98230 11025', email: 'vivek.singhal@tech.org', pos: 'pos-1', cl: 'cl-1', rec: 'rec-1', loc: 'Bangalore', src: 'LinkedIn', ctc: 21, ectc: 30, np: '30 Days', exp: 5.9, status: 'Sourced', date: '2026-10-11', feedback: 'Identified via Recruiter search query', remarks: 'Specializes in distributed transaction logging' },
    { name: 'Ankita Sen', phone: '+91 98230 11026', email: 'ankita.sen@gmail.com', pos: 'pos-5', cl: 'cl-4', rec: 'rec-4', loc: 'Delhi NCR', src: 'Referral', ctc: 23, ectc: 33, np: '15 Days', exp: 6.5, status: 'Interested', date: '2026-10-11', feedback: 'Shared resume with HealthPulse hiring manager', remarks: 'Internal employee referral' },
    { name: 'Pranav Joshi', phone: '+91 98230 11027', email: 'pranav.j@corp.com', pos: 'pos-3', cl: 'cl-3', rec: 'rec-3', loc: 'Hyderabad', src: 'LinkedIn', ctc: 16, ectc: 23, np: '30 Days', exp: 4.0, status: 'Pending', date: '2026-10-11', feedback: 'Pending client evaluation feedback on test submission', remarks: 'Awaiting feedback' }
  ];

  const insertCand = db.prepare(`
    INSERT INTO candidates (
      id, name, phone, email, position_id, client_id, recruiter_id,
      location, source, current_ctc, expected_ctc, notice_period,
      experience, status, feedback, remarks, created_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const candIds = [];
  candidateSeeds.forEach((c) => {
    const id = uuidv4();
    candIds.push({ id, ...c });
    insertCand.run(
      id, c.name, c.phone, c.email, c.pos, c.cl, c.rec,
      c.loc, c.src, c.ctc, c.ectc, c.np,
      c.exp, c.status, c.feedback, c.remarks, c.date
    );
  });

  // 6. Activities & Touchpoints
  const insertAct = db.prepare(`
    INSERT INTO activities (id, candidate_id, recruiter_id, type, notes, activity_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  candIds.forEach(c => {
    insertAct.run(
      uuidv4(), c.id, c.rec,
      c.status.includes('Interview') ? 'Interview Scheduled' : (c.status === 'Joined' ? 'Status Change' : 'Screening'),
      `Candidate activity: ${c.remarks || c.feedback || 'Outreach logged'}`,
      c.date
    );
  });

  // 7. Populate Daily Operational Entries for October 1 through October 11
  // This allows recruiters to track granular breakdown per day
  const insertDailyEntry = db.prepare(`
    INSERT INTO daily_mis_entries (
      id, mis_date, recruiter_id, position_id, client_id,
      sourced, contacted, connected, interested, not_interested,
      follow_up, interview_scheduled, interview_completed, selected,
      rejected, joined, dropped, pending, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Daily distributions across October
  const dates = [
    '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05',
    '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'
  ];

  dates.forEach((d, idx) => {
    // Generate realistic daily entry per recruiter
    recruiters.forEach((r, rIdx) => {
      const pos = positions[(idx + rIdx) % positions.length];
      const sourcedCount = 8 + (idx * 2) + (rIdx * 3);
      const contactedCount = Math.round(sourcedCount * 0.85);
      const connectedCount = Math.round(contactedCount * 0.7);
      const interestedCount = Math.round(connectedCount * 0.6);
      const notInterestedCount = connectedCount - interestedCount;
      const followUpCount = 2 + (idx % 3);
      const interviewSched = (idx + rIdx) % 3 === 0 ? 2 : 1;
      const interviewComp = (idx + rIdx) % 2 === 0 ? 1 : 0;
      const selected = (idx === 7 || idx === 8) ? 1 : ((idx % 4 === 0) ? 1 : 0);
      const joined = (idx === 0 || idx === 4 || idx === 9) ? 1 : 0;
      const rejected = (idx % 3 === 0) ? 1 : 0;
      const dropped = (idx === 6) ? 1 : 0;
      const pending = 2 + (rIdx % 2);

      insertDailyEntry.run(
        uuidv4(), d, r.id, pos.id, pos.client_id,
        sourcedCount, contactedCount, connectedCount, interestedCount, notInterestedCount,
        followUpCount, interviewSched, interviewComp, selected, rejected, joined, dropped, pending,
        `Daily operational recruitment log for ${r.name} on ${d}`
      );
    });
  });

  // 8. CRITICAL: FREEZE PERMANENT HISTORICAL SNAPSHOTS
  // Snapshot for Oct 1 to Oct 10 are FROZEN and permanently preserved!
  // Oct 8 is permanently locked as the historical benchmark!
  console.log('Generating and freezing permanent historical snapshots for 2026-10-01 through 2026-10-10...');

  for (let i = 0; i <= 9; i++) {
    const d = dates[i];
    const isBenchmark = (d === '2026-10-08');
    const status = isBenchmark ? 'Locked' : 'Finalized';
    const notes = isBenchmark
      ? 'Historical Benchmark Snapshot: 08 October 2026. Permanent Point-in-Time Record.'
      : `Day-end finalized snapshot for ${d}`;

    SnapshotService.createOrFreezeSnapshot(d, {
      user: 'Administrator (Aditya Sharma)',
      notes,
      status
    });
  }

  // Also create a Live/Draft snapshot for today (2026-10-11)
  SnapshotService.createOrFreezeSnapshot('2026-10-11', {
    user: 'Administrator (Aditya Sharma)',
    notes: "Today's ongoing operational MIS snapshot",
    status: 'Draft'
  });

  // 9. Initial Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, action, entity_type, entity_id, user_name, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertAudit.run(uuidv4(), 'SYSTEM_INIT', 'System', 'sys-1', 'Aditya Sharma', 'System initialized with demo dataset and historical snapshots', '-10 days');
  insertAudit.run(uuidv4(), 'SNAPSHOT_FREEZE', 'Snapshot', 'snap-2026-10-08', 'Aditya Sharma', 'Historical snapshot for 2026-10-08 LOCKED and permanently archived', '-3 days');
  insertAudit.run(uuidv4(), 'STATUS_CHANGE', 'Candidate', candIds[0].id, 'Priya Verma', 'Candidate Arjun Nambiar status transitioned to Joined', '-1 days');
  insertAudit.run(uuidv4(), 'EXPORT', 'Export', 'exp-1', 'Neha Kapoor', 'Generated Weekly MIS PDF Report for Oct 01 - Oct 08', '-2 days');

  console.log('Database seeded successfully with rich historical data and snapshots!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
