/** The slice of `navigator.storage` we use. Injectable so tests need no browser. */
export interface StorageManagerLike {
  persist?: () => Promise<boolean>;
  persisted?: () => Promise<boolean>;
}

/**
 * Ask the browser not to evict this origin's storage under pressure. Called once
 * at start-up. Feature-detected, never throws, never blocks rendering (callers
 * should not await it), and skipped when storage is already persistent.
 * Resolves true only when the browser reports persistent storage.
 */
export async function requestPersistentStorage(
  manager: StorageManagerLike | undefined = typeof navigator === 'undefined' ? undefined : navigator.storage,
): Promise<boolean> {
  try {
    if (!manager || typeof manager.persist !== 'function') return false;
    if (typeof manager.persisted === 'function' && (await manager.persisted())) return true;
    return (await manager.persist()) === true;
  } catch {
    // Unsupported, denied or rejected: progress still lives in localStorage as before.
    return false;
  }
}
