/**
 * Audio Version Type - Single source of truth for all version tracking
 * Consolidates: original, aiVoice, dubbed, and chained transformations
 */

export type AudioVersionSource = 
  | 'original'
  | `aiVoice-${string}`      // aiVoice-{voiceId}
  | `dub-${string}`          // dub-{languageCode}
  | 'chain';                 // Result of chaining transformations

export interface AudioVersionMetadata {
  language?: string;          // For dubs: 'pt', 'es', 'fr'
  voiceId?: string;           // For voice transforms
  voiceName?: string;         // Display name
  duration: number;           // Seconds
  size: number;               // Bytes
  createdAt: string;          // ISO timestamp
  transformChain: string[];   // ["dub:pt", "aiVoice:warm"] shows history
}

export interface AudioVersion {
  id: string;                 // Unique ID: 'v0', 'v1_pt_dub', etc
  label: string;              // User-friendly: "Original", "Portuguese Dub", "Portuguese + Warm Voice"
  source: AudioVersionSource; // What created this version
  parentVersionId?: string;   // Which version this was derived from (null for original)
  blob: Blob;
  metadata: AudioVersionMetadata;
}

/**
 * Version Ledger State - Replace scattered audio blobs
 * 
 * OLD STATE (problematic):
 * - audioBlob (original)
 * - variantBlobFree (AI voice, singular)
 * - dubbedBlob (dub, singular, overwrites)
 * - activeForgeBlob (selected version)
 * 
 * NEW STATE (unified):
 * - versions: AudioVersion[] (full history + chains)
 * - activeVersionId: string (selected for Forge)
 */
export interface VersionLedgerState {
  versions: AudioVersion[];
  activeVersionId: string;  // ID of currently selected version
}
