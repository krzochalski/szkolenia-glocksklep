import type { DevelopmentPathDocument } from '@/types/developmentPath';

export type NextPathStep = {
	courseSlug: string;
	label?: string;
	trackTitle: string;
};

export type CoursePathPlacement = {
	trackTitle: string;
	/** 1-based index within the track (same ordinal as ścieżka UI). */
	stepIndex: number;
	stepTotal: number;
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

/** First track placement for a course slug, or `null` if not on any path. */
export const findCoursePathPlacement = (
	pathDoc: DevelopmentPathDocument | null | undefined,
	courseSlug: string
): CoursePathPlacement | null => {
	if (!pathDoc || !courseSlug) return null;
	for (const track of pathDoc.paths) {
		const stepTotal = track.levels.reduce((n, level) => n + level.items.length, 0);
		let stepIndex = 0;
		for (const level of track.levels) {
			for (const item of level.items) {
				stepIndex += 1;
				if (item.courseSlug === courseSlug) {
					return { trackTitle: track.title, stepIndex, stepTotal };
				}
			}
		}
	}
	return null;
};

/** Compact fact value, e.g. `02/04 · Umiejętności techniczne`. */
export const formatCoursePathPlacement = (placement: CoursePathPlacement): string => {
	const index = String(placement.stepIndex).padStart(2, '0');
	const total = String(placement.stepTotal).padStart(2, '0');
	return `${index}/${total} · ${placement.trackTitle}`;
};
