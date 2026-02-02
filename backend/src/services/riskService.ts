import { query, queryOne } from '../database/db';
import { RiskFactor } from '../types';

async function computeRiskFactors(): Promise<RiskFactor[]> {
  const riskFactors: RiskFactor[] = [];
  const currentDate = '2025-12-31'; // End of our data period

  // ==================== 1. Stale Deals (deals stuck > 30 days) ====================
  const staleDealsResult = await query<{ segment: string; count: number; total_amount: number }>(`
    SELECT 
      a.segment,
      COUNT(*) as count,
      COALESCE(SUM(d.amount), 0) as total_amount
    FROM deals d
    JOIN accounts a ON d.account_id = a.account_id
    WHERE d.stage NOT IN ('Closed Won', 'Closed Lost')
      AND JULIANDAY(?) - JULIANDAY(d.created_at) > 30
    GROUP BY a.segment
    ORDER BY count DESC
  `, [currentDate]);

  // Find the segment with most stale deals
  if (staleDealsResult.length > 0) {
    const topStaleSegment = staleDealsResult[0];
    const totalStaleDeals = staleDealsResult.reduce((sum, r) => sum + r.count, 0);
    
    riskFactors.push({
      id: 'stale-deals-enterprise',
      type: 'stale_deals',
      description: `${totalStaleDeals} ${topStaleSegment.segment} deals stuck over 30 days`,
      severity: totalStaleDeals > 20 ? 'high' : totalStaleDeals > 10 ? 'medium' : 'low',
      count: totalStaleDeals
    });
  }

  // ==================== 2. Underperforming Reps ====================
  const repPerformance = await query<{ rep_id: string; name: string; won: number; total: number; win_rate: number }>(`
    SELECT 
      r.rep_id,
      r.name,
      COUNT(CASE WHEN d.stage = 'Closed Won' THEN 1 END) as won,
      COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END) as total,
      CASE 
        WHEN COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END) > 0 
        THEN COUNT(CASE WHEN d.stage = 'Closed Won' THEN 1 END) * 100.0 / 
             COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END)
        ELSE 0 
      END as win_rate
    FROM reps r
    LEFT JOIN deals d ON r.rep_id = d.rep_id
    GROUP BY r.rep_id, r.name
    HAVING total >= 5
    ORDER BY win_rate ASC
  `);

  if (repPerformance.length > 0) {
    // Calculate team average
    const totalWon = repPerformance.reduce((sum, r) => sum + r.won, 0);
    const totalDeals = repPerformance.reduce((sum, r) => sum + r.total, 0);
    const teamAvgWinRate = totalDeals > 0 ? (totalWon / totalDeals) * 100 : 0;

    // Find reps significantly below average (more than 20% below)
    const underperformers = repPerformance.filter(r => 
      r.total >= 5 && r.win_rate < teamAvgWinRate * 0.8
    );

    for (const rep of underperformers.slice(0, 2)) { // Top 2 underperformers
      riskFactors.push({
        id: `underperforming-rep-${rep.rep_id}`,
        type: 'underperforming_rep',
        description: `Rep ${rep.name} - Win Rate: ${Math.round(rep.win_rate)}%`,
        severity: rep.win_rate < teamAvgWinRate * 0.6 ? 'high' : 'medium',
        repId: rep.rep_id,
        repName: rep.name,
        metric: Math.round(rep.win_rate)
      });
    }
  }

  // ==================== 3. Low Activity Accounts ====================
  const lowActivityResult = await queryOne<{ count: number }>(`
    SELECT COUNT(DISTINCT a.account_id) as count
    FROM accounts a
    JOIN deals d ON a.account_id = d.account_id
    WHERE d.stage NOT IN ('Closed Won', 'Closed Lost')
      AND a.account_id NOT IN (
        SELECT DISTINCT a2.account_id
        FROM accounts a2
        JOIN deals d2 ON a2.account_id = d2.account_id
        JOIN activities act ON d2.deal_id = act.deal_id
        WHERE JULIANDAY(?) - JULIANDAY(act.timestamp) <= 30
      )
  `, [currentDate]);

  if (lowActivityResult && lowActivityResult.count > 0) {
    riskFactors.push({
      id: 'low-activity-accounts',
      type: 'low_activity',
      description: `${lowActivityResult.count} Accounts with no recent activity`,
      severity: lowActivityResult.count > 15 ? 'high' : lowActivityResult.count > 8 ? 'medium' : 'low',
      count: lowActivityResult.count
    });
  }

  // ==================== 4. Additional Risk: Large Deals at Risk ====================
  const largeDealsAtRisk = await queryOne<{ count: number; total_amount: number }>(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
    FROM deals
    WHERE stage = 'Negotiation'
      AND amount > 50000
      AND JULIANDAY(?) - JULIANDAY(created_at) > 45
  `, [currentDate]);

  if (largeDealsAtRisk && largeDealsAtRisk.count > 0) {
    riskFactors.push({
      id: 'large-deals-at-risk',
      type: 'stale_deals',
      description: `${largeDealsAtRisk.count} large deals (>$50K) stuck in negotiation`,
      severity: largeDealsAtRisk.count > 5 ? 'high' : 'medium',
      count: largeDealsAtRisk.count
    });
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  riskFactors.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return riskFactors;
}

export async function getRiskFactors(): Promise<RiskFactor[]> {
  return computeRiskFactors();
}
