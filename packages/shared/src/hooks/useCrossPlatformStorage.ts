/**
 * useCrossPlatformStorage Hook
 * 
 * React hook for cross-platform storage operations
 * Provides a clean interface for components to use storage without worrying about platform differences
 * Follows MODULAR and PERFORMANT principles
 */

import { useState, useEffect, useCallback } from 'react';
import { crossPlatformStorage } from '../services/cross-platform-storage';

/**
 * Custom hook for cross-platform storage operations
 * @returns Storage operations and status
 */
export function useCrossPlatformStorage() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize storage connection
  useEffect(() => {
    const initialize = async () => {
      try {
        await crossPlatformStorage.connect();
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize cross-platform storage:', err);
        setError(err instanceof Error ? err : new Error('Storage initialization failed'));
        setIsReady(false);
      }
    };

    initialize();

    return () => {
      // Cleanup on unmount
      crossPlatformStorage.disconnect();
    };
  }, []);

  /**
   * Get an item from storage
   * @param key Storage key
   * @returns Value or null if not found
   */
  const getItem = useCallback(async (key: string): Promise<string | null> => {
    if (!isReady) {
      console.warn('Storage not ready');
      return null;
    }

    try {
      return await crossPlatformStorage.getItem(key);
    } catch (err) {
      console.error(`Failed to get item ${key}:`, err);
      setError(err instanceof Error ? err : new Error('Get item failed'));
      return null;
    }
  }, [isReady]);

  /**
   * Set an item in storage
   * @param key Storage key
   * @param value Value to store
   */
  const setItem = useCallback(async (key: string, value: string): Promise<boolean> => {
    if (!isReady) {
      console.warn('Storage not ready');
      return false;
    }

    try {
      await crossPlatformStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.error(`Failed to set item ${key}:`, err);
      setError(err instanceof Error ? err : new Error('Set item failed'));
      return false;
    }
  }, [isReady]);

  /**
   * Remove an item from storage
   * @param key Storage key
   */
  const removeItem = useCallback(async (key: string): Promise<boolean> => {
    if (!isReady) {
      console.warn('Storage not ready');
      return false;
    }

    try {
      await crossPlatformStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`Failed to remove item ${key}:`, err);
      setError(err instanceof Error ? err : new Error('Remove item failed'));
      return false;
    }
  }, [isReady]);

  /**
   * Clear all items from the default storage collection
   */
  const clear = useCallback(async (): Promise<boolean> => {
    if (!isReady) {
      console.warn('Storage not ready');
      return false;
    }

    try {
      await crossPlatformStorage.clearDefaultStorage();
      return true;
    } catch (err) {
      console.error('Failed to clear storage:', err);
      setError(err instanceof Error ? err : new Error('Clear storage failed'));
      return false;
    }
  }, [isReady]);

  /**
   * Get storage environment information
   */
  const getEnvironmentInfo = useCallback((): { isMobile: boolean; platform: string } => {
    return crossPlatformStorage.getEnvironmentInfo();
  }, []);

  return {
    isReady,
    error,
    getItem,
    setItem,
    removeItem,
    clear,
    getEnvironmentInfo,
  };
}

/**
 * Custom hook for managing a specific storage key
 * Provides reactive state for a single storage value
 * @param key Storage key to manage
 * @param defaultValue Default value if key doesn't exist
 */
export function useStorageState(key: string, defaultValue: string = '') {
  const { isReady, getItem, setItem } = useCrossPlatformStorage();
  const [value, setValue] = useState<string>(defaultValue);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      if (isReady) {
        try {
          const storedValue = await getItem(key);
          setValue(storedValue || defaultValue);
        } catch (err) {
          console.error(`Failed to load storage value for ${key}:`, err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadValue();
  }, [isReady, key, defaultValue, getItem]);

  // Update storage when value changes
  const updateValue = useCallback(async (newValue: string) => {
    setValue(newValue);
    if (isReady) {
      try {
        await setItem(key, newValue);
      } catch (err) {
        console.error(`Failed to update storage value for ${key}:`, err);
      }
    }
  }, [isReady, key, setItem]);

  return {
    value,
    setValue: updateValue,
    loading,
    isReady,
  };
}

/**
 * Custom hook for managing JSON storage
 * Automatically serializes/deserializes JSON data
 */
export function useJSONStorage<T>(key: string, defaultValue: T): {
  value: T;
  setValue: (newValue: T) => Promise<void>;
  loading: boolean;
  isReady: boolean;
} {
  const { isReady, getItem, setItem } = useCrossPlatformStorage();
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      if (isReady) {
        try {
          const storedValue = await getItem(key);
          setValue(storedValue ? JSON.parse(storedValue) : defaultValue);
        } catch (err) {
          console.error(`Failed to load JSON storage value for ${key}:`, err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadValue();
  }, [isReady, key, defaultValue, getItem]);

  // Update storage when value changes
  const updateValue = useCallback(async (newValue: T) => {
    setValue(newValue);
    if (isReady) {
      try {
        await setItem(key, JSON.stringify(newValue));
      } catch (err) {
        console.error(`Failed to update JSON storage value for ${key}:`, err);
      }
    }
  }, [isReady, key, setItem]);

  return {
    value,
    setValue: updateValue,
    loading,
    isReady,
  };
}