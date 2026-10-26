import { describe, expect, it } from 'vitest';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
import {
	filterWaitingListEntries,
	groupWaitingListByCourse,
} from './adminWaitingListGroups';

const entry = (
	partial: Partial<CourseWaitingListEntry> & Pick<CourseWaitingListEntry, 'id' | 'courseId'>
): CourseWaitingListEntry => ({
	courseName: partial.courseName ?? `Course ${partial.courseId}`,
	courseSlug: partial.courseSlug ?? partial.courseId,
	userName: partial.userName ?? 'Jan',
	email: partial.email ?? 'jan@example.com',
	createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
	...partial,
});

describe('filterWaitingListEntries', () => {
	const list = [
		entry({ id: '1', courseId: 'a', userName: 'Anna Nowak', email: 'anna@ex.com' }),
		entry({ id: '2', courseId: 'b', userName: 'Piotr', email: 'piotr@glock.pl' }),
	];

	it('returns all when search empty', () => {
		expect(filterWaitingListEntries(list, '  ')).toHaveLength(2);
	});

	it('filters by name or email case-insensitively', () => {
		expect(filterWaitingListEntries(list, 'ANNA')).toEqual([list[0]]);
		expect(filterWaitingListEntries(list, 'GLOCK')).toEqual([list[1]]);
	});
});

describe('groupWaitingListByCourse', () => {
	it('groups by courseId and sorts FIFO within group', () => {
		const entries = [
			entry({
				id: 'c1_new',
				courseId: 'c1',
				courseName: 'Beta',
				createdAt: '2026-02-01T00:00:00.000Z',
				email: 'new@ex.com',
			}),
			entry({
				id: 'c1_old',
				courseId: 'c1',
				courseName: 'Beta',
				createdAt: '2026-01-01T00:00:00.000Z',
				email: 'old@ex.com',
			}),
			entry({
				id: 'c2_a',
				courseId: 'c2',
				courseName: 'Alfa',
				createdAt: '2026-01-15T00:00:00.000Z',
			}),
		];
		const groups = groupWaitingListByCourse(entries);
		expect(groups.map((g) => g.courseId)).toEqual(['c2', 'c1']);
		expect(groups[1]?.entries.map((e) => e.id)).toEqual(['c1_old', 'c1_new']);
	});

	it('keeps the same person on multiple courses as separate rows', () => {
		const email = 'same@ex.com';
		const groups = groupWaitingListByCourse([
			entry({ id: 'a_u', courseId: 'a', courseName: 'A', email, userId: 'u1' }),
			entry({ id: 'b_u', courseId: 'b', courseName: 'B', email, userId: 'u1' }),
		]);
		expect(groups).toHaveLength(2);
		expect(groups.flatMap((g) => g.entries)).toHaveLength(2);
	});
});
