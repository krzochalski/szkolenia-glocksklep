export const CHUNK_RELOAD_STORAGE_KEY = 'sg-chunk-reload';

export const getRunningBuildId = (): string =>
	process.env.NEXT_PUBLIC_APP_BUILD_ID?.trim() || 'unknown';

export type VersionPayload = {
	readonly buildId: string;
};

/** True when the server reports a different build than this tab is running. */
export const isNewerBuildAvailable = (
	runningBuildId: string,
	remoteBuildId: string | null | undefined
): boolean => {
	const remote = remoteBuildId?.trim();
	if (!remote || remote === 'unknown') return false;
	const running = runningBuildId.trim() || 'unknown';
	if (running === 'unknown') return false;
	return remote !== running;
};

export const fetchRemoteBuildId = async (
	fetcher: typeof fetch = fetch
): Promise<string | null> => {
	try {
		const res = await fetcher('/api/version', { cache: 'no-store' });
		if (!res.ok) return null;
		const data = (await res.json()) as VersionPayload;
		return typeof data.buildId === 'string' ? data.buildId : null;
	} catch {
		return null;
	}
};

export const shouldReloadForChunkError = (
	storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof sessionStorage !== 'undefined'
		? sessionStorage
		: null
): boolean => {
	if (!storage) return true;
	if (storage.getItem(CHUNK_RELOAD_STORAGE_KEY) === '1') return false;
	storage.setItem(CHUNK_RELOAD_STORAGE_KEY, '1');
	return true;
};

export const clearChunkReloadGuard = (
	storage: Pick<Storage, 'removeItem'> | null = typeof sessionStorage !== 'undefined'
		? sessionStorage
		: null
): void => {
	storage?.removeItem(CHUNK_RELOAD_STORAGE_KEY);
};

export const isChunkLoadFailure = (reason: unknown): boolean => {
	const message =
		reason instanceof Error
			? reason.message
			: typeof reason === 'string'
				? reason
				: reason && typeof reason === 'object' && 'message' in reason
					? String((reason as { message: unknown }).message)
					: '';
	const name = reason instanceof Error ? reason.name : '';
	return (
		name === 'ChunkLoadError' ||
		/Loading chunk [\d]+ failed/i.test(message) ||
		/Failed to fetch dynamically imported module/i.test(message) ||
		/error loading dynamically imported module/i.test(message)
	);
};
