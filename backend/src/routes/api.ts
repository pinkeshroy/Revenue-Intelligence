import { Router } from 'express';
import { getSummary } from '../services/summaryService';
import { getDrivers } from '../services/driversService';
import { getRiskFactors } from '../services/riskService';
import { getRecommendations } from '../services/recommendationsService';

const router = Router();

// GET /api/summary - Current Quarter Summary
router.get('/summary', async (req, res) => {
  try {
    const summary = await getSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /api/drivers - Revenue Drivers
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await getDrivers();
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET /api/risk-factors - Top Risk Factors
router.get('/risk-factors', async (req, res) => {
  try {
    const riskFactors = await getRiskFactors();
    res.json(riskFactors);
  } catch (error) {
    console.error('Error fetching risk factors:', error);
    res.status(500).json({ error: 'Failed to fetch risk factors' });
  }
});

// GET /api/recommendations - Actionable Recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await getRecommendations();
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
