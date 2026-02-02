import { query, queryOne } from '../database/db';
import { Recommendation } from '../types';

async function computeRecommendations(): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const currentDate = '2025-12-31';

  // ==================== 1. Focus on Aging Enterprise Deals ====================
  const enterpriseStaleDeals = await queryOne<{ count: number; total_amount: number }>(`
    SELECT COUNT(*) as count, COALESCE(SUM(d.amount), 0) as total_amount
    FROM deals d
    JOIN accounts a ON d.account_id = a.account_id
    WHERE a.segment = 'Enterprise'
      AND d.stage NOT IN ('Closed Won', 'Closed Lost')
      AND JULIANDAY(?) - JULIANDAY(d.created_at) > 30
  `, [currentDate]);

  if (enterpriseStaleDeals && enterpriseStaleDeals.count > 5) {
    recommendations.push({
      id: 'focus-enterprise-deals',
      priority: 'high',
      category: 'deals',
      title: 'Focus on aging deals in Enterprise segment',
      description: `${enterpriseStaleDeals.count} Enterprise deals are stuck for over 30 days with potential value of $${(enterpriseStaleDeals.total_amount / 1000).toFixed(0)}K. Schedule executive reviews to unblock these opportunities.`,
      impactMetric: `$${(enterpriseStaleDeals.total_amount / 1000).toFixed(0)}K potential revenue`
    });
  }

  // ==================== 2. Coach Underperforming Reps ====================
  const repPerformance = await queryOne<{ rep_id: string; name: string; won: number; total: number; win_rate: number }>(`
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
    LIMIT 1
  `);

  // Get team average
  const teamStats = await queryOne<{ avg_win_rate: number }>(`
    SELECT 
      COUNT(CASE WHEN stage = 'Closed Won' THEN 1 END) * 100.0 / 
      NULLIF(COUNT(CASE WHEN stage IN ('Closed Won', 'Closed Lost') THEN 1 END), 0) as avg_win_rate
    FROM deals
  `);

  if (repPerformance && teamStats && repPerformance.win_rate < (teamStats.avg_win_rate || 0) * 0.8) {
    recommendations.push({
      id: 'coach-underperforming-rep',
      priority: 'high',
      category: 'reps',
      title: `Coach ${repPerformance.name} to improve closing skills`,
      description: `${repPerformance.name}'s win rate (${Math.round(repPerformance.win_rate)}%) is significantly below team average (${Math.round(teamStats.avg_win_rate || 0)}%). Schedule weekly 1:1 coaching sessions focusing on objection handling and negotiation.`,
      impactMetric: `+${Math.round((teamStats.avg_win_rate || 0) - repPerformance.win_rate)}% win rate improvement potential`
    });
  }

  // ==================== 3. Increase Activity for Inactive Accounts ====================
  const inactiveAccountsBySegment = await queryOne<{ segment: string; count: number }>(`
    SELECT 
      a.segment,
      COUNT(DISTINCT a.account_id) as count
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
    GROUP BY a.segment
    ORDER BY count DESC
    LIMIT 1
  `, [currentDate]);

  if (inactiveAccountsBySegment && inactiveAccountsBySegment.count > 5) {
    recommendations.push({
      id: 'increase-activity-segment',
      priority: 'medium',
      category: 'accounts',
      title: `Increase outreach to inactive ${inactiveAccountsBySegment.segment} accounts`,
      description: `${inactiveAccountsBySegment.count} ${inactiveAccountsBySegment.segment} accounts with open deals have had no activity in 30+ days. Create a re-engagement campaign with personalized messaging.`,
      impactMetric: `${inactiveAccountsBySegment.count} accounts to re-engage`
    });
  }

  // ==================== 4. Pipeline Health Check ====================
  const pipelineByStage = await query<{ stage: string; count: number; total_amount: number }>(`
    SELECT 
      stage,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_amount
    FROM deals
    WHERE stage NOT IN ('Closed Won', 'Closed Lost')
    GROUP BY stage
  `);

  const prospectingDeals = pipelineByStage.find(p => p.stage === 'Prospecting');
  const negotiationDeals = pipelineByStage.find(p => p.stage === 'Negotiation');

  if (prospectingDeals && negotiationDeals && prospectingDeals.count < negotiationDeals.count) {
    recommendations.push({
      id: 'accelerate-prospecting',
      priority: 'medium',
      category: 'pipeline',
      title: 'Accelerate prospecting efforts',
      description: `Pipeline is top-heavy with ${negotiationDeals.count} deals in Negotiation but only ${prospectingDeals.count} in Prospecting. Increase outbound activities to maintain healthy pipeline coverage.`,
      impactMetric: `Need ${negotiationDeals.count - prospectingDeals.count}+ new prospects`
    });
  }

  // ==================== 5. Sales Cycle Optimization ====================
  const longCycleDeals = await queryOne<{ count: number; total_amount: number }>(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
    FROM deals
    WHERE stage = 'Negotiation'
      AND JULIANDAY(?) - JULIANDAY(created_at) > 60
  `, [currentDate]);

  if (longCycleDeals && longCycleDeals.count > 10) {
    recommendations.push({
      id: 'streamline-negotiation',
      priority: 'medium',
      category: 'deals',
      title: 'Streamline negotiation process',
      description: `${longCycleDeals.count} deals have been in Negotiation for over 60 days. Review pricing approval workflows and empower reps with more flexibility on standard terms.`,
      impactMetric: `$${(longCycleDeals.total_amount / 1000).toFixed(0)}K at stake`
    });
  }

  // ==================== 6. Industry Focus ====================
  const industryPerformance = await queryOne<{ industry: string; won: number; total: number; revenue: number }>(`
    SELECT 
      a.industry,
      COUNT(CASE WHEN d.stage = 'Closed Won' THEN 1 END) as won,
      COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END) as total,
      COALESCE(SUM(CASE WHEN d.stage = 'Closed Won' THEN d.amount ELSE 0 END), 0) as revenue
    FROM accounts a
    JOIN deals d ON a.account_id = d.account_id
    GROUP BY a.industry
    HAVING total >= 10
    ORDER BY 
      CASE WHEN total > 0 THEN won * 1.0 / total ELSE 0 END DESC
    LIMIT 1
  `);

  if (industryPerformance) {
    const winRate = industryPerformance.total > 0 
      ? (industryPerformance.won / industryPerformance.total) * 100 
      : 0;
    
    recommendations.push({
      id: 'industry-focus',
      priority: 'low',
      category: 'pipeline',
      title: `Double down on ${industryPerformance.industry} vertical`,
      description: `${industryPerformance.industry} has your highest win rate (${Math.round(winRate)}%). Consider allocating more marketing budget and SDR capacity to this vertical.`,
      impactMetric: `${Math.round(winRate)}% win rate`
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Return top 5 recommendations
  return recommendations.slice(0, 5);
}

export async function getRecommendations(): Promise<Recommendation[]> {
  return computeRecommendations();
}
