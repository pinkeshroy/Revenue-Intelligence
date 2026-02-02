// Environment configuration
export const config = {
  port: parseInt(process.env.PORT || '3005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || './data/revenue.db',
  seedDataPath: process.env.SEED_DATA_PATH || './seed-data',

  // Current date for calculations (simulating Feb 2, 2026)
  currentDate: new Date('2026-02-02')
};
