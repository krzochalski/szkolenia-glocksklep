import type { QueryClient } from '@tanstack/react-query';

import { auth } from '@services/auth';

/**
 * Ask Cloud Functions (admin) to purge Next catalog ISR.
 * Fire-and-forget; safe for non-admins (403 ignored).
 */
export const revalidateCatalogCache = async (slug?: string): Promise<void> => {
	try {
		const user = auth.currentUser;
		if (!user) return;
		const token = await user.getIdToken();
		await fetch('/api/revalidate-catalog', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(slug ? { slug } : {}),
		});
	} catch {
		/* ignore network / auth failures — RQ invalidation still applies */
	}
};

/**
 * Refresh catalog + every `['course', …]` cache (admin id and public slug).
 * Call after any write that changes a course document or its nested dates.
 * Also requests ISR revalidation when the caller is an admin.
 */
export const invalidateCourseQueries = (
	queryClient: QueryClient,
	options?: { readonly slug?: string; readonly revalidate?: boolean }
): Promise<void> => {
	const shouldRevalidate = options?.revalidate !== false;
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: ['courses'] }),
		queryClient.invalidateQueries({ queryKey: ['course'] }),
		shouldRevalidate ? revalidateCatalogCache(options?.slug) : Promise.resolve(),
	]).then(() => undefined);
};
