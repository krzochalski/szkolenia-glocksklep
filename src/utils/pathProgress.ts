import type { DevelopmentPathDocument } from '@/types/developmentPath';

export type NextPathStep = {
	courseSlug: string;
	label?: string;
	trackTitle: string;
};

/**
 * First path step (tracks → levels → items) whose slug is not completed.
 * Returns `null` when the path is empty or every step is done.
 */
export const findNextPathStep = (
	pathDoc: DevelopmentPathDocument | null | undefined,
	completedSlugs: ReadonlySet<string>
): NextPathStep | null => {
	if (!pathDoc) return null;
	for (const track of pathDoc.paths) {
		for (const level of track.levels) {
			for (const item of level.items) {
				if (!completedSlugs.has(item.courseSlug)) {
					return {
						courseSlug: item.courseSlug,
						label: item.label,
						trackTitle: track.title,
					};
				}
			}
		}
	}
	return null;
};
