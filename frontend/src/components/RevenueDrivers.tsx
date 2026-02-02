import { Box, Card, CardContent, Typography } from '@mui/material';
import MiniBarChart from './charts/MiniBarChart';
import type { DriversResponse, DriverMetric } from '../types';

interface RevenueDriversProps {
  data: DriversResponse;
}

interface DriverCardProps {
  title: string;
  metric: DriverMetric;
  format: 'currency' | 'percent' | 'days';
}

function formatValue(value: number, format: 'currency' | 'percent' | 'days'): string {
  switch (format) {
    case 'currency':
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      }
      return `$${value.toLocaleString()}`;
    case 'percent':
      return `${value.toFixed(0)}%`;
    case 'days':
      return `${value} Days`;
    default:
      return value.toLocaleString();
  }
}

function formatChange(value: number, format: 'currency' | 'percent' | 'days'): string {
  const sign = value >= 0 ? '+' : '';
  switch (format) {
    case 'currency':
      if (Math.abs(value) >= 1000000) {
        return `${sign}${(value / 1000000).toFixed(1)}M`;
      }
      if (Math.abs(value) >= 1000) {
        return `${sign}${(value / 1000).toFixed(1)}K`;
      }
      return `${sign}$${value.toLocaleString()}`;
    case 'percent':
      return `${sign}${value.toFixed(0)}%`;
    case 'days':
      return `${sign}${value} Days`;
    default:
      return `${sign}${value}`;
  }
}

function DriverCard({ title, metric, format }: DriverCardProps) {
  // For sales cycle, negative change is good (faster)
  const isPositive = format === 'days' ? metric.change <= 0 : metric.change >= 0;
  const changeColor = isPositive ? '#4caf50' : '#f44336';

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {formatValue(metric.current, format)}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ fontWeight: 600, color: changeColor }}
          >
            {formatChange(metric.change, format)}
          </Typography>
        </Box>

        {/* Mini Bar Chart */}
        <Box sx={{ height: 35 }}>
          <MiniBarChart 
            data={metric.trend} 
            color="#90caf9"
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default function RevenueDrivers({ data }: RevenueDriversProps) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Revenue Drivers
      </Typography>
      <DriverCard 
        title="Pipeline Value" 
        metric={data.pipelineValue} 
        format="currency" 
      />
      <DriverCard 
        title="Win Rate" 
        metric={data.winRate} 
        format="percent" 
      />
      <DriverCard 
        title="Avg Deal Size" 
        metric={data.avgDealSize} 
        format="currency" 
      />
      <DriverCard 
        title="Sales Cycle" 
        metric={data.salesCycle} 
        format="days" 
      />
    </Box>
  );
}
