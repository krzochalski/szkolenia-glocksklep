import { QueryClient } from '@tanstack/react-query';
import type { Auth, User } from 'firebase/auth';
import { describe, expect, it, vi } from 'vitest';

import { invalidateLiveQueries, runResumeSync } from './resumeSync';

describe('resumeSync', () => {
	it('invalidateLiveQueries hits live key prefixes', async () => {
		const queryClient = new QueryClient();
		const spy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

		await invalidateLiveQueries(queryClient);

		expect(spy).toHaveBeenCalledWith({ queryKey: ['courses'] });
		expect(spy).toHaveBeenCalledWith({ queryKey: ['course'] });
		expect(spy).toHaveBeenCalledWith({ queryKey: ['waitingList'] });
		expect(spy).toHaveBeenCalledWith({ queryKey: ['adminWaitingList'] });
	});

	it('runResumeSync invalidates and force-refreshes ID token', async () => {
		const queryClient = new QueryClient();
		vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
		const getIdToken = vi.fn().mockResolvedValue('token');
		const auth = {
			currentUser: { getIdToken } as unknown as User,
		} as Auth;

		await runResumeSync({ queryClient, auth });

		expect(getIdToken).toHaveBeenCalledWith(true);
	});

	it('runResumeSync skips token refresh when signed out', async () => {
		const queryClient = new QueryClient();
		const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
		const auth = { currentUser: null } as Auth;

		await runResumeSync({ queryClient, auth });

		expect(invalidate).toHaveBeenCalled();
	});
});
