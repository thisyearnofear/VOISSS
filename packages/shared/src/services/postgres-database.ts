/**
 * PostgreSQL Database Adapter
 * 
 * Implements the DatabaseService interface using 'pg' (node-postgres).
 * Designed to work with any standard Postgres database (local, Supabase, RDS).
 * 
 * STRATEGY:
 * To maintain compatibility with the document-style DatabaseService interface
 * (get, set, update) without a complex ORM, we use a simple schema pattern:
 * 
 * Table structure for each collection:
 * - id (TEXT PRIMARY KEY)
 * - data (JSONB)
 * - created_at (TIMESTAMP)
 * - updated_at (TIMESTAMP)
 */

import { Pool, PoolConfig } from 'pg';
import { 
  DatabaseService, 
  DatabaseConnectionError, 
  DatabaseOperationError 
} from './database-service';

export class PostgresDatabase implements DatabaseService {
  private pool: Pool | null = null;
  private connected = false;

  constructor(private config?: PoolConfig | string) {}

  async connect(): Promise<void> {
    if (this.connected && this.pool) return;

    try {
      const connectionConfig = typeof this.config === 'string' 
        ? { connectionString: this.config }
        : this.config;

      this.pool = new Pool({
        ...connectionConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Verify connection
      const client = await this.pool.connect();
      client.release();
      
      this.connected = true;
      console.log('✅ Postgres adapter connected');
    } catch (error) {
      console.error('Failed to connect to Postgres:', error);
      throw new DatabaseConnectionError('Failed to connect to PostgreSQL database');
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  // Helper to ensure table exists (Auto-migration for prototype phase)
  // In production, use proper migration scripts
  private async ensureTable(collection: string): Promise<void> {
    if (!this.pool) throw new DatabaseConnectionError('No connection pool');
    
    // Sanitize collection name to prevent injection
    const tableName = collection.replace(/[^a-z0-9_]/g, '');

    const query = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await this.pool.query(query);
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    await this.ensureConnected();
    await this.ensureTable(collection);

    try {
      const res = await this.pool!.query(
        `SELECT data FROM "${collection}" WHERE id = $1`,
        [id]
      );
      
      if (res.rows.length === 0) return null;
      return this.reviveDates(res.rows[0].data) as T;
    } catch (error) {
      throw new DatabaseOperationError(`Failed to get item ${id}`, collection, 'get');
    }
  }

  async getAll<T>(collection: string): Promise<T[]> {
    await this.ensureConnected();
    await this.ensureTable(collection);

    try {
      const res = await this.pool!.query(`SELECT data FROM "${collection}"`);
      return res.rows.map(row => this.reviveDates(row.data) as T);
    } catch (error) {
      throw new DatabaseOperationError('Failed to get all items', collection, 'getAll');
    }
  }

  async getWhere<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    // Note: This is inefficient for large datasets as it fetches all rows.
    // Optimization: In the future, DatabaseService could support structured queries.
    const all = await this.getAll<T>(collection);
    return all.filter(predicate);
  }

  async set<T>(collection: string, id: string, data: T): Promise<void> {
    await this.ensureConnected();
    await this.ensureTable(collection);

    try {
      await this.pool!.query(
        `INSERT INTO "${collection}" (id, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (id) DO UPDATE 
         SET data = $2, updated_at = NOW()`,
        [id, JSON.stringify(data)]
      );
    } catch (error) {
      throw new DatabaseOperationError(`Failed to set item ${id}`, collection, 'set');
    }
  }

  async update<T>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    await this.ensureConnected();
    
    const current = await this.get<T>(collection, id);
    if (!current) {
      throw new DatabaseOperationError(`Item ${id} not found`, collection, 'update');
    }

    const updated = { ...current, ...updates };
    await this.set(collection, id, updated);
    return updated;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    await this.ensureConnected();
    await this.ensureTable(collection);

    try {
      const res = await this.pool!.query(
        `DELETE FROM "${collection}" WHERE id = $1`,
        [id]
      );
      return (res.rowCount || 0) > 0;
    } catch (error) {
      throw new DatabaseOperationError(`Failed to delete item ${id}`, collection, 'delete');
    }
  }

  async exists(collection: string, id: string): Promise<boolean> {
    const item = await this.get(collection, id);
    return item !== null;
  }

  async setBatch<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void> {
    await this.ensureConnected();
    if (items.length === 0) return;

    // Use transaction for batch
    const client = await this.pool!.connect();
    try {
      await client.query('BEGIN');
      await this.ensureTable(collection); // Ensure table exists before batch

      for (const item of items) {
         await client.query(
          `INSERT INTO "${collection}" (id, data, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (id) DO UPDATE 
           SET data = $2, updated_at = NOW()`,
          [item.id, JSON.stringify(item.data)]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new DatabaseOperationError('Batch set failed', collection, 'setBatch');
    } finally {
      client.release();
    }
  }

  async deleteBatch(collection: string, ids: string[]): Promise<void> {
    await this.ensureConnected();
    if (ids.length === 0) return;

    try {
      // Postgres allows ANY($1) for array matching
      await this.pool!.query(
        `DELETE FROM "${collection}" WHERE id = ANY($1)`,
        [ids]
      );
    } catch (error) {
      throw new DatabaseOperationError('Batch delete failed', collection, 'deleteBatch');
    }
  }

  async clear(collection: string): Promise<void> {
    await this.ensureConnected();
    await this.ensureTable(collection);
    await this.pool!.query(`TRUNCATE TABLE "${collection}"`);
  }

  async count(collection: string): Promise<number> {
    await this.ensureConnected();
    await this.ensureTable(collection);
    const res = await this.pool!.query(`SELECT COUNT(*) FROM "${collection}"`);
    return parseInt(res.rows[0].count);
  }

  private reviveDates(obj: any): any {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(obj[key])) {
          obj[key] = new Date(obj[key]);
        } else if (typeof obj[key] === 'object') {
          obj[key] = this.reviveDates(obj[key]);
        }
      }
    }
    return obj;
  }
}

export function createPostgresDatabase(config?: PoolConfig | string): DatabaseService {
  return new PostgresDatabase(config || process.env.DATABASE_URL);
}
