import { describe, expect, it } from 'vitest';
import type { Course, CourseClass, Participant } from '@/types/course';
import {
	defaultMinDecisionBy,
	formatMinParticipantsMeta,
	formatPublicMinParticipantsHint,
	getCourseMinDecisionDaysBefore,
	getCourseMinParticipants,
	resolveDateMinDecisionBy,
	resolveDateMinParticipants,
	resolveSessionStatus,
	signedUpCount,
} from './minParticipants';

const participant = (id: string): Participant => ({
	id,
	name: 'Jan',
	email: `${id}@example.com`,
});

const dateEntry = (partial: Partial<CourseClass> & Pick<CourseClass, 'id' | 'date'>): CourseClass => ({
	slotsMax: 6,
	timeStart: '09:00',
	participants: [],
	instructor: { id: 'i1', name: 'Instr', slug: 'instr', bio: '' },
	place: { id: 'p1', name: 'P', slug: 'p', googleMapsLink: 'https://maps.example' },
	...partial,
});

const course = (partial: Partial<Course> = {}): Course => ({
	id: 'c1',
	name: 'Test',
	slug: 'test',
	description: '',
	price: 100,
	hours: 8,
	tags: [],
	level: 'basic',
	...partial,
});

describe('getCourseMinParticipants', () => {
	it('uses course field when set', () => {
		expect(getCourseMinParticipants(course({ minParticipants: 5 }))).toBe(5);
	});

	it('falls back to kind defaults', () => {
		expect(getCourseMinParticipants(course({ kind: 'course' }))).toBe(4);
		expect(getCourseMinParticipants(course({ kind: 'practice' }))).toBe(3);
	});
});

describe('getCourseMinDecisionDaysBefore / defaultMinDecisionBy', () => {
	it('defaults to 7 days', () => {
		expect(getCourseMinDecisionDaysBefore(course())).toBe(7);
		expect(defaultMinDecisionBy('2025-11-15', 7)).toBe('2025-11-08');
	});

	it('respects course override', () => {
		expect(getCourseMinDecisionDaysBefore(course({ minDecisionDaysBefore: 3 }))).toBe(3);
	});
});

describe('resolveDateMinParticipants', () => {
	it('prefers date field and caps at slotsMax', () => {
		expect(
			resolveDateMinParticipants(course({ minParticipants: 4 }), dateEntry({ id: 'd', date: '2025-11-01', minParticipants: 5, slotsMax: 6 }))
		).toBe(5);
		expect(
			resolveDateMinParticipants(course(), dateEntry({ id: 'd', date: '2025-11-01', minParticipants: 10, slotsMax: 4 }))
		).toBe(4);
	});

	it('falls back to course/kind when date missing field', () => {
		expect(
			resolveDateMinParticipants(course({ kind: 'practice' }), dateEntry({ id: 'd', date: '2025-11-01', slotsMax: 4 }))
		).toBe(3);
	});
});

describe('resolveDateMinDecisionBy', () => {
	it('uses date field when valid and not after session', () => {
		expect(
			resolveDateMinDecisionBy(
				course(),
				dateEntry({ id: 'd', date: '2025-11-15', minDecisionBy: '2025-11-10' })
			)
		).toBe('2025-11-10');
	});

	it('clamps deadline after session date', () => {
		expect(
			resolveDateMinDecisionBy(
				course(),
				dateEntry({ id: 'd', date: '2025-11-15', minDecisionBy: '2025-11-20' })
			)
		).toBe('2025-11-15');
	});

	it('computes from course days-before for legacy dates', () => {
		expect(
			resolveDateMinDecisionBy(
				course({ minDecisionDaysBefore: 7 }),
				dateEntry({ id: 'd', date: '2025-11-15' })
			)
		).toBe('2025-11-08');
	});
});

describe('resolveSessionStatus', () => {
	const base = dateEntry({
		id: 'd',
		date: '2025-11-20',
		slotsMax: 6,
		minParticipants: 4,
		minDecisionBy: '2025-11-13',
	});

	it('cancelled wins', () => {
		expect(
			resolveSessionStatus({
				date: { ...base, canceled: true, participants: [participant('a')] },
				today: '2025-11-01',
			})
		).toBe('cancelled');
	});

	it('at_risk before deadline when below min', () => {
		expect(
			resolveSessionStatus({
				date: { ...base, participants: [participant('a'), participant('b')] },
				today: '2025-11-01',
			})
		).toBe('at_risk');
	});

	it('needs_decision on/after deadline when below min', () => {
		expect(
			resolveSessionStatus({
				date: { ...base, participants: [participant('a')] },
				today: '2025-11-13',
			})
		).toBe('needs_decision');
	});

	it('open when at/above min', () => {
		expect(
			resolveSessionStatus({
				date: {
					...base,
					participants: [participant('a'), participant('b'), participant('c'), participant('d')],
				},
				today: '2025-11-14',
			})
		).toBe('open');
	});

	it('open when runConfirmedDespiteMin despite below min', () => {
		expect(
			resolveSessionStatus({
				date: {
					...base,
					runConfirmedDespiteMin: true,
					participants: [participant('a')],
				},
				today: '2025-11-14',
			})
		).toBe('open');
	});

	it('full when seats exhausted and not below-min risk', () => {
		expect(
			resolveSessionStatus({
				date: {
					...base,
					slotsMax: 2,
					minParticipants: 2,
					participants: [participant('a'), participant('b')],
				},
				today: '2025-11-01',
			})
		).toBe('full');
	});

	it('past below-min dates are open not at_risk', () => {
		expect(
			resolveSessionStatus({
				date: { ...base, date: '2025-10-01', participants: [participant('a')] },
				today: '2025-11-01',
			})
		).toBe('open');
	});

	it('counts unpaid signups toward min', () => {
		expect(signedUpCount({ participants: [participant('a'), { ...participant('b'), paid: false }] })).toBe(2);
	});
});

describe('format helpers', () => {
	it('formats min meta', () => {
		expect(formatMinParticipantsMeta(3, 4)).toBe('3/4 min');
	});

	it('public hint only when below min future', () => {
		expect(
			formatPublicMinParticipantsHint(
				course({ minParticipants: 4 }),
				dateEntry({ id: 'd', date: '2025-11-20', minParticipants: 4, participants: [participant('a')] }),
				'2025-11-01'
			)
		).toBe('Termin wystartuje przy min. 4 osobach');
		expect(
			formatPublicMinParticipantsHint(
				course(),
				dateEntry({
					id: 'd',
					date: '2025-11-20',
					minParticipants: 2,
					participants: [participant('a'), participant('b')],
				}),
				'2025-11-01'
			)
		).toBeNull();
	});
});
