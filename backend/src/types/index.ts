// Database entity types
export interface Account {
  account_id: string;
  name: string;
  industry: string;
  segment: 'SMB' | 'Mid-Market' | 'Enterprise';
}

export interface Rep {
  rep_id: string;
  name: string;
}

export interface Deal {
  deal_id: string;
  account_id: string;
  rep_id: string;
  stage: 'Prospecting' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  amount: number | null;
  created_at: string;
  closed_at: string | null;
}

export interface Activity {
  activity_id: string;
  deal_id: string;
  type: 'call' | 'email' | 'demo';
  timestamp: string;
}

export interface Target {
  month: string;
  target: number;
}

// API Response types
export interface SummaryResponse {
  currentQuarterRevenue: number;
  target: number;
  gapPercentage: number;
  quarterLabel: string;
  qoqChange: number | null;
  monthlyRevenue: { month: string; revenue: number; target: number }[];
}

export interface DriverMetric {
  current: number;
  change: number;
  changePercent: number;
  trend: number[];
  label: string;
}

export interface DriversResponse {
  pipelineValue: DriverMetric;
  winRate: DriverMetric;
  avgDealSize: DriverMetric;
  salesCycle: DriverMetric;
}

export interface RiskFactor {
  id: string;
  type: 'stale_deals' | 'underperforming_rep' | 'low_activity';
  description: string;
  severity: 'high' | 'medium' | 'low';
  count?: number;
  repId?: string;
  repName?: string;
  metric?: number;
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'deals' | 'reps' | 'accounts' | 'pipeline';
  title: string;
  description: string;
  impactMetric: string;
}
