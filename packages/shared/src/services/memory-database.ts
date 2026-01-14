import { DatabaseService, DatabaseOperationError } from './database-service';

export class InMemoryDatabase implements DatabaseService {
  private store: Map<string, Map<string, any>> = new Map();
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private ensureConnected(): void {
    if (!this.connected) {
       this.connected = true; // Auto-connect for memory
    }
  }

  private getCollection(name: string): Map<string, any> {
    if (!this.store.has(name)) {
      this.store.set(name, new Map());
    }
    return this.store.get(name)!;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    this.ensureConnected();
    const col = this.getCollection(collection);
    const item = col.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null; // Clone on retrieve
  }

  async getAll<T>(collection: string): Promise<T[]> {
    this.ensureConnected();
    const col = this.getCollection(collection);
    return Array.from(col.values()).map(item => JSON.parse(JSON.stringify(item)));
  }

  async getWhere<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    this.ensureConnected();
    const all = await this.getAll<T>(collection);
    return all.filter(predicate);
  }

  async set<T>(collection: string, id: string, data: T): Promise<void> {
    this.ensureConnected();
    const col = this.getCollection(collection);
    // Deep clone to simulate serialization/storage
    // This handles Date objects conversion to strings if simple JSON.stringify is used, 
    // but in memory usually we might want to keep objects. 
    // However, to mimic DB behavior (serialization), we should probably serialize.
    // The LocalStorage implementation has date revival logic. 
    // For InMemory, let's keep it simple: store copies.
    // If we want to strictly mimic JSON serialization:
    const serialized = JSON.stringify(data);
    const deserialized = JSON.parse(serialized, this.reviveDates);
    col.set(id, deserialized);
  }

  async update<T>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    this.ensureConnected();
    const current = await this.get<T>(collection, id);
    if (!current) {
        throw new DatabaseOperationError(`Item ${id} not found`, collection, 'update');
    }
    const updated = { ...current, ...updates };
    await this.set(collection, id, updated);
    return updated;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    this.ensureConnected();
    const col = this.getCollection(collection);
    return col.delete(id);
  }

  async exists(collection: string, id: string): Promise<boolean> {
    this.ensureConnected();
    const col = this.getCollection(collection);
    return col.has(id);
  }

  async setBatch<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void> {
    for (const item of items) {
      await this.set(collection, item.id, item.data);
    }
  }

  async deleteBatch(collection: string, ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(collection, id);
    }
  }

  async clear(collection: string): Promise<void> {
    this.ensureConnected();
    this.store.set(collection, new Map());
  }

  async count(collection: string): Promise<number> {
    this.ensureConnected();
    return this.getCollection(collection).size;
  }

  private reviveDates(key: string, value: any): any {
    // Simple date revival for ISO strings
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
  }
}

export function createInMemoryDatabase(): DatabaseService {
    return new InMemoryDatabase();
}
