import { Box, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import type { RiskFactor } from '../types';

interface RiskFactorsProps {
  data: RiskFactor[];
}

function getSeverityColor(severity: 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'high':
      return '#f44336';
    case 'medium':
      return '#ff9800';
    case 'low':
      return '#4caf50';
  }
}

export default function RiskFactors({ data }: RiskFactorsProps) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Top Risk Factors
      </Typography>
      <Card>
        <CardContent sx={{ p: 0 }}>
          {data.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No significant risk factors identified
              </Typography>
            </Box>
          ) : (
            <List 
              sx={{ 
                p: 0, 
                maxHeight: 200, 
                overflow: 'auto',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 }
              }}
            >
              {data.map((risk, index) => (
                <ListItem
                  key={risk.id}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderBottom: index < data.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: getSeverityColor(risk.severity)
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {risk.description}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
