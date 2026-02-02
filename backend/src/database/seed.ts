import fs from 'fs';
import path from 'path';
import db, { initializeDatabase, query, run, saveDatabase } from './db';
import { config } from '../config';
import { Account, Rep, Deal, Activity, Target } from '../types';

function getSeedDataPath(): string {
  // Check multiple possible paths
  const possiblePaths = [
    config.seedDataPath,
    './seed-data',
    '../data',
    './data',
    path.join(__dirname, '../../seed-data'),
    path.join(__dirname, '../../../data')
  ];

  for (const p of possiblePaths) {
    const fullPath = path.resolve(p);
    if (fs.existsSync(fullPath) && fs.existsSync(path.join(fullPath, 'accounts.json'))) {
      return fullPath;
    }
  }

  throw new Error('Could not find seed data directory');
}

function loadJsonFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function seedDatabase(): Promise<void> {
  const seedPath = getSeedDataPath();
  console.log(`Loading seed data from: ${seedPath}`);

  // Initialize tables
  await initializeDatabase();

  // Check if data already exists
  const existingAccounts = await query<{ count: number }>('SELECT COUNT(*) as count FROM accounts');
  
  if (existingAccounts[0]?.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // Load JSON files
  const accounts = loadJsonFile<Account[]>(path.join(seedPath, 'accounts.json'));
  const reps = loadJsonFile<Rep[]>(path.join(seedPath, 'reps.json'));
  const deals = loadJsonFile<Deal[]>(path.join(seedPath, 'deals.json'));
  const activities = loadJsonFile<Activity[]>(path.join(seedPath, 'activities.json'));
  const targets = loadJsonFile<Target[]>(path.join(seedPath, 'targets.json'));

  console.log(`Loaded: ${accounts.length} accounts, ${reps.length} reps, ${deals.length} deals, ${activities.length} activities, ${targets.length} targets`);

  // Insert data
  // Insert accounts
  for (const account of accounts) {
    await run(
      'INSERT OR REPLACE INTO accounts (account_id, name, industry, segment) VALUES (?, ?, ?, ?)',
      [account.account_id, account.name, account.industry, account.segment]
    );
  }

  // Insert reps
  for (const rep of reps) {
    await run(
      'INSERT OR REPLACE INTO reps (rep_id, name) VALUES (?, ?)',
      [rep.rep_id, rep.name]
    );
  }

  // Insert deals
  for (const deal of deals) {
    await run(
      'INSERT OR REPLACE INTO deals (deal_id, account_id, rep_id, stage, amount, created_at, closed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [deal.deal_id, deal.account_id, deal.rep_id, deal.stage, deal.amount, deal.created_at, deal.closed_at]
    );
  }

  // Insert activities
  for (const activity of activities) {
    await run(
      'INSERT OR REPLACE INTO activities (activity_id, deal_id, type, timestamp) VALUES (?, ?, ?, ?)',
      [activity.activity_id, activity.deal_id, activity.type, activity.timestamp]
    );
  }

  // Insert targets
  for (const target of targets) {
    await run(
      'INSERT OR REPLACE INTO targets (month, target) VALUES (?, ?)',
      [target.month, target.target]
    );
  }

  saveDatabase();
  console.log('Database seeded successfully');
}

// Run if called directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}
