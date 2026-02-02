import { Box, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { Recommendation } from '../types';

interface RecommendationsProps {
  data: Recommendation[];
}

function getIconColor(priority: 'high' | 'medium' | 'low') {
  switch (priority) {
    case 'high':
      return '#f44336';
    case 'medium':
      return '#ff9800';
    case 'low':
      return '#4caf50';
  }
}

export default function Recommendations({ data }: RecommendationsProps) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Recommended Actions
      </Typography>
      <Card>
        <CardContent sx={{ p: 0 }}>
          {data.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No recommendations at this time
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
              {data.map((rec, index) => (
                <ListItem
                  key={rec.id}
                  alignItems="flex-start"
                  sx={{
                    py: 2,
                    px: 2,
                    borderBottom: index < data.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    <CheckCircleOutlineIcon 
                      sx={{ 
                        color: getIconColor(rec.priority),
                        fontSize: 22
                      }} 
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {rec.title}
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
