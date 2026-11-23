import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	CHUNK_RELOAD_STORAGE_KEY,
	clearChunkReloadGuard,
	fetchRemoteBuildId,
	isChunkLoadFailure,
	isNewerBuildAvailable,
	shouldReloadForChunkError,
} from './appVersion';

describe('isNewerBuildAvailable', () => {
	it('detects mismatch', () => {
		expect(isNewerBuildAvailable('abc', 'def')).toBe(true);
	});

	it('ignores same build', () => {
		expect(isNewerBuildAvailable('abc', 'abc')).toBe(false);
	});

	it('ignores missing or unknown remote', () => {
		expect(isNewerBuildAvailable('abc', null)).toBe(false);
		expect(isNewerBuildAvailable('abc', 'unknown')).toBe(false);
		expect(isNewerBuildAvailable('unknown', 'def')).toBe(false);
	});
});

describe('fetchRemoteBuildId', () => {
	it('returns buildId from JSON', async () => {
		const fetcher = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ buildId: 'build-1' }),
		});
		await expect(fetchRemoteBuildId(fetcher as unknown as typeof fetch)).resolves.toBe(
			'build-1'
		);
	});

	it('returns null on failure', async () => {
		const fetcher = vi.fn().mockRejectedValue(new Error('network'));
		await expect(fetchRemoteBuildId(fetcher as unknown as typeof fetch)).resolves.toBeNull();
	});
});

describe('chunk reload guard', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('allows one reload then blocks', () => {
		const store = new Map<string, string>();
		const storage = {
			getItem: (k: string) => store.get(k) ?? null,
			setItem: (k: string, v: string) => {
				store.set(k, v);
			},
			removeItem: (k: string) => {
				store.delete(k);
			},
		};

		expect(shouldReloadForChunkError(storage)).toBe(true);
		expect(store.get(CHUNK_RELOAD_STORAGE_KEY)).toBe('1');
		expect(shouldReloadForChunkError(storage)).toBe(false);
		clearChunkReloadGuard(storage);
		expect(shouldReloadForChunkError(storage)).toBe(true);
	});

	it('detects ChunkLoadError shapes', () => {
		expect(isChunkLoadFailure(new Error('Loading chunk 123 failed'))).toBe(true);
		expect(
			isChunkLoadFailure(new Error('Failed to fetch dynamically imported module'))
		).toBe(true);
		const named = new Error('boom');
		named.name = 'ChunkLoadError';
		expect(isChunkLoadFailure(named)).toBe(true);
		expect(isChunkLoadFailure(new Error('unrelated'))).toBe(false);
	});
});
