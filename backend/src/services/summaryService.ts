import { query, queryOne } from '../database/db';
import { SummaryResponse } from '../types';

interface QuarterInfo {
  year: number;
  quarter: number;
  startMonth: string;
  endMonth: string;
  label: string;
}

async function computeSummary(): Promise<SummaryResponse> {
  // Use Q4 2025 as current quarter (Oct-Dec 2025)
  const currentQuarter: QuarterInfo = {
    year: 2025,
    quarter: 4,
    startMonth: '2025-10',
    endMonth: '2025-12',
    label: 'Q4 2025'
  };
  
  const previousQuarter: QuarterInfo = {
    year: 2025,
    quarter: 3,
    startMonth: '2025-07',
    endMonth: '2025-09',
    label: 'Q3 2025'
  };

  // Get current quarter revenue (Closed Won deals with closed_at in quarter)
  const currentRevenueResult = await queryOne<{ revenue: number }>(`
    SELECT COALESCE(SUM(amount), 0) as revenue
    FROM deals
    WHERE stage = 'Closed Won'
      AND closed_at >= ?
      AND closed_at <= ?
      AND amount IS NOT NULL
  `, [`${currentQuarter.startMonth}-01`, `${currentQuarter.endMonth}-31`]);

  const currentQuarterRevenue = currentRevenueResult?.revenue || 0;

  // Get previous quarter revenue for QoQ change
  const prevRevenueResult = await queryOne<{ revenue: number }>(`
    SELECT COALESCE(SUM(amount), 0) as revenue
    FROM deals
    WHERE stage = 'Closed Won'
      AND closed_at >= ?
      AND closed_at <= ?
      AND amount IS NOT NULL
  `, [`${previousQuarter.startMonth}-01`, `${previousQuarter.endMonth}-31`]);

  const previousQuarterRevenue = prevRevenueResult?.revenue || 0;

  // Get target for current quarter
  const targetResult = await queryOne<{ total_target: number }>(`
    SELECT COALESCE(SUM(target), 0) as total_target
    FROM targets
    WHERE month >= ? AND month <= ?
  `, [currentQuarter.startMonth, currentQuarter.endMonth]);

  const target = targetResult?.total_target || 0;

  // Calculate gap percentage
  const gapPercentage = target > 0 
    ? ((currentQuarterRevenue - target) / target) * 100 
    : 0;

  // Calculate QoQ change
  const qoqChange = previousQuarterRevenue > 0 
    ? ((currentQuarterRevenue - previousQuarterRevenue) / previousQuarterRevenue) * 100 
    : null;

  // Get monthly revenue data for the trend chart (last 6 months)
  const monthlyData = await query<{ month: string; revenue: number }>(`
    SELECT 
      substr(closed_at, 1, 7) as month,
      COALESCE(SUM(amount), 0) as revenue
    FROM deals
    WHERE stage = 'Closed Won'
      AND closed_at IS NOT NULL
      AND amount IS NOT NULL
      AND closed_at >= '2025-07-01'
    GROUP BY substr(closed_at, 1, 7)
    ORDER BY month
  `);

  // Get targets for the same period
  const targetData = await query<{ month: string; target: number }>(`
    SELECT month, target
    FROM targets
    WHERE month >= '2025-07'
    ORDER BY month
  `);

  // Merge monthly data with targets
  const monthlyRevenue = targetData.map(t => {
    const revenueRow = monthlyData.find(r => r.month === t.month);
    return {
      month: t.month,
      revenue: revenueRow?.revenue || 0,
      target: t.target
    };
  });

  return {
    currentQuarterRevenue,
    target,
    gapPercentage: Math.round(gapPercentage * 100) / 100,
    quarterLabel: currentQuarter.label,
    qoqChange: qoqChange !== null ? Math.round(qoqChange * 100) / 100 : null,
    monthlyRevenue
  };
}

export async function getSummary(): Promise<SummaryResponse> {
  return computeSummary();
}
