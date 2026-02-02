import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

let db: SqlJsDatabase | null = null;

// Ensure data directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) {
    return db;
  }

  const SQL = await initSqlJs();
  
  // Try to load existing database
  if (fs.existsSync(config.dbPath)) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

export function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(config.dbPath, buffer);
  }
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  database.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      account_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      segment TEXT NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS reps (
      rep_id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS deals (
      deal_id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      rep_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      amount INTEGER,
      created_at TEXT NOT NULL,
      closed_at TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(account_id),
      FOREIGN KEY (rep_id) REFERENCES reps(rep_id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS activities (
      activity_id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (deal_id) REFERENCES deals(deal_id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS targets (
      month TEXT PRIMARY KEY,
      target INTEGER NOT NULL
    )
  `);

  // Create indexes for better query performance
  database.run(`CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_deals_closed_at ON deals(closed_at)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_deals_rep_id ON deals(rep_id)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_deals_account_id ON deals(account_id)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp)`);

  saveDatabase();
  console.log('Database initialized successfully');
}

// Helper function for queries
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const database = await getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  
  return results;
}

// Helper function for single row queries
export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results[0] || null;
}

// Helper function for run (insert, update, delete)
export async function run(sql: string, params: unknown[] = []): Promise<void> {
  const database = await getDatabase();
  database.run(sql, params);
}

export default { getDatabase, initializeDatabase, query, queryOne, run, saveDatabase };
