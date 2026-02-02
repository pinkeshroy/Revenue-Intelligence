import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SummaryBanner from './SummaryBanner';
import RevenueDrivers from './RevenueDrivers';
import RiskFactors from './RiskFactors';
import Recommendations from './Recommendations';
import RevenueTrendChart from './charts/RevenueTrendChart';
import { fetchAllData } from '../services/api';
import type { SummaryResponse, DriversResponse, RiskFactor, Recommendation } from '../types';

interface DashboardData {
  summary: SummaryResponse | null;
  drivers: DriversResponse | null;
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    summary: null,
    drivers: null,
    riskFactors: [],
    recommendations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllData();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main', flexShrink: 0 }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00bcd4 0%, #2196f3 50%, #ff9800 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: 'white'
                }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              SkyGeni
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" onClick={loadData} title="Refresh data">
            <RefreshIcon />
          </IconButton>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <IconButton color="inherit">
            <ChatIcon />
          </IconButton>
          <IconButton color="inherit">
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data.summary && (
          <>
            {/* Summary Banner */}
            <SummaryBanner data={data.summary} />

            {/* Layout: Revenue Drivers | (Risk Factors + Recommendations + Revenue Trend) */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {/* Left Column - Revenue Drivers */}
              <Grid item xs={12} md={3}>
                {data.drivers && <RevenueDrivers data={data.drivers} />}
              </Grid>

              {/* Right Column - Risk Factors + Recommendations, then Revenue Trend */}
              <Grid item xs={12} md={9}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Top Risk Factors | Recommended Actions */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <RiskFactors data={data.riskFactors} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Recommendations data={data.recommendations} />
                    </Grid>
                  </Grid>
                  {/* Revenue Trend - below */}
                  <RevenueTrendChart data={data.summary.monthlyRevenue} />
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}
