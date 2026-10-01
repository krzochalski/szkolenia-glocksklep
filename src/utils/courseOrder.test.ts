import { describe, expect, it } from 'vitest';
import type { Course } from '@/types/course';
import {
	compareCoursesByLegacyCatalogOrder,
	compareCoursesByOrder,
	coursesNeedOrderBackfill,
	sortCoursesByOrder,
} from './courseOrder';

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

describe('compareCoursesByOrder', () => {
	it('sorts by ascending order', () => {
		const a = baseCourse({ id: 'a', name: 'A', order: 2 });
		const b = baseCourse({ id: 'b', name: 'B', order: 0 });
		expect(compareCoursesByOrder(a, b)).toBeGreaterThan(0);
		expect(sortCoursesByOrder([a, b]).map((c) => c.id)).toEqual(['b', 'a']);
	});

	it('puts missing order last', () => {
		const withOrder = baseCourse({ id: 'ordered', name: 'Z', order: 1 });
		const without = baseCourse({ id: 'missing', name: 'A' });
		expect(compareCoursesByOrder(without, withOrder)).toBeGreaterThan(0);
		expect(sortCoursesByOrder([without, withOrder]).map((c) => c.id)).toEqual([
			'ordered',
			'missing',
		]);
	});

	it('uses Polish name as tiebreaker', () => {
		const a = baseCourse({ id: 'a', name: 'Ćma', order: 1 });
		const b = baseCourse({ id: 'b', name: 'Alfa', order: 1 });
		expect(compareCoursesByOrder(a, b)).toBeGreaterThan(0);
	});
});

describe('compareCoursesByLegacyCatalogOrder', () => {
	it('sorts by level then name', () => {
		const advanced = baseCourse({ id: 'adv', name: 'A', level: 'advanced' });
		const basicZ = baseCourse({ id: 'bz', name: 'Zulu', level: 'basic' });
		const basicA = baseCourse({ id: 'ba', name: 'Alfa', level: 'basic' });
		const sorted = [advanced, basicZ, basicA].sort(compareCoursesByLegacyCatalogOrder);
		expect(sorted.map((c) => c.id)).toEqual(['ba', 'bz', 'adv']);
	});
});

describe('coursesNeedOrderBackfill', () => {
	it('is true when any course lacks numeric order', () => {
		expect(coursesNeedOrderBackfill([baseCourse({ order: 0 }), baseCourse({ id: 'x' })])).toBe(
			true
		);
		expect(coursesNeedOrderBackfill([baseCourse({ order: 0 }), baseCourse({ id: 'x', order: 1 })])).toBe(
			false
		);
	});
});
