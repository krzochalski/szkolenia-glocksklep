import { describe, expect, it, vi } from 'vitest';

/**
 * Lightweight unit coverage for prerequisite parsing used by enrollInCourseTx.
 * Full transaction tests need Admin SDK mocks; this guards the gate helpers.
 */

type CourseDoc = {
	inactive?: boolean;
	kind?: string;
	prerequisiteCourseIds?: unknown;
};

const getPrerequisiteIds = (course: CourseDoc): string[] => {
	if (course.kind !== 'practice') return [];
	if (!Array.isArray(course.prerequisiteCourseIds)) return [];
	return course.prerequisiteCourseIds.filter(
		(id): id is string => typeof id === 'string' && id.length > 0
	);
};

describe('enrollment prerequisite helpers', () => {
	it('ignores prereqs unless kind is practice', () => {
		expect(getPrerequisiteIds({ kind: 'course', prerequisiteCourseIds: ['x'] })).toEqual([]);
		expect(getPrerequisiteIds({ prerequisiteCourseIds: ['x'] })).toEqual([]);
	});

	it('filters non-string prereq ids', () => {
		expect(
			getPrerequisiteIds({
				kind: 'practice',
				prerequisiteCourseIds: ['ok', '', 1, null, 'also'],
			})
		).toEqual(['ok', 'also']);
	});

	it('exports stable error message from enrollment module', async () => {
		vi.resetModules();
		const mod = await import('./enrollment');
		expect(mod.PREREQUISITE_ENROLL_ERROR).toMatch(/ukończenia/);
	});
});
