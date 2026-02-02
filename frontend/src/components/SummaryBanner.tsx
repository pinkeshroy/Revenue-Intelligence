import { Box, Typography, Paper } from '@mui/material';
import type { SummaryResponse } from '../types';

interface SummaryBannerProps {
  data: SummaryResponse;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${Math.round(value / 1000).toLocaleString()},000`;
  }
  return `$${value.toLocaleString()}`;
}

export default function SummaryBanner({ data }: SummaryBannerProps) {
  const { currentQuarterRevenue, target, gapPercentage } = data;
  
  const isAhead = gapPercentage >= 0;
  const gapColor = isAhead ? '#4caf50' : '#f44336';
  const gapText = isAhead 
    ? `+${Math.abs(gapPercentage).toFixed(0)}% to Goal` 
    : `-${Math.abs(gapPercentage).toFixed(0)}% to Goal`;

  return (
    <Paper
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: 2.5,
        px: 4,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 500 }}>
        QTD Revenue:
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        {formatCurrency(currentQuarterRevenue)}
      </Typography>

      <Box
        sx={{
          height: 30,
          width: 2,
          bgcolor: 'rgba(255,255,255,0.4)',
          mx: 2
        }}
      />

      <Typography variant="h5" sx={{ fontWeight: 500, opacity: 0.9 }}>
        Target:
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 600, opacity: 0.9 }}>
        {formatCurrency(target)}
      </Typography>

      <Box
        sx={{
          height: 30,
          width: 2,
          bgcolor: 'rgba(255,255,255,0.4)',
          mx: 2
        }}
      />

      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 600,
          color: gapColor
        }}
      >
        {gapText}
      </Typography>
    </Paper>
  );
}
