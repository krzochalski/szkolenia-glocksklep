import { describe, expect, it } from 'vitest';
import type { Course } from '@/types/course';
import {
	getCourseKind,
	getPrerequisiteCourseIds,
	isEligibleForCourse,
	resolvePrerequisiteNames,
} from './courseKind';

const base = {
	id: 'c1',
	name: 'Podstawy',
	slug: 'podstawy',
	description: 'Opis szkolenia podstawowego.',
	price: 100,
	hours: 4,
	tags: [] as string[],
	level: 'basic' as const,
};

describe('courseKind', () => {
	it('defaults missing kind to course', () => {
		expect(getCourseKind({} as Course)).toBe('course');
		expect(getCourseKind({ kind: 'course' })).toBe('course');
		expect(getCourseKind({ kind: 'practice' })).toBe('practice');
	});

	it('ignores prerequisite ids for course kind', () => {
		expect(
			getPrerequisiteCourseIds({
				kind: 'course',
				prerequisiteCourseIds: ['a', 'b'],
			})
		).toEqual([]);
	});

	it('returns prerequisite ids for practice', () => {
		expect(
			getPrerequisiteCourseIds({
				kind: 'practice',
				prerequisiteCourseIds: ['a', 'b'],
			})
		).toEqual(['a', 'b']);
	});

	it('treats empty prereqs as eligible', () => {
		expect(isEligibleForCourse({ kind: 'practice', prerequisiteCourseIds: [] }, new Set())).toBe(
			true
		);
		expect(isEligibleForCourse({ kind: 'course' }, new Set())).toBe(true);
	});

	it('requires all prerequisite completions', () => {
		const practice = { kind: 'practice' as const, prerequisiteCourseIds: ['a', 'b'] };
		expect(isEligibleForCourse(practice, new Set(['a']))).toBe(false);
		expect(isEligibleForCourse(practice, new Set(['a', 'b']))).toBe(true);
	});

	it('resolves prerequisite names from catalog', () => {
		const practice: Pick<Course, 'kind' | 'prerequisiteCourseIds'> = {
			kind: 'practice',
			prerequisiteCourseIds: ['a', 'missing'],
		};
		expect(
			resolvePrerequisiteNames(practice, [
				{ ...base, id: 'a', name: 'Kurs A' },
				{ ...base, id: 'b', name: 'Kurs B' },
			])
		).toEqual(['Kurs A', 'missing']);
	});
});
