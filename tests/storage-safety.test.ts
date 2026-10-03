import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  emptyProgress,
  loadProgress,
  PROGRESS_BACKUP_KEY_PREFIX,
  saveProgress,
  type StorageAdapter,
} from '@tikerino/state';

import { requestPersistentStorage } from '../client/src/persistent-storage';

const KEY = 'tikerino.progress.v1';

function mapStorage(): StorageAdapter & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

const backups = (s: { map: Map<string, string> }): string[] =>
  [...s.map.entries()].filter(([k]) => k.startsWith(PROGRESS_BACKUP_KEY_PREFIX)).map(([, v]) => v);

describe('N3: unreadable progress is backed up before it can be overwritten', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invalid JSON: load then save keeps the exact original bytes in a backup', () => {
    const storage = mapStorage();
    const bad = '{"version":1,"subjectId":"s1","lessons":{ <<truncated';
    storage.setItem(KEY, bad);

    const loaded = loadProgress(storage, 's1');
    expect(loaded).toEqual(emptyProgress('s1'));
    expect(saveProgress(storage, loaded)).toBe(true);

    expect(storage.getItem(KEY)).not.toBe(bad); // main key was overwritten...
    expect(backups(storage)).toEqual([bad]); // ...but the bytes survive, once
  });

  it('unknown/future version: bytes preserved through load and save', () => {
    const storage = mapStorage();
    const future = JSON.stringify({ version: 2, subjectId: 's1', totalXp: 900, shiny: { new: 'shape' } }, null, 3);
    storage.setItem(KEY, future);

    saveProgress(storage, loadProgress(storage, 's1'));

    expect(backups(storage)).toEqual([future]);
  });

  it('a stored blob missing its subjectId is treated as invalid and backed up', () => {
    const storage = mapStorage();
    const raw = JSON.stringify({ version: 1, totalXp: 5 });
    storage.setItem(KEY, raw);
    loadProgress(storage, 's1');
    expect(backups(storage)).toEqual([raw]);
  });

  it('a second corruption does not overwrite the first backup', () => {
    const storage = mapStorage();
    const first = 'not json at all';
    const second = JSON.stringify({ version: 99, subjectId: 's1' });

    storage.setItem(KEY, first);
    saveProgress(storage, loadProgress(storage, 's1'));
    storage.setItem(KEY, second);
    saveProgress(storage, loadProgress(storage, 's1'));

    expect(backups(storage).sort()).toEqual([first, second].sort());
  });

  it('repeated loads of the same corrupt blob (merge-before-save, storage events) leave one backup', () => {
    const storage = mapStorage();
    storage.setItem(KEY, '{broken');
    loadProgress(storage, 's1');
    loadProgress(storage, 's1');
    saveProgress(storage, emptyProgress('s1'));
    expect(backups(storage)).toEqual(['{broken']);
  });

  it('never overwrites a backup key that holds different bytes', () => {
    const storage = mapStorage();
    storage.setItem(KEY, '{broken');
    loadProgress(storage, 's1');
    const [key] = [...storage.map.keys()].filter((k) => k.startsWith(PROGRESS_BACKUP_KEY_PREFIX));
    storage.map.set(key!, 'something else'); // simulate a colliding key
    loadProgress(storage, 's1');
    expect(storage.map.get(key!)).toBe('something else');
    expect(backups(storage).sort()).toEqual(['something else', '{broken'].sort());
  });

  it('a valid stored state creates no backup', () => {
    const storage = mapStorage();
    storage.setItem(KEY, JSON.stringify(emptyProgress('s1')));
    loadProgress(storage, 's1');
    saveProgress(storage, emptyProgress('s1'));
    expect(backups(storage)).toEqual([]);
  });

  it('empty storage creates no backup', () => {
    const storage = mapStorage();
    loadProgress(storage, 's1');
    expect(backups(storage)).toEqual([]);
  });

  it('a backup write that throws (quota) neither crashes nor blocks load, and warns', () => {
    const storage = mapStorage();
    storage.setItem(KEY, '{broken');
    const failing: StorageAdapter = {
      getItem: storage.getItem,
      removeItem: storage.removeItem,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(loadProgress(failing, 's1')).toEqual(emptyProgress('s1'));
    expect(console.warn).toHaveBeenCalled();
  });

  it('the Knowledge Index is still derived from the ledgers, not trusted from storage', () => {
    const storage = mapStorage();
    storage.setItem(KEY, JSON.stringify({ ...emptyProgress('s1'), knowledgeIndexXp: 9999 }));
    expect(loadProgress(storage, 's1').knowledgeIndexXp).toBe(0);
    expect(backups(storage)).toEqual([]);
  });
});

describe('N3: requestPersistentStorage', () => {
  it('calls persist() when available and not yet persisted', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    const persisted = vi.fn().mockResolvedValue(false);
    await expect(requestPersistentStorage({ persist, persisted })).resolves.toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('calls persist() when persisted() is not offered', async () => {
    const persist = vi.fn().mockResolvedValue(false);
    await expect(requestPersistentStorage({ persist })).resolves.toBe(false);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('does not ask again when already persisted', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    await expect(requestPersistentStorage({ persist, persisted: async () => true })).resolves.toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it('a missing navigator.storage or missing persist is a no-op, not an error', async () => {
    await expect(requestPersistentStorage(undefined)).resolves.toBe(false);
    await expect(requestPersistentStorage({})).resolves.toBe(false);
  });

  it('a rejected persist() or persisted() is swallowed', async () => {
    await expect(requestPersistentStorage({ persist: () => Promise.reject(new Error('denied')) })).resolves.toBe(false);
    const persist = vi.fn();
    await expect(
      requestPersistentStorage({ persist, persisted: () => Promise.reject(new Error('nope')) }),
    ).resolves.toBe(false);
  });

  it('a synchronously throwing persist() is swallowed', async () => {
    await expect(
      requestPersistentStorage({
        persist: () => {
          throw new Error('boom');
        },
      }),
    ).resolves.toBe(false);
  });
});
