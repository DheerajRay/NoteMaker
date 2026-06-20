const DATABASE_NAME = "notemaker-audio";
const DATABASE_VERSION = 1;
const ASSET_STORE = "assets";

export type StoredAudioAsset = {
  id: string;
  name: string;
  mimeType: string;
  durationSeconds: number;
  bytes: ArrayBuffer;
};

export async function saveImportedAudio(asset: StoredAudioAsset): Promise<void> {
  const database = await openDatabase();
  await requestResult(database.transaction(ASSET_STORE, "readwrite").objectStore(ASSET_STORE).put(asset));
  database.close();
}

export async function loadImportedAudio(id: string): Promise<StoredAudioAsset | null> {
  const database = await openDatabase();
  const result = await requestResult<StoredAudioAsset | undefined>(
    database.transaction(ASSET_STORE, "readonly").objectStore(ASSET_STORE).get(id)
  );
  database.close();
  return result ?? null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ASSET_STORE)) {
        request.result.createObjectStore(ASSET_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open audio storage."));
  });
}

function requestResult<T = IDBValidKey>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Audio storage request failed."));
  });
}
