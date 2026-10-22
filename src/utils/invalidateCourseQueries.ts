import type { QueryClient } from '@tanstack/react-query';

/**
 * Refresh catalog + every `['course', …]` cache (admin id and public slug).
 * Call after any write that changes a course document or its nested dates.
 */
export const invalidateCourseQueries = (queryClient: QueryClient): Promise<void> =>
	Promise.all([
		queryClient.invalidateQueries({ queryKey: ['courses'] }),
		queryClient.invalidateQueries({ queryKey: ['course'] }),
	]).then(() => undefined);
