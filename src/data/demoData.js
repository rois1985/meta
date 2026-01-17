export const demoUser = {
  id: 'usr_demo_001',
  name: 'Sarah Johnson',
  email: 'sarah@acmefinancial.com',
  avatar: null,
  initials: 'SJ',
  company: 'Acme Financial Services',
  role: 'Marketing Director',
  plan: 'Professional',
  scansRemaining: 423,
  scansLimit: 500,
  joinedAt: '2024-09-15',
};

export const demoTeam = [
  { id: 'usr_001', name: 'Sarah Johnson', email: 'sarah@acmefinancial.com', role: 'Admin', initials: 'SJ' },
  { id: 'usr_002', name: 'Michael Chen', email: 'michael@acmefinancial.com', role: 'Editor', initials: 'MC' },
  { id: 'usr_003', name: 'Emily Rodriguez', email: 'emily@acmefinancial.com', role: 'Editor', initials: 'ER' },
  { id: 'usr_004', name: 'James Wilson', email: 'james@acmefinancial.com', role: 'Viewer', initials: 'JW' },
  { id: 'usr_005', name: 'Lisa Thompson', email: 'lisa@acmefinancial.com', role: 'Editor', initials: 'LT' },
  { id: 'usr_006', name: 'David Park', email: 'david@acmefinancial.com', role: 'Viewer', initials: 'DP' },
  { id: 'usr_007', name: 'Anna Martinez', email: 'anna@acmefinancial.com', role: 'Compliance', initials: 'AM' },
  { id: 'usr_008', name: 'Robert Taylor', email: 'robert@acmefinancial.com', role: 'Viewer', initials: 'RT' },
];

export const demoScans = [
  {
    id: 'scan_001',
    name: 'Q4 Investment Portfolio Campaign',
    type: 'image',
    status: 'passed',
    score: 98,
    date: '2025-01-12T18:30:00Z',
    regulations: ['FCA', 'SEC'],
    createdBy: 'Sarah Johnson',
  },
  {
    id: 'scan_002',
    name: 'Mobile Trading App Banner',
    type: 'image',
    status: 'warning',
    score: 76,
    date: '2025-01-12T14:15:00Z',
    regulations: ['FCA', 'FINRA'],
    createdBy: 'Michael Chen',
    issues: ['Risk warning font size too small', 'Missing past performance disclaimer'],
  },
  {
    id: 'scan_003',
    name: 'Fixed Rate Mortgage Email',
    type: 'text',
    status: 'passed',
    score: 94,
    date: '2025-01-11T16:45:00Z',
    regulations: ['FCA', 'ASA'],
    createdBy: 'Emily Rodriguez',
  },
  {
    id: 'scan_004',
    name: 'Crypto Exchange Social Ad',
    type: 'image',
    status: 'failed',
    score: 42,
    date: '2025-01-11T11:20:00Z',
    regulations: ['FCA', 'SEC', 'FINRA'],
    createdBy: 'James Wilson',
    issues: ['Missing risk warning', 'Unsubstantiated return claims', 'No regulatory disclosure'],
  },
  {
    id: 'scan_005',
    name: 'High-Yield Savings Account Promo',
    type: 'text',
    status: 'passed',
    score: 100,
    date: '2025-01-10T09:30:00Z',
    regulations: ['FCA'],
    createdBy: 'Lisa Thompson',
  },
  {
    id: 'scan_006',
    name: 'Retirement Planning Webinar Ad',
    type: 'video',
    status: 'passed',
    score: 91,
    date: '2025-01-10T08:00:00Z',
    regulations: ['SEC', 'FINRA'],
    createdBy: 'Sarah Johnson',
  },
  {
    id: 'scan_007',
    name: 'Credit Card Rewards Campaign',
    type: 'image',
    status: 'warning',
    score: 82,
    date: '2025-01-09T15:45:00Z',
    regulations: ['FCA', 'ASA'],
    createdBy: 'Michael Chen',
    issues: ['APR disclosure needs prominence'],
  },
  {
    id: 'scan_008',
    name: 'Business Loan Calculator Landing',
    type: 'text',
    status: 'passed',
    score: 96,
    date: '2025-01-09T10:20:00Z',
    regulations: ['FCA'],
    createdBy: 'Emily Rodriguez',
  },
  {
    id: 'scan_009',
    name: 'Stock Trading Platform Video',
    type: 'video',
    status: 'failed',
    score: 38,
    date: '2025-01-08T14:00:00Z',
    regulations: ['SEC', 'FINRA'],
    createdBy: 'David Park',
    issues: ['Misleading performance claims', 'No risk disclosure', 'Implied guaranteed returns'],
  },
  {
    id: 'scan_010',
    name: 'Insurance Quote Comparison Ad',
    type: 'image',
    status: 'passed',
    score: 89,
    date: '2025-01-08T09:15:00Z',
    regulations: ['FCA', 'ASA'],
    createdBy: 'Anna Martinez',
  },
  {
    id: 'scan_011',
    name: 'Pension Transfer Guide',
    type: 'text',
    status: 'warning',
    score: 71,
    date: '2025-01-07T16:30:00Z',
    regulations: ['FCA'],
    createdBy: 'Robert Taylor',
    issues: ['Insufficient risk warnings for pension transfers', 'Missing FCA registration number'],
  },
  {
    id: 'scan_012',
    name: 'ISA Product Launch Email',
    type: 'text',
    status: 'passed',
    score: 97,
    date: '2025-01-07T11:00:00Z',
    regulations: ['FCA', 'ASA'],
    createdBy: 'Sarah Johnson',
  },
];

export const demoStats = {
  totalScans: 1247,
  totalScansChange: '+12%',
  passRate: 87,
  passRateChange: '+3%',
  avgScore: 91,
  avgScoreChange: '+5',
  teamMembers: 8,
  teamMembersChange: '+2',
  scansThisMonth: 156,
  scansLastMonth: 139,
  topIssues: [
    { name: 'Risk Warning Issues', count: 45 },
    { name: 'Missing Disclaimers', count: 32 },
    { name: 'Unsubstantiated Claims', count: 28 },
    { name: 'Font Size Compliance', count: 19 },
    { name: 'Missing Contact Info', count: 12 },
  ],
  scansByRegulation: [
    { name: 'FCA', count: 892 },
    { name: 'SEC', count: 456 },
    { name: 'FINRA', count: 312 },
    { name: 'ASA', count: 245 },
    { name: 'MiFID II', count: 89 },
  ],
  recentActivity: [
    { action: 'Scan completed', target: 'Q4 Investment Portfolio Campaign', user: 'Sarah Johnson', time: '2 hours ago' },
    { action: 'Scan completed', target: 'Mobile Trading App Banner', user: 'Michael Chen', time: '5 hours ago' },
    { action: 'Team member added', target: 'Robert Taylor', user: 'Sarah Johnson', time: 'Yesterday' },
    { action: 'Scan completed', target: 'Fixed Rate Mortgage Email', user: 'Emily Rodriguez', time: 'Yesterday' },
    { action: 'Settings updated', target: 'Notification preferences', user: 'Sarah Johnson', time: '2 days ago' },
  ],
};

export const demoCredentials = {
  email: 'marketing@forexcounty.com',
  password: 'demo123',
};

export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
