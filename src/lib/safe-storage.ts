/**
 * Web Storage that never throws.
 *
 * `localStorage` / `sessionStorage` throw in some private-browsing modes, when
 * storage is disabled by policy, and when the quota is full. Every read here
 * degrades to "nothing stored" and every write to a no-op, so a storage
 * failure costs a remembered preference, never a crashed component.
 *
 * Keys should carry a version suffix (`name:v1`) so a later change to the
 * stored shape can migrate instead of misreading an old value.
 */

type StorageKind = 'local' | 'session'

function storage(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readStorage(key: string, kind: StorageKind = 'local'): string | null {
  try {
    return storage(kind)?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string, kind: StorageKind = 'local'): void {
  try {
    storage(kind)?.setItem(key, value)
  } catch {
    // Quota exceeded or storage disabled: the value lives for this page only.
  }
}

export function removeStorage(key: string, kind: StorageKind = 'local'): void {
  try {
    storage(kind)?.removeItem(key)
  } catch {
    // Nothing to do.
  }
}

/** Read a JSON value, returning `fallback` when missing, unreadable or malformed. */
export function readStorageJSON<T>(key: string, fallback: T, kind: StorageKind = 'local'): T {
  const raw = readStorage(key, kind)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorageJSON(key: string, value: unknown, kind: StorageKind = 'local'): void {
  try {
    writeStorage(key, JSON.stringify(value), kind)
  } catch {
    // JSON.stringify can throw on cycles; treat like a failed write.
  }
}
