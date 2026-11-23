import { QueryClient, type QueryObserverOptions } from '@tanstack/react-query';

/** Live catalog / seats / prices / registration. */
export const liveQueryOptions = {
	staleTime: 30 * 1000,
	gcTime: 60 * 60 * 1000,
	refetchOnWindowFocus: true,
	refetchOnReconnect: true,
	retry: 1,
} as const satisfies Partial<QueryObserverOptions>;

/** CMS / copy that can lag without hurting enrollments. */
export const staticQueryOptions = {
	staleTime: 10 * 60 * 1000,
	gcTime: 60 * 60 * 1000,
	refetchOnWindowFocus: false,
	refetchOnReconnect: true,
	retry: 1,
} as const satisfies Partial<QueryObserverOptions>;

/**
 * Seed RSC data for paint, but mark it immediately stale so live queries refetch.
 */
export const liveInitialData = <T>(
	data: T | undefined
): { initialData: T; initialDataUpdatedAt: number } | Record<string, never> =>
	data !== undefined ? { initialData: data, initialDataUpdatedAt: 0 } : {};

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			...liveQueryOptions,
		},
	},
});
