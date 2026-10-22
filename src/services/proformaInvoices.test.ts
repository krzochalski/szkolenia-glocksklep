import { describe, expect, it } from 'vitest';
import type { CourseClass } from '@/types/course';
import { courseCodeFromName, generateProformaNumber } from './proformaInvoices';

const dateEntry = {
	id: 'd1',
	date: '2026-10-18',
	timeStart: '10:00',
	slotsMax: 8,
	participants: [],
	instructor: { id: 'i', name: 'Piotr', slug: 'piotr', bio: '' },
	place: { id: 'p', name: 'Czacz', slug: 'czacz', googleMapsLink: '' },
} satisfies CourseClass;

describe('proformaInvoices', () => {
	it('builds course codes from multi-word names', () => {
		expect(courseCodeFromName({ name: 'Movement Fundamentals', slug: '' })).toBe('MF');
		expect(courseCodeFromName({ name: 'Dry-fire reset', slug: 'dry-fire-reset' })).toBe('DFR');
	});

	it('includes SZK/TRN + course code + buyer initials in the number', () => {
		expect(
			generateProformaNumber(
				{ name: 'Movement Fundamentals', slug: 'movement-fundamentals', kind: 'course' },
				{ displayName: 'Piotr Krzoska', email: 'zamowienia@glocksklep.pl' },
				dateEntry
			)
		).toBe('PF/SZK-MF-PK/10/2026');

		expect(
			generateProformaNumber(
				{ name: 'Dry-fire reset', slug: 'dry-fire-reset', kind: 'practice' },
				{ displayName: 'Ada Nowak', email: 'ada@example.com' },
				dateEntry
			)
		).toBe('PF/TRN-DFR-AN/10/2026');
	});
});
