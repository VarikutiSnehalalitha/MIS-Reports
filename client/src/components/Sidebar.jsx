import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  GitCompare,
  TrendingUp,
  Users,
  Briefcase,
  Building2,
  UserCheck,
  CalendarCheck,
  Clock,
  History,
  FileSpreadsheet
} from 'lucide-react';

export default function Sidebar({ activeNav, setActiveNav, currentUser, setCurrentUser }) {
  const navSections = [
    {
      title: 'MIS Operations',
      items: [
        { id: 'dashboard', label: "Daily MIS Dashboard", icon: LayoutDashboard },
        { id: 'calendar', label: 'Historical Calendar', icon: CalendarDays },
        { id: 'compare', label: 'Compare Two Dates', icon: GitCompare },
        { id: 'reports', label: 'Weekly & Monthly MIS', icon: TrendingUp }
      ]
    },
    {
      title: 'Talent & Pipelines',
      items: [
        { id: 'candidates', label: 'Candidate Database', icon: Users },
        { id: 'interviews', label: 'Interview Tracking', icon: CalendarCheck },
        { id: 'followups', label: 'Pending Follow-ups', icon: Clock },
        { id: 'submissions', label: 'Client Feedback', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'Organization Master',
      items: [
        { id: 'positions', label: 'Positions & Openings', icon: Briefcase },
        { id: 'clients', label: 'Clients & Accounts', icon: Building2 },
        { id: 'recruiters', label: 'Recruiter Performance', icon: UserCheck }
      ]
    },
    {
      title: 'System & Security',
      items: [
        { id: 'audit', label: 'Audit & Change Logs', icon: History }
      ]
    }
  ];

  const handleRoleToggle = () => {
    // Switch between Admin, Manager, Recruiter for easy live testing
    const roles = [
      { name: 'Aditya Sharma', email: 'aditya.sharma@talentmis.com', role: 'Admin', avatar: 'AS' },
      { name: 'Neha Kapoor', email: 'neha.kapoor@talentmis.com', role: 'Manager', avatar: 'NK' },
      { name: 'Priya Verma', email: 'priya.verma@talentmis.com', role: 'Recruiter', avatar: 'PV' }
    ];
    const currentIndex = roles.findIndex(r => r.role === currentUser.role);
    const nextUser = roles[(currentIndex + 1) % roles.length];
    setCurrentUser(nextUser);
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo-icon">MIS</div>
        <div>
          <div className="brand-title">Daily MIS System</div>
          <div className="brand-sub">Historical Operations</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <div className="nav-section-title">{sec.title}</div>
            {sec.items.map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveNav(item.id)}
                  style={{ width: '100%', border: 'none', textAlign: 'left', background: 'none' }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Profile & Role Switcher */}
      <div className="sidebar-footer">
        <div 
          className="user-profile-badge" 
          onClick={handleRoleToggle}
          title="Click to switch demo role (Admin / Manager / Recruiter)"
          style={{ cursor: 'pointer' }}
        >
          <div className="user-avatar">{currentUser.avatar || 'US'}</div>
          <div className="user-meta">
            <div className="user-name">{currentUser.name}</div>
            <div className="user-role">{currentUser.role} • Switch</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
