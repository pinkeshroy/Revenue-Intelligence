import { Box } from '@mui/material';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Dashboard />
    </Box>
  );
}

export default App;
