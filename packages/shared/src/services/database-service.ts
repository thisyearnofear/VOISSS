/**
 * Database Service Interface
 * 
 * Provides a consistent interface for data persistence that can be implemented
 * with different backends (localStorage, IndexedDB, PostgreSQL, etc.)
 */

export interface DatabaseService {
  // Generic CRUD operations
  get<T>(collection: string, id: string): Promise<T | null>;
  getAll<T>(collection: string): Promise<T[]>;
  getWhere<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]>;
  set<T>(collection: string, id: string, data: T): Promise<void>;
  update<T>(collection: string, id: string, updates: Partial<T>): Promise<T>;
  delete(collection: string, id: string): Promise<boolean>;
  exists(collection: string, id: string): Promise<boolean>;
  
  // Batch operations
  setBatch<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void>;
  deleteBatch(collection: string, ids: string[]): Promise<void>;
  
  // Collection operations
  clear(collection: string): Promise<void>;
  count(collection: string): Promise<number>;
  
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface DatabaseError extends Error {
  code: string;
  collection?: string;
  operation?: string;
}

export class DatabaseConnectionError extends Error implements DatabaseError {
  code = 'DB_CONNECTION_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabaseOperationError extends Error implements DatabaseError {
  code = 'DB_OPERATION_ERROR';
  
  constructor(
    message: string,
    public collection?: string,
    public operation?: string
  ) {
    super(message);
    this.name = 'DatabaseOperationError';
  }
}

export class DatabaseValidationError extends Error implements DatabaseError {
  code = 'DB_VALIDATION_ERROR';
  
  constructor(message: string, public collection?: string) {
    super(message);
    this.name = 'DatabaseValidationError';
  }
}

/**
 * Collection names for type safety
 */
export const COLLECTIONS = {
  MISSIONS: 'missions',
  MISSION_RESPONSES: 'mission_responses',
  RECORDINGS: 'recordings',
  USER_PROFILES: 'user_profiles',
  SESSIONS: 'sessions'
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  provider: 'localStorage' | 'indexedDB' | 'postgres' | 'memory';
  connectionString?: string;
  options?: Record<string, any>;
}