import type { CourseClass } from '@/types/course';
import { describe, expect, it } from 'vitest';
import { toCreateDefaults } from './toCreateDefaults';

const source = (): CourseClass => ({
	id: 'src',
	date: '2025-01-10',
	timeStart: '18:00',
	slotsMax: 4,
	minParticipants: 3,
	minDecisionBy: '2025-01-03',
	subtitle: 'Trening Bezstrzałowy',
	customPrice: 120,
	participants: [{ id: 'u1', name: 'Ada', email: 'a@b.c' }],
	canceled: true,
	runConfirmedDespiteMin: true,
	waitlistNotifiedAt: '2026-01-01T00:00:00.000Z',
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

describe('toCreateDefaults', () => {
	it('prefills content fields and clears per-term state', () => {
		const defaults = toCreateDefaults(source());
		expect(defaults.date).toBe('');
		expect(defaults.minDecisionBy).toBe('');
		expect(defaults.timeStart).toBe('18:00');
		expect(defaults.slotsMax).toBe(4);
		expect(defaults.minParticipants).toBe(3);
		expect(defaults.subtitle).toBe('Trening Bezstrzałowy');
		expect(defaults.customPrice).toBe(120);
		expect(defaults._instructorId).toBe('i1');
		expect(defaults._placeId).toBe('p1');
		expect(defaults).not.toHaveProperty('id');
		expect(defaults).not.toHaveProperty('participants');
		expect(defaults).not.toHaveProperty('canceled');
		expect(defaults).not.toHaveProperty('waitlistNotifiedAt');
	});
});
