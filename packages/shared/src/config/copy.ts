/** Shared marketing copy — single source of truth for homepage, demo, and heroes. */

export const PRODUCT_TAGLINE =
  "AI agents license real human voices. Pay per character. Creators keep 70%.";

export const PRODUCT_TAGLINE_SHORT =
  "Pay per character · Creators keep 70%";

export const SHOWCASE_POE_LINE =
  "The thousand injuries of Fortunato I had borne as I best could, but when he ventured upon insult, I vowed revenge.";

export const PERSONA_STEPS = {
  developer: ["Get API credits", "Pick a voice", "One API call"],
  creator: ["Record once", "List on marketplace", "Earn 70% per use"],
  enterprise: ["Tell us your needs", "Custom voice model", "Exclusive license"],
} as const;

export const ONBOARDING_PAYOFF = {
  creator: (style: string) =>
    `Record a ${style} voice in Studio — you keep 70% every time an AI agent speaks with it.`,
  developer: (style: string) =>
    `Your ${style} voice picks are ready. Get API credits and integrate in under a minute.`,
  exploring: () =>
    "Try the free demo first — type anything and hear a licensed human voice in seconds.",
} as const;
