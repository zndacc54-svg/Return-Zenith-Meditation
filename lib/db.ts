export interface MeditationSession {
  id?: number;
  date: string;
  durationSecs: number;
  mode: 'free' | 'timed';
  distractionCount: number;
  longestFocusSecs?: number;
  note: string;
}

const DB_NAME = 'meditation-db';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
      
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }
  return dbPromise;
}

export async function saveSession(session: Omit<MeditationSession, 'id'>): Promise<number> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(session);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getSessions(): Promise<MeditationSession[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const sessions = request.result as MeditationSession[];
      // Sort by date descending
      sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(sessions);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllSessions(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
