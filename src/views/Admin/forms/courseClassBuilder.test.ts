import type { CourseClass } from '@/types/course';
import { describe, expect, it } from 'vitest';
import { buildNewCourseClass, courseClassWriteSchema } from './courseClassBuilder';

const source = (): CourseClass => ({
	id: 'src',
	date: '2025-01-10',
	timeStart: '18:00',
	slotsMax: 4,
	minParticipants: 3,
	minDecisionBy: '2025-01-03',
	subtitle: 'dry-fire: reset z kabury',
	customPrice: 120,
	participants: [{ id: 'u1', name: 'Ada', email: 'a@b.c' }],
	instructor: {
		id: 'i1',
		name: 'Piotr',
		slug: 'piotr',
		bio: 'bio',
		email: 'p@x.pl',
	},
	place: {
		id: 'p1',
		name: 'Rankor',
		slug: 'rankor',
		googleMapsLink: 'https://maps.example',
	},
});

describe('buildNewCourseClass', () => {
	it('passes the shared write schema with empty roster', () => {
		const created = buildNewCourseClass({
			id: 'new-1',
			date: '2099-03-01',
			timeStart: '09:00',
			slotsMax: 8,
			minParticipants: 4,
			minDecisionBy: '2099-02-22',
			instructor: source().instructor,
			place: source().place,
			subtitle: 'IDPA',
		});
		expect(courseClassWriteSchema.safeParse(created).success).toBe(true);
		expect(created.participants).toEqual([]);
		expect(created.canceled).toBeUndefined();
		expect(created.waitlistNotifiedAt).toBeUndefined();
	});
});
