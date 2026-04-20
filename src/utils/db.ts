const DB_NAME = 'dvinci'
const DB_VERSION = 2
const KV_STORE = 'kv'
const VIZ_STORE = 'visualizations'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (event) => {
      const db = req.result
      if (event.oldVersion < 1) db.createObjectStore(KV_STORE)
      if (event.oldVersion < 2) db.createObjectStore(VIZ_STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── KV store (legacy / misc) ─────────────────────────────────────────────────

export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KV_STORE, 'readonly')
    const req = tx.objectStore(KV_STORE).get(key)
    req.onsuccess = () => resolve((req.result as T) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KV_STORE, 'readwrite')
    const req = tx.objectStore(KV_STORE).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function idbDelete(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KV_STORE, 'readwrite')
    const req = tx.objectStore(KV_STORE).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// ── Visualizations store ─────────────────────────────────────────────────────

export async function vizGet<T>(id: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIZ_STORE, 'readonly')
    const req = tx.objectStore(VIZ_STORE).get(id)
    req.onsuccess = () => resolve((req.result as T) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function vizPut(value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIZ_STORE, 'readwrite')
    const req = tx.objectStore(VIZ_STORE).put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function vizDelete(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIZ_STORE, 'readwrite')
    const req = tx.objectStore(VIZ_STORE).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function vizGetAll<T>(): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIZ_STORE, 'readonly')
    const req = tx.objectStore(VIZ_STORE).getAll()
    req.onsuccess = () => resolve((req.result as T[]) ?? [])
    req.onerror = () => reject(req.error)
  })
}
