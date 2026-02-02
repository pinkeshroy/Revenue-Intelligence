import { query, queryOne } from '../database/db';
import { DriversResponse, DriverMetric } from '../types';

async function computeDrivers(): Promise<DriversResponse> {
  // Current period: Q4 2025 (Oct-Dec)
  const currentStart = '2025-10-01';
  const currentEnd = '2025-12-31';
  
  // Previous period: Q3 2025 (Jul-Sep)
  const prevStart = '2025-07-01';
  const prevEnd = '2025-09-30';

  // ==================== Pipeline Value ====================
  const currentPipelineResult = await queryOne<{ value: number }>(`
    SELECT COALESCE(SUM(amount), 0) as value
    FROM deals
    WHERE stage NOT IN ('Closed Won', 'Closed Lost')
      AND amount IS NOT NULL
  `);

  const prevPipelineResult = await queryOne<{ value: number }>(`
    SELECT COALESCE(SUM(amount), 0) as value
    FROM deals
    WHERE stage NOT IN ('Closed Won', 'Closed Lost')
      AND amount IS NOT NULL
      AND created_at <= ?
  `, [prevEnd]);

  // Get monthly pipeline trend (last 6 months)
  const pipelineTrend = await query<{ month: string; value: number }>(`
    SELECT 
      substr(created_at, 1, 7) as month,
      COALESCE(SUM(amount), 0) as value
    FROM deals
    WHERE stage NOT IN ('Closed Won', 'Closed Lost')
      AND amount IS NOT NULL
      AND created_at >= '2025-07-01'
    GROUP BY substr(created_at, 1, 7)
    ORDER BY month
  `);

  const currentPipeline = currentPipelineResult?.value || 0;
  const prevPipeline = prevPipelineResult?.value || 0;

  const pipelineValue: DriverMetric = {
    current: currentPipeline,
    change: currentPipeline - prevPipeline,
    changePercent: prevPipeline > 0 
      ? Math.round(((currentPipeline - prevPipeline) / prevPipeline) * 100 * 100) / 100
      : 0,
    trend: pipelineTrend.map(t => t.value),
    label: 'Pipeline Value'
  };

  // ==================== Win Rate ====================
  const currentWinRateResult = await queryOne<{ won: number; total: number }>(`
    SELECT 
      COUNT(CASE WHEN stage = 'Closed Won' THEN 1 END) as won,
      COUNT(CASE WHEN stage IN ('Closed Won', 'Closed Lost') THEN 1 END) as total
    FROM deals
    WHERE closed_at >= ? AND closed_at <= ?
  `, [currentStart, currentEnd]);

  const prevWinRateResult = await queryOne<{ won: number; total: number }>(`
    SELECT 
      COUNT(CASE WHEN stage = 'Closed Won' THEN 1 END) as won,
      COUNT(CASE WHEN stage IN ('Closed Won', 'Closed Lost') THEN 1 END) as total
    FROM deals
    WHERE closed_at >= ? AND closed_at <= ?
  `, [prevStart, prevEnd]);

  const currentWinRate = (currentWinRateResult?.total || 0) > 0 
    ? ((currentWinRateResult?.won || 0) / currentWinRateResult!.total) * 100 
    : 0;
  const prevWinRate = (prevWinRateResult?.total || 0) > 0 
    ? ((prevWinRateResult?.won || 0) / prevWinRateResult!.total) * 100 
    : 0;

  // Monthly win rate trend
  const winRateTrendData = await query<{ month: string; rate: number | null }>(`
    SELECT 
      substr(closed_at, 1, 7) as month,
      COUNT(CASE WHEN stage = 'Closed Won' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(CASE WHEN stage IN ('Closed Won', 'Closed Lost') THEN 1 END), 0) as rate
    FROM deals
    WHERE closed_at >= '2025-07-01'
      AND stage IN ('Closed Won', 'Closed Lost')
    GROUP BY substr(closed_at, 1, 7)
    ORDER BY month
  `);

  const winRate: DriverMetric = {
    current: Math.round(currentWinRate * 100) / 100,
    change: Math.round((currentWinRate - prevWinRate) * 100) / 100,
    changePercent: prevWinRate > 0 
      ? Math.round(((currentWinRate - prevWinRate) / prevWinRate) * 100 * 100) / 100
      : 0,
    trend: winRateTrendData.map(t => Math.round((t.rate || 0) * 100) / 100),
    label: 'Win Rate'
  };

  // ==================== Average Deal Size ====================
  const currentAvgDealResult = await queryOne<{ avg_amount: number }>(`
    SELECT COALESCE(AVG(amount), 0) as avg_amount
    FROM deals
    WHERE stage = 'Closed Won'
      AND amount IS NOT NULL
      AND closed_at >= ? AND closed_at <= ?
  `, [currentStart, currentEnd]);

  const prevAvgDealResult = await queryOne<{ avg_amount: number }>(`
    SELECT COALESCE(AVG(amount), 0) as avg_amount
    FROM deals
    WHERE stage = 'Closed Won'
      AND amount IS NOT NULL
      AND closed_at >= ? AND closed_at <= ?
  `, [prevStart, prevEnd]);

  // Monthly average deal size trend
  const avgDealTrendData = await query<{ month: string; avg_amount: number }>(`
    SELECT 
      substr(closed_at, 1, 7) as month,
      COALESCE(AVG(amount), 0) as avg_amount
    FROM deals
    WHERE stage = 'Closed Won'
      AND amount IS NOT NULL
      AND closed_at >= '2025-07-01'
    GROUP BY substr(closed_at, 1, 7)
    ORDER BY month
  `);

  const currentAvg = currentAvgDealResult?.avg_amount || 0;
  const prevAvg = prevAvgDealResult?.avg_amount || 0;

  const avgDealSize: DriverMetric = {
    current: Math.round(currentAvg),
    change: Math.round(currentAvg - prevAvg),
    changePercent: prevAvg > 0 
      ? Math.round(((currentAvg - prevAvg) / prevAvg) * 100 * 100) / 100
      : 0,
    trend: avgDealTrendData.map(t => Math.round(t.avg_amount)),
    label: 'Avg Deal Size'
  };

  // ==================== Sales Cycle Time ====================
  const currentCycleResult = await queryOne<{ avg_days: number }>(`
    SELECT COALESCE(AVG(JULIANDAY(closed_at) - JULIANDAY(created_at)), 0) as avg_days
    FROM deals
    WHERE stage = 'Closed Won'
      AND closed_at IS NOT NULL
      AND closed_at >= ? AND closed_at <= ?
  `, [currentStart, currentEnd]);

  const prevCycleResult = await queryOne<{ avg_days: number }>(`
    SELECT COALESCE(AVG(JULIANDAY(closed_at) - JULIANDAY(created_at)), 0) as avg_days
    FROM deals
    WHERE stage = 'Closed Won'
      AND closed_at IS NOT NULL
      AND closed_at >= ? AND closed_at <= ?
  `, [prevStart, prevEnd]);

  // Monthly sales cycle trend
  const cycleTrendData = await query<{ month: string; avg_days: number }>(`
    SELECT 
      substr(closed_at, 1, 7) as month,
      COALESCE(AVG(JULIANDAY(closed_at) - JULIANDAY(created_at)), 0) as avg_days
    FROM deals
    WHERE stage = 'Closed Won'
      AND closed_at IS NOT NULL
      AND closed_at >= '2025-07-01'
    GROUP BY substr(closed_at, 1, 7)
    ORDER BY month
  `);

  const currentCycle = currentCycleResult?.avg_days || 0;
  const prevCycle = prevCycleResult?.avg_days || 0;

  const salesCycle: DriverMetric = {
    current: Math.round(currentCycle),
    change: Math.round(currentCycle - prevCycle),
    changePercent: prevCycle > 0 
      ? Math.round(((currentCycle - prevCycle) / prevCycle) * 100 * 100) / 100
      : 0,
    trend: cycleTrendData.map(t => Math.round(t.avg_days)),
    label: 'Sales Cycle'
  };

  return {
    pipelineValue,
    winRate,
    avgDealSize,
    salesCycle
  };
}

export async function getDrivers(): Promise<DriversResponse> {
  return computeDrivers();
}
