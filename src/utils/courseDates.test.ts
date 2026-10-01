import { describe, expect, it } from 'vitest';
import type { Course } from '@/types/course';
import { getFutureCourseDates, isCourseInactive } from './courseDates';

const baseCourse = (overrides: Partial<Course> = {}): Course => ({
	id: 'c1',
	name: 'Test',
	slug: 'test',
	description: 'Opis testowy szkolenia',
	price: 100,
	hours: 4,
	tags: [],
	level: 'basic',
	...overrides,
});

describe('isCourseInactive', () => {
	it('is false when unset or false', () => {
		expect(isCourseInactive({})).toBe(false);
		expect(isCourseInactive({ inactive: false })).toBe(false);
	});

	it('is true only when explicitly true', () => {
		expect(isCourseInactive({ inactive: true })).toBe(true);
	});
});

describe('getFutureCourseDates', () => {
	it('skips inactive courses', () => {
		const courses = [
			baseCourse({
				id: 'active',
				dates: [{ id: 'd1', date: '2099-01-01', timeStart: '10:00', slotsMax: 4, participants: [], instructor: { id: 'i', name: 'A', slug: 'a', bio: '' }, place: { id: 'p', name: 'P', slug: 'p', googleMapsLink: '' } }],
			}),
			baseCourse({
				id: 'inactive',
				inactive: true,
				dates: [{ id: 'd2', date: '2099-02-01', timeStart: '10:00', slotsMax: 4, participants: [], instructor: { id: 'i', name: 'A', slug: 'a', bio: '' }, place: { id: 'p', name: 'P', slug: 'p', googleMapsLink: '' } }],
			}),
		];
		const upcoming = getFutureCourseDates(courses);
		expect(upcoming).toHaveLength(1);
		expect(upcoming[0]?.course.id).toBe('active');
	});
});
