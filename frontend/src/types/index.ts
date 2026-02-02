// API Response types (matching backend types)
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
