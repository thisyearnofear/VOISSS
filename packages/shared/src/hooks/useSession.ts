/**
 * Cross-Platform Session Management Hooks
 * 
 * These hooks provide a consistent interface for session management
 * across web and mobile platforms using React Query for state management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  saveUserSession,
  loadUserSession,
  clearUserSession,
  updateSession,
  isAuthenticated,
  createSession,
  type UserSession
} from '../utils/session';

// Query keys for session-related queries
export const sessionQueryKeys = {
  session: () => ['session'] as const,
  authStatus: () => ['auth-status'] as const,
} as const;

/**
 * Hook to get current user session
 */
export function useSession() {
  return useQuery({
    queryKey: sessionQueryKeys.session(),
    queryFn: loadUserSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to check authentication status
 */
export function useAuthStatus() {
  return useQuery({
    queryKey: sessionQueryKeys.authStatus(),
    queryFn: isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ walletAddress, network }: { walletAddress?: string; network?: string }) => 
      createSession(walletAddress, network),
    onSuccess: (session) => {
      // Update session query with new session data
      queryClient.setQueryData(sessionQueryKeys.session(), session);
      // Update auth status
      queryClient.setQueryData(sessionQueryKeys.authStatus(), true);
    },
  });
}

/**
 * Hook to update current session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateSession,
    onSuccess: (updatedSession) => {
      if (updatedSession) {
        // Update session query with updated session data
        queryClient.setQueryData(sessionQueryKeys.session(), updatedSession);
      }
    },
  });
}

/**
 * Hook to clear current session
 */
export function useClearSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clearUserSession,
    onSuccess: () => {
      // Clear session data
      queryClient.setQueryData(sessionQueryKeys.session(), null);
      // Update auth status
      queryClient.setQueryData(sessionQueryKeys.authStatus(), false);
      // Invalidate all other queries that might be affected by logout
      queryClient.invalidateQueries();
    },
  });
}

/**
 * Hook to get wallet address from session
 */
export function useWalletAddress() {
  const { data: session } = useSession();
  return session?.walletAddress || null;
}

/**
 * Hook to get network preference from session
 */
export function useNetworkPreference() {
  const { data: session } = useSession();
  return session?.network || null;
}