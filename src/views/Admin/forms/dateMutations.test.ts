import type { CourseClass } from '@/types/course';
import { describe, expect, it } from 'vitest';
import { withClonedDate } from './cloneDate';

const date = (id: string, extra?: Partial<CourseClass>): CourseClass =>
	({
		id,
		date: '2026-10-01',
		timeStart: '09:00',
		slotsMax: 8,
		participants: [{ id: 'u1', name: 'Ada', email: 'a@b.c' }],
		canceled: true,
		instructor: { id: 'i', name: 'Piotr', slug: 'piotr', bio: '' },
		place: { id: 'p', name: 'Strzelnica', slug: 's', googleMapsLink: '' },
		...extra,
	}) as CourseClass;

describe('withClonedDate', () => {
	it('inserts a copy after the source with a new id and empty roster', () => {
		const dates = [date('a'), date('b')];
		const next = withClonedDate(dates, 'a', 'clone');
		expect(next.map((d) => d.id)).toEqual(['a', 'clone', 'b']);
		expect(next[1].participants).toEqual([]);
		expect(next[1].canceled).toBeUndefined();
		expect(next[0].participants).toHaveLength(1);
	});

	it('returns the original list when the source date is missing', () => {
		const dates = [date('a')];
		expect(withClonedDate(dates, 'missing', 'clone')).toBe(dates);
	});
});
