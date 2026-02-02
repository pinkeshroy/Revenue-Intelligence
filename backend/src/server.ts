import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initializeDatabase } from './database/db';
import { seedDatabase } from './database/seed';
import apiRoutes from './routes/api';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Seed database
    console.log('Seeding database...');
    await seedDatabase();

    // Start server
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Current date for calculations: ${config.currentDate.toISOString().split('T')[0]}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
