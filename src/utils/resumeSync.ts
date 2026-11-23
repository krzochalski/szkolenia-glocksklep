import type { QueryClient } from '@tanstack/react-query';

import type { Auth } from 'firebase/auth';

/** Query key prefixes that must refresh after iOS/tab resume. */
export const LIVE_QUERY_KEY_PREFIXES = [
	'courses',
	'course',
	'waitingList',
	'adminWaitingList',
] as const;

export type ResumeSyncDeps = {
	readonly queryClient: QueryClient;
	readonly auth: Auth;
	readonly refreshToken?: boolean;
};

export const invalidateLiveQueries = (queryClient: QueryClient): Promise<void> =>
	Promise.all(
		LIVE_QUERY_KEY_PREFIXES.map((prefix) =>
			queryClient.invalidateQueries({ queryKey: [prefix] })
		)
	).then(() => undefined);

export const runResumeSync = async ({
	queryClient,
	auth,
	refreshToken = true,
}: ResumeSyncDeps): Promise<void> => {
	const tasks: Promise<unknown>[] = [invalidateLiveQueries(queryClient)];
	if (refreshToken && auth.currentUser) {
		tasks.push(auth.currentUser.getIdToken(true).catch(() => undefined));
	}
	await Promise.all(tasks);
};
