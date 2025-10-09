import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes for most data
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default (can be overridden per query)
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Mission-related queries
  missions: {
    all: ['missions'] as const,
    lists: () => [...queryKeys.missions.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.missions.lists(), filters] as const,
    details: () => [...queryKeys.missions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.missions.details(), id] as const,
    userMissions: (userId: string) => [...queryKeys.missions.all, 'user', userId] as const,
    stats: (userId?: string) => [...queryKeys.missions.all, 'stats', userId] as const,
  },
  
  // Recording-related queries
  recordings: {
    all: ['recordings'] as const,
    lists: () => [...queryKeys.recordings.all, 'list'] as const,
    list: (userId: string, filters?: Record<string, any>) => 
      [...queryKeys.recordings.lists(), userId, filters] as const,
    details: () => [...queryKeys.recordings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.recordings.details(), id] as const,
  },
  
  // AI-related queries
  ai: {
    all: ['ai'] as const,
    voices: () => [...queryKeys.ai.all, 'voices'] as const,
    models: () => [...queryKeys.ai.all, 'models'] as const,
    languages: () => [...queryKeys.ai.all, 'languages'] as const,
  },
  
  // Starknet-related queries
  starknet: {
    all: ['starknet'] as const,
    balance: (address: string) => [...queryKeys.starknet.all, 'balance', address] as const,
    transactions: (address: string) => [...queryKeys.starknet.all, 'transactions', address] as const,
    userProfile: (address: string) => [...queryKeys.starknet.all, 'profile', address] as const,
  },
  
  // Sync-related queries
  sync: {
    all: ['sync'] as const,
    status: (userId: string) => [...queryKeys.sync.all, 'status', userId] as const,
    pendingUploads: (userId: string) => [...queryKeys.sync.all, 'pending', userId] as const,
  },
} as const;

// Error handling utilities
export class QueryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'QueryError';
  }
}

// Common error handler for queries
export const handleQueryError = (error: unknown): QueryError => {
  if (error instanceof QueryError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new QueryError(error.message, undefined, undefined, error);
  }
  
  return new QueryError('An unknown error occurred', undefined, undefined, error);
};