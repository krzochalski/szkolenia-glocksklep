import type { CourseClass } from '@/types/course';
import { describe, expect, it } from 'vitest';
import {
	buildClonedCourseClass,
	buildNewCourseClass,
	courseClassWriteSchema,
} from './courseClassBuilder';

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
	canceled: true,
	runConfirmedDespiteMin: true,
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

describe('buildClonedCourseClass', () => {
	it('passes the shared write schema and resets per-term fields', () => {
		const cloned = buildClonedCourseClass(source(), {
			newId: 'clone-1',
			date: '2026-12-01',
		});
		expect(courseClassWriteSchema.safeParse(cloned).success).toBe(true);
		expect(cloned.id).toBe('clone-1');
		expect(cloned.date).toBe('2026-12-01');
		expect(cloned.participants).toEqual([]);
		expect(cloned.canceled).toBeUndefined();
		expect(cloned.runConfirmedDespiteMin).toBeUndefined();
		expect(cloned.timeStart).toBe('18:00');
		expect(cloned.slotsMax).toBe(4);
		expect(cloned.minParticipants).toBe(3);
		expect(cloned.subtitle).toBe('dry-fire: reset z kabury');
		expect(cloned.customPrice).toBe(120);
		expect(cloned.instructor.email).toBe('p@x.pl');
		expect(cloned.place.name).toBe('Rankor');
	});

	it('preserves the decision-deadline gap from the source term', () => {
		const cloned = buildClonedCourseClass(source(), {
			newId: 'clone-2',
			date: '2026-12-15',
		});
		// source: 2025-01-03 → 2025-01-10 = 7 days
		expect(cloned.minDecisionBy).toBe('2026-12-08');
	});

	it('rejects a non-YYYY-MM-DD date', () => {
		expect(() =>
			buildClonedCourseClass(source(), { newId: 'x', date: '01.12.2026' })
		).toThrow();
	});

	it('works for Trening Bezstrzałowy-style practice terms (no customPrice)', () => {
		const practice = source();
		practice.customPrice = undefined;
		practice.subtitle = 'Trening Bezstrzałowy';
		const cloned = buildClonedCourseClass(practice, {
			newId: 'bez-1',
			date: '2099-06-01',
		});
		expect(courseClassWriteSchema.safeParse(cloned).success).toBe(true);
		expect(cloned.customPrice).toBeUndefined();
		expect(cloned.subtitle).toBe('Trening Bezstrzałowy');
		expect(cloned.date).toBe('2099-06-01');
	});
});

describe('buildNewCourseClass', () => {
	it('matches the same Zod write schema as clone', () => {
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
	});
});
