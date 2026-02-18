'use client';

/**
 * useAgentMode
 *
 * Encapsulates all agent-mode state for the Recording Studio.
 * CLEAN: isolates agent-mode concerns from recording + save logic.
 * MODULAR: can be tested independently of the studio component.
 */

import { useState } from 'react';
import type { AgentCategory } from '@voisss/shared';

export interface AgentModeState {
  isAgentMode: boolean;
  agentCategory: AgentCategory;
  x402Price: string;
}

export interface AgentModeActions {
  setIsAgentMode: (v: boolean) => void;
  setAgentCategory: (v: AgentCategory) => void;
  setX402Price: (v: string) => void;
}

export function useAgentMode(): AgentModeState & AgentModeActions {
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [agentCategory, setAgentCategory] = useState<AgentCategory>('general');
  const [x402Price, setX402Price] = useState('0');

  return {
    isAgentMode,
    agentCategory,
    x402Price,
    setIsAgentMode,
    setAgentCategory,
    setX402Price,
  };
}
