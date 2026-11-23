import { describe, expect, it } from 'vitest';

import {
	liveInitialData,
	liveQueryOptions,
	queryClient,
	staticQueryOptions,
} from './queryClient';

describe('queryClient defaults', () => {
	it('uses live defaults on the shared client', () => {
		const defaults = queryClient.getDefaultOptions().queries;
		expect(defaults?.staleTime).toBe(liveQueryOptions.staleTime);
		expect(defaults?.refetchOnWindowFocus).toBe(true);
		expect(defaults?.refetchOnReconnect).toBe(true);
	});

	it('keeps static options longer-lived without focus refetch', () => {
		expect(staticQueryOptions.staleTime).toBeGreaterThan(liveQueryOptions.staleTime);
		expect(staticQueryOptions.refetchOnWindowFocus).toBe(false);
	});

	it('liveInitialData marks seed as immediately stale', () => {
		expect(liveInitialData(undefined)).toEqual({});
		expect(liveInitialData(['a'])).toEqual({
			initialData: ['a'],
			initialDataUpdatedAt: 0,
		});
	});
});
