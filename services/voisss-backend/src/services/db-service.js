/**
 * Database Service
 * Single source of truth for PostgreSQL connections and migrations
 * PRINCIPLE: DRY - Centralized database management
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;

/**
 * Initialize database connection pool
 */
function initializePool() {
  if (pool) return pool;

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not defined in environment variables!');
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  console.log('Database pool initialized');
  return pool;
}

/**
 * Get pool instance (lazy initialization)
 */
function getPool() {
  if (!pool) {
    initializePool();
  }
  return pool;
}

/**
 * Execute a query
 */
async function query(text, params = []) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

/**
 * Run migrations from /migrations folder
 * PRINCIPLE: Single responsibility - manages schema evolution
 */
async function runMigrations() {
  // Skip migrations if env var set
  if (process.env.SKIP_MIGRATIONS === 'true') {
    console.log('⏭️  Migrations disabled via SKIP_MIGRATIONS');
    return;
  }

  const migrationsDir = path.join(__dirname, '../migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found, skipping migrations');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migrations to run');
    return;
  }

  // Ensure migrations table exists with timeout
  try {
    await Promise.race([
      query(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT NOW()
        )
      `),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Migration setup timeout')), 5000))
    ]);
  } catch (e) {
    console.error('Failed to setup migrations table:', e.message);
    return;
  }

  console.log(`Found ${files.length} migration files`);

  for (const file of files) {
    const migrationName = file.replace('.sql', '');
    let result;

    try {
      result = await Promise.race([
        query('SELECT id FROM _migrations WHERE name = $1', [migrationName]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Migration check timeout')), 5000))
      ]);
    } catch (e) {
      console.error(`Failed to check migration ${migrationName}:`, e.message);
      continue;
    }

    if (result.rows.length === 0) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf-8');

      console.log(`Running migration: ${migrationName}`);
      try {
        await Promise.race([
          query(sql),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Migration execution timeout')), 30000))
        ]);
        await query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [migrationName]
        );
        console.log(`✅ Migration complete: ${migrationName}`);
      } catch (e) {
        console.error(`❌ Migration failed: ${migrationName}`, e.message);
      }
    } else {
      console.log(`⏭️  Migration already run: ${migrationName}`);
    }
  }
}

/**
 * Close pool gracefully
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

module.exports = {
  getPool,
  query,
  runMigrations,
  closePool,
};
