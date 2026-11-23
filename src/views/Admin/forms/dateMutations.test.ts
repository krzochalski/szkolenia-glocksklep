import type { CourseClass } from '@/types/course';
import { describe, expect, it } from 'vitest';
import { withClonedDate } from './cloneDate';
import { courseClassWriteSchema } from './courseClassBuilder';

const date = (id: string, extra?: Partial<CourseClass>): CourseClass =>
	({
		id,
		date: '2025-10-01',
		timeStart: '09:00',
		slotsMax: 8,
		minParticipants: 4,
		minDecisionBy: '2025-09-24',
		participants: [{ id: 'u1', name: 'Ada', email: 'a@b.c' }],
		canceled: true,
		instructor: { id: 'i', name: 'Piotr', slug: 'piotr', bio: '' },
		place: { id: 'p', name: 'Strzelnica', slug: 's', googleMapsLink: '' },
		...extra,
	}) as CourseClass;

describe('withClonedDate', () => {
	it('inserts a copy after the source with a new id, date, and empty roster', () => {
		const dates = [date('a'), date('b')];
		const next = withClonedDate(dates, 'a', 'clone', { newDate: '2099-11-01' });
		expect(next.map((d) => d.id)).toEqual(['a', 'clone', 'b']);
		expect(next[1].participants).toEqual([]);
		expect(next[1].canceled).toBeUndefined();
		expect(next[1].date).toBe('2099-11-01');
		expect(next[0].date).toBe('2025-10-01');
		expect(next[0].participants).toHaveLength(1);
		expect(courseClassWriteSchema.safeParse(next[1]).success).toBe(true);
	});

	it('returns the original list when the source date is missing', () => {
		const dates = [date('a')];
		expect(withClonedDate(dates, 'missing', 'clone', { newDate: '2099-01-01' })).toBe(dates);
	});
});
