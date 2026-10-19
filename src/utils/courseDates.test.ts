import { describe, expect, it } from 'vitest';
import type { Course, CourseClass } from '@/types/course';
import {
	formatSlotsMeta,
	formatWaitingListDemand,
	getFutureCourseDates,
	isCourseInactive,
	isLowSlotsLeft,
} from './courseDates';

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

const stubDate = (overrides: Partial<CourseClass> = {}): CourseClass => ({
	id: 'd1',
	date: '2099-01-01',
	timeStart: '10:00',
	slotsMax: 8,
	participants: [],
	instructor: { id: 'i', name: 'A', slug: 'a', bio: '' },
	place: { id: 'p', name: 'P', slug: 'p', googleMapsLink: '' },
	...overrides,
});

describe('isLowSlotsLeft / formatSlotsMeta', () => {
	it('flags scarce seats and appends ostatnie miejsca', () => {
		expect(isLowSlotsLeft(0)).toBe(false);
		expect(isLowSlotsLeft(1)).toBe(true);
		expect(isLowSlotsLeft(3)).toBe(true);
		expect(isLowSlotsLeft(4)).toBe(false);

		const low = stubDate({
			slotsMax: 8,
			participants: [{ id: 'u1', name: 'A', email: 'a@b.c' }, { id: 'u2', name: 'B', email: 'b@b.c' }, { id: 'u3', name: 'C', email: 'c@b.c' }, { id: 'u4', name: 'D', email: 'd@b.c' }, { id: 'u5', name: 'E', email: 'e@b.c' }],
		});
		expect(formatSlotsMeta(low)).toBe('wolne: 3 · ostatnie miejsca');
		expect(formatSlotsMeta(stubDate({ slotsMax: 8, participants: [] }))).toBe('wolne: 8');
	});
});

describe('formatWaitingListDemand', () => {
	it('uses Polish plural forms', () => {
		expect(formatWaitingListDemand(1)).toBe('1 osoba już czeka na nowy termin.');
		expect(formatWaitingListDemand(2)).toBe('2 osoby już czekają na nowy termin.');
		expect(formatWaitingListDemand(5)).toBe('5 osób już czeka na nowy termin.');
		expect(formatWaitingListDemand(22)).toBe('22 osoby już czekają na nowy termin.');
		expect(formatWaitingListDemand(12)).toBe('12 osób już czeka na nowy termin.');
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
