import { openDB, IDBPDatabase } from "idb";
import { AudioVersion } from "@voisss/shared";

const DB_NAME = "voisss-studio";
const STORE_NAME = "forge-drafts";
const LEDGER_STORE_NAME = "version-ledger";

export async function getStudioDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(LEDGER_STORE_NAME)) {
        db.createObjectStore(LEDGER_STORE_NAME);
      }
    },
  });
}

export async function saveForgeBlob(blob: Blob): Promise<void> {
  const db = await getStudioDB();
  await db.put(STORE_NAME, blob, "active_blob");
}

export async function getForgeBlob(): Promise<Blob | null> {
  const db = await getStudioDB();
  return (await db.get(STORE_NAME, "active_blob")) || null;
}

export async function clearForgeBlob(): Promise<void> {
  const db = await getStudioDB();
  await db.delete(STORE_NAME, "active_blob");
}

export async function saveVersionLedger(state: {
  versions: AudioVersion[];
  activeVersionId: string;
}): Promise<void> {
  const db = await getStudioDB();
  await db.put(LEDGER_STORE_NAME, state, "current_session");
}

export async function getVersionLedger(): Promise<{
  versions: AudioVersion[];
  activeVersionId: string;
} | null> {
  const db = await getStudioDB();
  return (await db.get(LEDGER_STORE_NAME, "current_session")) || null;
}

export async function clearVersionLedger(): Promise<void> {
  const db = await getStudioDB();
  await db.delete(LEDGER_STORE_NAME, "current_session");
}

export function getBlobDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve(0);
    });
    // Fallback if metadata never loads (e.g. invalid blob)
    setTimeout(() => resolve(0), 1000);
  });
}
