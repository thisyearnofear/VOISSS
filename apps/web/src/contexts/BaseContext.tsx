"use client";

import React from "react";
import { createBaseAccountSDK } from "@base-org/account";

// Kept in a leaf module (not app/providers) — importing from providers.tsx
// would create a providers → AuthContext → providers import cycle that
// breaks dev-mode SSR (TDZ on hoisted vite imports).
export const BaseContext = React.createContext<{
  sdk: ReturnType<typeof createBaseAccountSDK>;
  provider: ReturnType<ReturnType<typeof createBaseAccountSDK>["getProvider"]>;
} | null>(null);

export function useBase() {
  const context = React.useContext(BaseContext);
  return context;
}
