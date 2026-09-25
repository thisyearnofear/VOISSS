"use client";

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import MarketplaceInstrument from "@/components/marketplace/MarketplaceInstrument";

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <main id="listening-main">
          <div className="lr-wrap" style={{ paddingTop: "4rem" }}>
            <Loader2 className="w-8 h-8 animate-spin" aria-hidden />
          </div>
        </main>
      }
    >
      <MarketplaceInstrument />
    </Suspense>
  );
}
