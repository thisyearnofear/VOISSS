import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'voisss-studio';
const STORE_NAME = 'forge-drafts';

export async function getStudioDB(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
}

export async function saveForgeBlob(blob: Blob): Promise<void> {
    const db = await getStudioDB();
    await db.put(STORE_NAME, blob, 'active_blob');
}

export async function getForgeBlob(): Promise<Blob | null> {
    const db = await getStudioDB();
    return (await db.get(STORE_NAME, 'active_blob')) || null;
}

export async function clearForgeBlob(): Promise<void> {
    const db = await getStudioDB();
    await db.delete(STORE_NAME, 'active_blob');
}

export function getBlobDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
        const audio = new Audio();
        const url = URL.createObjectURL(blob);
        audio.src = url;
        audio.addEventListener('loadedmetadata', () => {
            URL.revokeObjectURL(url);
            resolve(audio.duration);
        });
        audio.addEventListener('error', () => {
            URL.revokeObjectURL(url);
            resolve(0);
        });
        // Fallback if metadata never loads (e.g. invalid blob)
        setTimeout(() => resolve(0), 1000);
    });
}
