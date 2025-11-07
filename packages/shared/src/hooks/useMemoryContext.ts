"use client";

import { useState, useEffect } from 'react';
import { getFarcasterSocialService } from '../services/farcaster-social';

interface MemoryContext {
  relevantMemories: any[];
  isLoading: boolean;
  addMemory: (content: string, metadata: any) => Promise<void>;
}

export function useMemoryContext(query?: string): MemoryContext {
  const [relevantMemories, setRelevantMemories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      getFarcasterSocialService()
        .getRelevantMemories(query)
        .then(setRelevantMemories)
        .finally(() => setIsLoading(false));
    }
  }, [query]);

  const addMemory = async (content: string, metadata: any) => {
    await getFarcasterSocialService().storeVoiceMemory({
      content,
      metadata,
    });
  };

  return { relevantMemories, isLoading, addMemory };
}
