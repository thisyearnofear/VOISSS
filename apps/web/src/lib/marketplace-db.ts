/**
 * Marketplace Database Layer
 * 
 * ENHANCEMENT FIRST: Extends existing studio-db with marketplace functionality
 * Uses IndexedDB for client-side voice listing management
 */

import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "voisss-marketplace";
const VOICE_LISTINGS_STORE = "voice-listings";
const LICENSE_STORE = "licenses";

export interface VoiceListing {
  id: string; // recordingId from existing system
  contributorAddress: string;
  isLicensable: boolean;
  licensePrice: number; // USDC in wei
  licenseType: 'exclusive' | 'non-exclusive';
  voiceProfile: {
    tone?: string;
    pitch?: string;
    language?: string;
    accent?: string;
    tags?: string[];
  };
  metadata: {
    duration?: number;
    sampleRate?: number;
    ipfsHash?: string;
    createdAt: number;
    updatedAt: number;
  };
  stats: {
    views: number;
    purchases: number;
    usageCount: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'delisted';
}

export interface VoiceLicense {
  id: string;
  voiceListingId: string;
  licenseeAddress: string;
  licenseType: 'exclusive' | 'non-exclusive';
  price: number; // USDC in wei
  purchasedAt: number;
  expiresAt?: number; // For time-limited licenses
  usageLimit?: number; // For usage-capped licenses
  usageCount: number;
  status: 'active' | 'expired' | 'revoked';
  txHash?: string;
}

export async function getMarketplaceDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(VOICE_LISTINGS_STORE)) {
        const listingStore = db.createObjectStore(VOICE_LISTINGS_STORE, { keyPath: 'id' });
        listingStore.createIndex('contributorAddress', 'contributorAddress');
        listingStore.createIndex('status', 'status');
        listingStore.createIndex('licenseType', 'licenseType');
      }
      if (!db.objectStoreNames.contains(LICENSE_STORE)) {
        const licenseStore = db.createObjectStore(LICENSE_STORE, { keyPath: 'id' });
        licenseStore.createIndex('voiceListingId', 'voiceListingId');
        licenseStore.createIndex('licenseeAddress', 'licenseeAddress');
        licenseStore.createIndex('status', 'status');
      }
    },
  });
}

// Voice Listing Operations
export async function saveVoiceListing(listing: VoiceListing): Promise<void> {
  const db = await getMarketplaceDB();
  await db.put(VOICE_LISTINGS_STORE, listing);
}

export async function getVoiceListing(id: string): Promise<VoiceListing | null> {
  const db = await getMarketplaceDB();
  return (await db.get(VOICE_LISTINGS_STORE, id)) || null;
}

export async function getAllVoiceListings(): Promise<VoiceListing[]> {
  const db = await getMarketplaceDB();
  return await db.getAll(VOICE_LISTINGS_STORE);
}

export async function getVoiceListingsByContributor(address: string): Promise<VoiceListing[]> {
  const db = await getMarketplaceDB();
  const index = db.transaction(VOICE_LISTINGS_STORE).store.index('contributorAddress');
  return await index.getAll(address);
}

export async function getApprovedVoiceListings(): Promise<VoiceListing[]> {
  const db = await getMarketplaceDB();
  const index = db.transaction(VOICE_LISTINGS_STORE).store.index('status');
  return await index.getAll('approved');
}

export async function deleteVoiceListing(id: string): Promise<void> {
  const db = await getMarketplaceDB();
  await db.delete(VOICE_LISTINGS_STORE, id);
}

// License Operations
export async function saveLicense(license: VoiceLicense): Promise<void> {
  const db = await getMarketplaceDB();
  await db.put(LICENSE_STORE, license);
}

export async function getLicense(id: string): Promise<VoiceLicense | null> {
  const db = await getMarketplaceDB();
  return (await db.get(LICENSE_STORE, id)) || null;
}

export async function getLicensesByVoice(voiceListingId: string): Promise<VoiceLicense[]> {
  const db = await getMarketplaceDB();
  const index = db.transaction(LICENSE_STORE).store.index('voiceListingId');
  return await index.getAll(voiceListingId);
}

export async function getLicensesByLicensee(address: string): Promise<VoiceLicense[]> {
  const db = await getMarketplaceDB();
  const index = db.transaction(LICENSE_STORE).store.index('licenseeAddress');
  return await index.getAll(address);
}

export async function getActiveLicenses(address: string): Promise<VoiceLicense[]> {
  const licenses = await getLicensesByLicensee(address);
  return licenses.filter(l => l.status === 'active');
}

// Helper: Check if voice is already licensed to an address
export async function hasActiveLicense(
  voiceListingId: string,
  licenseeAddress: string
): Promise<boolean> {
  const licenses = await getLicensesByVoice(voiceListingId);
  return licenses.some(
    l => l.licenseeAddress.toLowerCase() === licenseeAddress.toLowerCase() && l.status === 'active'
  );
}

// Helper: Check if exclusive license exists
export async function hasExclusiveLicense(voiceListingId: string): Promise<boolean> {
  const licenses = await getLicensesByVoice(voiceListingId);
  return licenses.some(l => l.licenseType === 'exclusive' && l.status === 'active');
}
